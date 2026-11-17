import { BadRequestException, Body, Controller, Headers, HttpCode, Post, UnauthorizedException } from "@nestjs/common";
import { OpportunitySource } from "@mantra-os/db";
import { BusinessCodeService } from "../../../common/business-code/business-code.service";
import { SkipTenantContext } from "../../../common/decorators/skip-tenant-context.decorator";
import { TenantContextService } from "../../../common/context/tenant-context.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { BrevoService } from "../../notifications/brevo/brevo.service";
import {
  ctaButton,
  renderEmailShell,
  resolveLanguage,
  resolveSiteLabel,
  whatsappButtons,
} from "../../notifications/brevo/email-template";
import { WelcomeRequestDto } from "./dto/welcome-request.dto";

const SYSTEM_ACTOR = "lead-intake";
const RATE_LIMIT_PER_HOUR = 30;
const RECENT_OPPORTUNITY_WINDOW_MS = 15 * 60 * 1000;

function welcomeBody(
  language: "en" | "de" | "nl",
  siteLabel: string,
  name: string,
  blogUrl: string | null,
): { subject: string; html: string } {
  const whatsapp = whatsappButtons(`Hi Mantra Sports, I just reached out via your website!`);
  const brand = siteLabel ? `Mantra Sports ${siteLabel}` : "Mantra Sports";

  if (language === "de") {
    const blog = blogUrl
      ? `<p style="font-size:15px;line-height:1.6;margin:20px 0 0;">Während du wartest, schau doch mal hier vorbei:</p>${ctaButton(blogUrl, "Zum Blog")}`
      : "";
    return {
      subject: `Hey ${name}, schön von dir zu hören! — ${brand}`,
      html: `
        <h1 style="font-size:23px;margin:0 0 16px;">Hey ${name}, schön von dir zu hören! 👋</h1>
        <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">Danke für deine Nachricht — sie ist gerade bei uns eingetrudelt und hat garantiert jemandem im Team ein Lächeln ins Gesicht gezaubert. Wir melden uns innerhalb von <strong>24 Stunden</strong> ausführlich bei dir.</p>
        <p style="font-size:15px;line-height:1.6;margin:0 0 8px;">Kann's nicht warten? Verständlich. Schreib uns direkt auf WhatsApp:</p>
        ${whatsapp}
        ${blog}
        <p style="font-size:15px;line-height:1.6;margin:28px 0 0;">Bis bald,<br><strong>Dein Mantra Sports Team</strong></p>`,
    };
  }

  if (language === "nl") {
    const blog = blogUrl
      ? `<p style="font-size:15px;line-height:1.6;margin:20px 0 0;">Terwijl je wacht, lees gerust even mee:</p>${ctaButton(blogUrl, "Naar de blog")}`
      : "";
    return {
      subject: `Hey ${name}, leuk je te spreken! — ${brand}`,
      html: `
        <h1 style="font-size:23px;margin:0 0 16px;">Hey ${name}, leuk je te spreken! 👋</h1>
        <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">Bedankt voor je bericht — die is zojuist bij ons binnengekomen en heeft gegarandeerd iemand van het team aan het lachen gemaakt. We nemen binnen <strong>24 uur</strong> uitgebreid contact met je op.</p>
        <p style="font-size:15px;line-height:1.6;margin:0 0 8px;">Kan het niet wachten? Helemaal begrijpelijk. Stuur ons direct een bericht via WhatsApp:</p>
        ${whatsapp}
        ${blog}
        <p style="font-size:15px;line-height:1.6;margin:28px 0 0;">Tot snel,<br><strong>Het Mantra Sports Team</strong></p>`,
    };
  }

  const blog = blogUrl
    ? `<p style="font-size:15px;line-height:1.6;margin:20px 0 0;">While you wait, here's something worth a read:</p>${ctaButton(blogUrl, "Read our blog")}`
    : "";
  return {
    subject: `Hey ${name}, good to meet you! — ${brand}`,
    html: `
      <h1 style="font-size:23px;margin:0 0 16px;">Hey ${name}, good to meet you! 👋</h1>
      <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">Thanks for dropping us a line — it just landed in our inbox and made someone on the team smile. We'll get back to you properly within <strong>24 hours</strong>.</p>
      <p style="font-size:15px;line-height:1.6;margin:0 0 8px;">Can't wait that long? Totally fair — tap below and chat with a real person on WhatsApp right now:</p>
      ${whatsapp}
      ${blog}
      <p style="font-size:15px;line-height:1.6;margin:28px 0 0;">Talk soon,<br><strong>The Mantra Sports Team</strong></p>`,
  };
}

/**
 * Public, same per-Company `LeadIntakeKey` auth as POST /v1/leads/intake and
 * /v1/leads/brochure. The B2C (GENERAL enquiry) counterpart to the brochure
 * endpoint: a "thanks for reaching out" email with a link to the company's
 * own blog, rather than a gated B2B PDF. Every site keeps its own existing
 * contact-form integration untouched — this just records that a welcome
 * email was also sent for whichever lead that integration just created.
 */
@Controller("v1/leads")
@SkipTenantContext()
export class WelcomeRequestController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly businessCode: BusinessCodeService,
    private readonly brevo: BrevoService,
  ) {}

  @Post("welcome")
  @HttpCode(200)
  async requestWelcome(@Headers("x-intake-key") intakeKey: string | undefined, @Body() dto: WelcomeRequestDto) {
    if (!intakeKey) {
      throw new UnauthorizedException();
    }
    const keyRecord = await this.prisma.leadIntakeKey.findUnique({ where: { key: intakeKey } });
    if (!keyRecord || !keyRecord.enabled) {
      throw new UnauthorizedException();
    }

    const { organizationId, companyId } = keyRecord;

    const result = await this.prisma.$transaction(
      async (tx) => {
        await tx.$executeRawUnsafe(`SET LOCAL app.current_org_id = '${organizationId}'`);
        return this.tenantContext.run({ tx, organizationId, userId: SYSTEM_ACTOR }, async () => {
          const company = await tx.company.findUnique({
            where: { id: companyId },
            include: { countries: { where: { deletedAt: null } } },
          });
          const language = resolveLanguage(company);
          const siteLabel = resolveSiteLabel(company);

          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
          const recentCount = await tx.opportunity.count({
            where: { organizationId, companyId, welcomeEmailSent: true, createdAt: { gte: oneHourAgo } },
          });
          if (recentCount >= RATE_LIMIT_PER_HOUR) {
            throw new BadRequestException("Too many submissions from this site right now — try again later");
          }

          // Almost always the Opportunity that site's own contact form just
          // created moments earlier — flag it rather than creating a
          // duplicate. Matches either a linked Customer's email or a still
          // -unlinked lead's own leadEmail (see Opportunity's model comment).
          const recentWindow = new Date(Date.now() - RECENT_OPPORTUNITY_WINDOW_MS);
          const existing = await tx.opportunity.findFirst({
            where: {
              organizationId,
              companyId,
              createdAt: { gte: recentWindow },
              OR: [{ leadEmail: dto.email }, { customer: { email: dto.email } }],
            },
            orderBy: { createdAt: "desc" },
          });

          if (existing) {
            await tx.opportunity.update({
              where: { id: existing.id },
              data: { welcomeEmailSent: true, welcomeEmailSentAt: new Date() },
            });
          } else {
            // No matching recent Opportunity — e.g. called standalone. Create
            // one so there's always an auditable record, same shape
            // /v1/leads/intake creates.
            const existingCustomer = await tx.customer.findFirst({
              where: { organizationId, email: dto.email, deletedAt: null },
            });
            const code = await this.businessCode.next("opportunity", { companyId });
            await tx.opportunity.create({
              data: {
                organizationId,
                companyId,
                code,
                customerId: existingCustomer?.id,
                leadName: existingCustomer ? undefined : dto.name,
                leadEmail: existingCustomer ? undefined : dto.email,
                leadPhone: existingCustomer ? undefined : dto.phone,
                name: `Website lead — ${dto.name}`,
                source: OpportunitySource.WEBSITE,
                welcomeEmailSent: true,
                welcomeEmailSentAt: new Date(),
                createdBy: SYSTEM_ACTOR,
                updatedBy: SYSTEM_ACTOR,
              },
            });
          }

          return { ok: true as const, language, siteLabel, blogUrl: company?.blogUrl ?? null };
        });
      },
      { timeout: 15000 },
    );

    const { subject, html } = welcomeBody(result.language, result.siteLabel, dto.name, result.blogUrl);
    await this.brevo.sendEmail({
      to: dto.email,
      subject,
      html: renderEmailShell(html),
      tags: ["welcome-email"],
    });

    return { ok: true };
  }
}
