import { Controller, Get, Headers, HttpCode, Post, Query, RawBodyRequest, Req, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as crypto from "node:crypto";
import type { Request } from "express";
import { OpportunitySource } from "@mantra-os/db";
import { BusinessCodeService } from "../../../common/business-code/business-code.service";
import { SkipTenantContext } from "../../../common/decorators/skip-tenant-context.decorator";
import { TenantContextService } from "../../../common/context/tenant-context.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { mapLeadFieldData, MetaAdsService } from "../integrations/meta-ads.service";

const SYSTEM_ACTOR = "meta-lead-webhook";

interface MetaLeadgenChangeValue {
  leadgen_id: string;
  page_id: string;
  form_id?: string;
  ad_id?: string;
  adgroup_id?: string;
  created_time?: number;
}

interface MetaLeadWebhookPayload {
  entry?: Array<{
    id?: string;
    changes?: Array<{
      field: string;
      value: MetaLeadgenChangeValue;
    }>;
  }>;
}

/** Keeps only digits, same comparison rule as the WhatsApp webhook's phonesMatch. */
function digitsOnly(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

function phonesMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const da = digitsOnly(a);
  const db = digitsOnly(b);
  if (da.length < 7 || db.length < 7) return false;
  const [shorter, longer] = da.length <= db.length ? [da, db] : [db, da];
  return longer.endsWith(shorter);
}

/**
 * Public, unauthenticated: Meta's own servers call this, not a logged-in
 * MantraOS user — same reasoning as the WhatsApp and website-form
 * webhooks (@SkipTenantContext). See DECISIONS.md "WhatsApp lead capture"
 * for the pattern this follows.
 *
 * Which org a lead belongs to comes from `MetaLeadPage`, looked up by the
 * `page_id` every leadgen webhook payload carries — that model
 * deliberately has no RLS, same reasoning as `WhatsAppPhoneNumber`.
 *
 * The webhook payload itself only carries IDs, not the lead's actual
 * answers — those require a follow-up Graph API call per lead
 * (`fetchLeadDetails`), authorized with that Page's own access token.
 */
@Controller("v1/meta-leads")
@SkipTenantContext()
export class MetaLeadWebhookController {
  private readonly verifyToken: string;
  private readonly appSecret: string;

  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly businessCode: BusinessCodeService,
    private readonly metaAds: MetaAdsService,
  ) {
    // Deliberately not getOrThrow — see WhatsAppWebhookController's
    // constructor comment for why a missing env var here must not crash
    // the entire API. Falls back to the WhatsApp app secret since
    // leadgen and WhatsApp webhooks are typically configured under the
    // same Meta Developer App, just different subscription fields.
    this.verifyToken = config.get<string>("META_LEAD_WEBHOOK_VERIFY_TOKEN") ?? "";
    this.appSecret = config.get<string>("META_APP_SECRET") ?? config.get<string>("WHATSAPP_APP_SECRET") ?? "";
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
      throw new UnauthorizedException();
    }

    const payload = req.body as MetaLeadWebhookPayload;
    for (const entry of payload.entry ?? []) {
      for (const change of entry.changes ?? []) {
        if (change.field !== "leadgen" || !change.value?.leadgen_id) continue;
        await this.processLead(change.value, entry.id);
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

  private async processLead(value: MetaLeadgenChangeValue, entryPageId: string | undefined): Promise<void> {
    const pageId = value.page_id ?? entryPageId;
    if (!pageId) return;

    const pageRecord = await this.prisma.metaLeadPage.findUnique({ where: { pageId } });
    // Not a Page MantraOS knows about (or disconnected) — nothing to do.
    if (!pageRecord || !pageRecord.enabled) return;

    const { organizationId, companyId } = pageRecord;

    await this.prisma.$transaction(
      async (tx) => {
        // organizationId came from our own page lookup above, not raw input.
        await tx.$executeRawUnsafe(`SET LOCAL app.current_org_id = '${organizationId}'`);
        await this.tenantContext.run({ tx, organizationId, userId: SYSTEM_ACTOR }, async () => {
          // Idempotency: Meta may redeliver the same webhook if we don't
          // acknowledge fast enough.
          const alreadyProcessed = await tx.opportunity.findFirst({
            where: { organizationId, externalLeadId: value.leadgen_id },
          });
          if (alreadyProcessed) return;

          // The webhook payload only carries IDs — fetch the lead's actual
          // answers separately. If this call fails (expired token, Meta
          // outage), still create a bare Opportunity rather than silently
          // dropping the lead; a human can fill in the details from the
          // Meta Leads Center once notified.
          let details;
          try {
            details = await this.metaAds.fetchLeadDetails({
              leadgenId: value.leadgen_id,
              accessToken: pageRecord.pageAccessToken,
            });
          } catch {
            details = undefined;
          }

          const { name, email, phone, notes } = mapLeadFieldData(details?.field_data ?? []);

          // Email is an exact match; phone needs the same tolerant digit
          // comparison the WhatsApp webhook uses, so it's checked against
          // candidates in JS rather than in the WHERE clause.
          const matchedByEmail = email
            ? await tx.customer.findFirst({ where: { organizationId, email, deletedAt: null } })
            : null;
          const matchedByPhone =
            !matchedByEmail && phone
              ? (
                  await tx.customer.findMany({
                    where: { organizationId, phone: { not: null }, deletedAt: null },
                    select: { id: true, phone: true },
                  })
                ).find((c) => phonesMatch(c.phone, phone))
              : undefined;
          const matchedCustomer = matchedByEmail ?? matchedByPhone;

          const code = await this.businessCode.next("opportunity", { companyId });
          const displayName = name ?? phone ?? email ?? "Unknown";

          await tx.opportunity.create({
            data: {
              organizationId,
              companyId,
              code,
              customerId: matchedCustomer?.id,
              leadName: matchedCustomer ? undefined : name,
              leadEmail: matchedCustomer ? undefined : email,
              leadPhone: matchedCustomer ? undefined : phone,
              name: `Meta lead ad — ${displayName}`,
              source: OpportunitySource.META_LEAD_AD,
              externalLeadId: value.leadgen_id,
              utmSource: "meta",
              notes,
              createdBy: SYSTEM_ACTOR,
              updatedBy: SYSTEM_ACTOR,
            },
          });
        });
      },
      { timeout: 15000 },
    );
  }
}
