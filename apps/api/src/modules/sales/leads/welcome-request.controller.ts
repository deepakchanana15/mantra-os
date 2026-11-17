import { BadRequestException, Body, Controller, Headers, HttpCode, Post, UnauthorizedException } from "@nestjs/common";
import { OpportunitySource } from "@mantra-os/db";
import { BusinessCodeService } from "../../../common/business-code/business-code.service";
import { SkipTenantContext } from "../../../common/decorators/skip-tenant-context.decorator";
import { TenantContextService } from "../../../common/context/tenant-context.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { BrevoService } from "../../notifications/brevo/brevo.service";
import { WelcomeRequestDto } from "./dto/welcome-request.dto";

const SYSTEM_ACTOR = "lead-intake";
const RATE_LIMIT_PER_HOUR = 30;
const RECENT_OPPORTUNITY_WINDOW_MS = 15 * 60 * 1000;

type WelcomeCopy = { subject: string; html: (name: string, blogUrl: string | null) => string };

const COPY: Record<"en" | "de" | "nl", WelcomeCopy> = {
  en: {
    subject: "Thanks for reaching out — Mantra Sports",
    html: (name, blogUrl) =>
      `<p>Hi ${name},</p>` +
      `<p>Thanks for getting in touch with Mantra Sports. We've received your message and our team will reach out to you within 24 hours.</p>` +
      (blogUrl ? `<p>In the meantime, have a look at our blog: <a href="${blogUrl}">${blogUrl}</a></p>` : "") +
      `<p>Best regards,<br>The Mantra Sports Team</p>`,
  },
  de: {
    subject: "Danke für deine Anfrage — Mantra Sports",
    html: (name, blogUrl) =>
      `<p>Hallo ${name},</p>` +
      `<p>vielen Dank, dass du dich an Mantra Sports gewandt hast. Wir haben deine Nachricht erhalten und unser Team wird sich innerhalb von 24 Stunden bei dir melden.</p>` +
      (blogUrl ? `<p>Schau in der Zwischenzeit gerne in unserem Blog vorbei: <a href="${blogUrl}">${blogUrl}</a></p>` : "") +
      `<p>Viele Grüße,<br>Dein Mantra Sports Team</p>`,
  },
  nl: {
    subject: "Bedankt voor je bericht — Mantra Sports",
    html: (name, blogUrl) =>
      `<p>Hoi ${name},</p>` +
      `<p>Bedankt dat je contact hebt opgenomen met Mantra Sports. We hebben je bericht ontvangen en ons team neemt binnen 24 uur contact met je op.</p>` +
      (blogUrl ? `<p>Bekijk ondertussen gerust onze blog: <a href="${blogUrl}">${blogUrl}</a></p>` : "") +
      `<p>Met vriendelijke groet,<br>Het Mantra Sports Team</p>`,
  },
};

function resolveLanguage(company: { countries: { defaultLanguage: string | null }[] } | null): "en" | "de" | "nl" {
  const lang = company?.countries[0]?.defaultLanguage;
  return lang === "de" || lang === "nl" ? lang : "en";
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

          return { ok: true as const, language, blogUrl: company?.blogUrl ?? null };
        });
      },
      { timeout: 15000 },
    );

    const copy = COPY[result.language];
    await this.brevo.sendEmail({
      to: dto.email,
      subject: copy.subject,
      html: copy.html(dto.name, result.blogUrl),
      tags: ["welcome-email"],
    });

    return { ok: true };
  }
}
