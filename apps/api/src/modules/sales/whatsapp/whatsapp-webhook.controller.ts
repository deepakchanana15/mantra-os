import { Controller, Get, Headers, HttpCode, Post, Query, RawBodyRequest, Req, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as crypto from "node:crypto";
import type { Request } from "express";
import { OpportunitySource, OpportunityStage } from "@mantra-os/db";
import { BusinessCodeService } from "../../../common/business-code/business-code.service";
import { SkipTenantContext } from "../../../common/decorators/skip-tenant-context.decorator";
import { TenantContextService } from "../../../common/context/tenant-context.service";
import { PrismaService } from "../../../prisma/prisma.service";

const SYSTEM_ACTOR = "whatsapp-webhook";
const CLOSED_STAGES: OpportunityStage[] = [OpportunityStage.WON, OpportunityStage.LOST];

interface WhatsAppMessageEvent {
  from: string;
  id: string;
  type: string;
  text?: { body: string };
}

interface WhatsAppWebhookPayload {
  entry?: Array<{
    changes?: Array<{
      field: string;
      value: {
        metadata?: { phone_number_id?: string };
        contacts?: Array<{ profile?: { name?: string }; wa_id: string }>;
        messages?: WhatsAppMessageEvent[];
      };
    }>;
  }>;
}

/** Keeps only digits, so "+61 466 242 222", "61466242222", and
 * "0466242222" can all be compared on a like-for-like basis. */
function digitsOnly(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

/** True if one number's digits end with the other's — tolerates a
 * missing/present country code or leading trunk zero, the most common
 * real-world formatting differences between what a Customer record has
 * on file and what WhatsApp reports as the sender. */
function phonesMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const da = digitsOnly(a);
  const db = digitsOnly(b);
  if (da.length < 7 || db.length < 7) return false;
  const [shorter, longer] = da.length <= db.length ? [da, db] : [db, da];
  return longer.endsWith(shorter);
}

function appendTranscriptLine(existingNotes: string | null, message: string): string {
  const timestamp = new Date().toISOString().replace("T", " ").slice(0, 16);
  const line = `[${timestamp}] ${message}`;
  return existingNotes ? `${existingNotes}\n${line}` : line;
}

/**
 * Public, unauthenticated: Meta's own servers call this, not a logged-in
 * MantraOS user — same reasoning as the website lead-intake and Brevo
 * webhooks (@SkipTenantContext). See DECISIONS.md "WhatsApp lead capture".
 *
 * Which org a message belongs to comes from `WhatsAppPhoneNumber`, looked
 * up by the `phone_number_id` every webhook payload carries — that model
 * deliberately has no RLS, same reasoning as `LeadIntakeKey`.
 *
 * A phone number's messages group into a single Opportunity until it
 * reaches Won or Lost — after that, the next message starts a fresh one,
 * re-checking the phone against existing Customers each time so a repeat
 * customer's new inquiry still auto-links. See DECISIONS.md for the
 * user's own framing of this rule.
 */
@Controller("v1/whatsapp")
@SkipTenantContext()
export class WhatsAppWebhookController {
  private readonly verifyToken: string;
  private readonly appSecret: string;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly businessCode: BusinessCodeService,
  ) {
    // Deliberately not getOrThrow: this controller is instantiated at
    // app bootstrap along with every other controller, so a missing env
    // var here would crash the ENTIRE API, not just WhatsApp routes —
    // exactly what happened the first time this deployed before the
    // Vercel env vars existed. Falling back to an empty string instead
    // means every WhatsApp request just fails signature/token
    // verification (401) until the real values are configured, which is
    // the correct failure mode for one still-unconfigured feature.
    this.verifyToken = config.get<string>("WHATSAPP_VERIFY_TOKEN") ?? "";
    this.appSecret = config.get<string>("WHATSAPP_APP_SECRET") ?? "";
  }

  /** Meta's one-time handshake when the webhook URL is configured/re-verified. */
  @Get("webhook")
  verify(
    @Query("hub.mode") mode: string | undefined,
    @Query("hub.verify_token") token: string | undefined,
    @Query("hub.challenge") challenge: string | undefined,
  ): string {
    if (mode === "subscribe" && token === this.verifyToken && challenge) {
      return challenge;
    }
    throw new UnauthorizedException();
  }

  @Post("webhook")
  @HttpCode(200)
  async receive(
    @Req() req: RawBodyRequest<Request>,
    @Headers("x-hub-signature-256") signature: string | undefined,
  ): Promise<{ ok: true }> {
    if (!this.isValidSignature(req.rawBody, signature)) {
      // TEMP DIAGNOSTIC — no secrets logged, remove after root-causing the
      // signature mismatch. See DECISIONS.md "WhatsApp deploy incident".
      console.error("[whatsapp-webhook-diagnostic]", {
        hasRawBody: !!req.rawBody,
        rawBodyLength: req.rawBody?.length ?? 0,
        hasSignatureHeader: !!signature,
        signatureHeaderLength: signature?.length ?? 0,
        appSecretConfiguredLength: this.appSecret.length,
      });
      throw new UnauthorizedException();
    }

    const payload = req.body as WhatsAppWebhookPayload;
    for (const entry of payload.entry ?? []) {
      for (const change of entry.changes ?? []) {
        if (change.field !== "messages" || !change.value.messages) continue;
        const phoneNumberId = change.value.metadata?.phone_number_id;
        if (!phoneNumberId) continue;

        for (const message of change.value.messages) {
          // V1: text messages only — images/voice notes/etc. are out of
          // scope until there's a concrete need to handle them.
          if (message.type !== "text" || !message.text) continue;
          const contact = change.value.contacts?.find((c) => c.wa_id === message.from);
          await this.processMessage({
            phoneNumberId,
            fromPhone: message.from,
            profileName: contact?.profile?.name,
            body: message.text.body,
            externalMessageId: message.id,
          });
        }
      }
    }

    return { ok: true };
  }

  private isValidSignature(rawBody: Buffer | undefined, signature: string | undefined): boolean {
    if (!rawBody || !signature) return false;
    const expected = `sha256=${crypto.createHmac("sha256", this.appSecret).update(rawBody).digest("hex")}`;
    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (signatureBuffer.length !== expectedBuffer.length) return false;
    return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
  }

  private async processMessage(params: {
    phoneNumberId: string;
    fromPhone: string;
    profileName?: string;
    body: string;
    externalMessageId: string;
  }): Promise<void> {
    const phoneRecord = await this.prisma.whatsAppPhoneNumber.findUnique({
      where: { phoneNumberId: params.phoneNumberId },
    });
    // Not a number MantraOS knows about (or disconnected) — nothing to do.
    if (!phoneRecord || !phoneRecord.enabled) return;

    const { organizationId, companyId } = phoneRecord;

    await this.prisma.$transaction(
      async (tx) => {
        // organizationId came from our own phone-number lookup above, not raw input.
        await tx.$executeRawUnsafe(`SET LOCAL app.current_org_id = '${organizationId}'`);
        await this.tenantContext.run({ tx, organizationId, userId: SYSTEM_ACTOR }, async () => {
          // Idempotency: Meta may redeliver the same webhook if we don't
          // acknowledge fast enough.
          const alreadyProcessed = await tx.whatsAppMessage.findUnique({
            where: { organizationId_externalMessageId: { organizationId, externalMessageId: params.externalMessageId } },
          });
          if (alreadyProcessed) return;

          const customerCandidates = await tx.customer.findMany({
            where: { organizationId, phone: { not: null }, deletedAt: null },
            select: { id: true, phone: true },
          });
          const existingCustomer = customerCandidates.find((c) => phonesMatch(c.phone, params.fromPhone));

          const openThreadCandidates = await tx.opportunity.findMany({
            where: { organizationId, source: OpportunitySource.WHATSAPP, stage: { notIn: CLOSED_STAGES } },
            include: { customer: { select: { phone: true } } },
            orderBy: { createdAt: "desc" },
          });
          const openThread = openThreadCandidates.find(
            (o) => phonesMatch(o.leadPhone, params.fromPhone) || phonesMatch(o.customer?.phone, params.fromPhone),
          );

          let opportunityId: string;
          if (openThread) {
            opportunityId = openThread.id;
            await tx.opportunity.update({
              where: { id: opportunityId },
              data: { notes: appendTranscriptLine(openThread.notes, params.body), updatedBy: SYSTEM_ACTOR },
            });
          } else {
            const code = await this.businessCode.next("opportunity", { companyId });
            const created = await tx.opportunity.create({
              data: {
                organizationId,
                companyId,
                code,
                customerId: existingCustomer?.id,
                leadName: existingCustomer ? undefined : (params.profileName ?? params.fromPhone),
                leadPhone: existingCustomer ? undefined : params.fromPhone,
                name: `WhatsApp lead — ${params.profileName ?? params.fromPhone}`,
                source: OpportunitySource.WHATSAPP,
                notes: appendTranscriptLine(null, params.body),
                createdBy: SYSTEM_ACTOR,
                updatedBy: SYSTEM_ACTOR,
              },
            });
            opportunityId = created.id;
          }

          await tx.whatsAppMessage.create({
            data: {
              organizationId,
              whatsappPhoneNumberId: phoneRecord.id,
              opportunityId,
              fromPhone: params.fromPhone,
              body: params.body,
              externalMessageId: params.externalMessageId,
            },
          });
        });
      },
      { timeout: 15000 },
    );
  }
}
