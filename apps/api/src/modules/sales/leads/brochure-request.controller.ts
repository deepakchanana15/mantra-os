import { BadRequestException, Body, Controller, Headers, HttpCode, Post, UnauthorizedException } from "@nestjs/common";
import { OpportunitySource } from "@mantra-os/db";
import { BusinessCodeService } from "../../../common/business-code/business-code.service";
import { SkipTenantContext } from "../../../common/decorators/skip-tenant-context.decorator";
import { TenantContextService } from "../../../common/context/tenant-context.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { BrevoService } from "../../notifications/brevo/brevo.service";
import { BrochureRequestDto } from "./dto/brochure-request.dto";

const SYSTEM_ACTOR = "lead-intake";
const RATE_LIMIT_PER_HOUR = 30;
const RECENT_OPPORTUNITY_WINDOW_MS = 15 * 60 * 1000;

/**
 * Brochure files live in OrganizationSettings (set via Settings →
 * Brochures, uploaded to Vercel Blob) rather than as static files in this
 * codebase — replacing one is just a re-upload, never a code change. Falls
 * back to English if a locale-specific file, or the whole settings row,
 * isn't set yet; returns nothing if even English is missing.
 */
function resolveBrochureUrls(
  locale: "en" | "de" | "nl" | undefined,
  settings: { brochureUrlEn: string | null; brochureUrlDe: string | null; brochureUrlNl: string | null } | null,
): string[] {
  if (!settings) return [];
  const localized = locale === "de" ? settings.brochureUrlDe : locale === "nl" ? settings.brochureUrlNl : null;
  return [localized, settings.brochureUrlEn].filter((url): url is string => Boolean(url));
}

/**
 * Public, same per-Company `LeadIntakeKey` auth as POST /v1/leads/intake
 * (see that controller's own comment for why no session/RLS exists yet).
 * Deliberately a separate endpoint rather than a flag on /intake: every
 * site keeps its own existing contact-form integration completely
 * untouched (several predate this feature and aren't visible to us to
 * safely modify — see the brochure feature's plan). This just records
 * that a brochure was also requested for whichever lead that existing
 * integration just created, and emails it.
 */
@Controller("v1/leads")
@SkipTenantContext()
export class BrochureRequestController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly businessCode: BusinessCodeService,
    private readonly brevo: BrevoService,
  ) {}

  @Post("brochure")
  @HttpCode(200)
  async requestBrochure(@Headers("x-intake-key") intakeKey: string | undefined, @Body() dto: BrochureRequestDto) {
    if (!intakeKey) {
      throw new UnauthorizedException();
    }
    const keyRecord = await this.prisma.leadIntakeKey.findUnique({ where: { key: intakeKey } });
    if (!keyRecord || !keyRecord.enabled) {
      throw new UnauthorizedException();
    }

    const { organizationId, companyId } = keyRecord;
    const settings = await this.prisma.organizationSettings.findUnique({ where: { organizationId } });
    const downloadUrls = resolveBrochureUrls(dto.locale, settings);

    const result = await this.prisma.$transaction(
      async (tx) => {
        await tx.$executeRawUnsafe(`SET LOCAL app.current_org_id = '${organizationId}'`);
        return this.tenantContext.run({ tx, organizationId, userId: SYSTEM_ACTOR }, async () => {
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
          const recentCount = await tx.opportunity.count({
            where: { organizationId, companyId, brochureSent: true, createdAt: { gte: oneHourAgo } },
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
              data: { brochureSent: true, brochureSentAt: new Date() },
            });
          } else {
            // No matching recent Opportunity — e.g. called standalone from a
            // dedicated brochure form. Create one so there's always an
            // auditable record, same shape /v1/leads/intake creates.
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
                name: `Brochure request — ${dto.name}`,
                source: OpportunitySource.WEBSITE,
                brochureSent: true,
                brochureSentAt: new Date(),
                createdBy: SYSTEM_ACTOR,
                updatedBy: SYSTEM_ACTOR,
              },
            });
          }

          return { ok: true as const };
        });
      },
      { timeout: 15000 },
    );

    if (downloadUrls.length > 0) {
      await this.brevo.sendEmail({
        to: dto.email,
        subject: "Your Mantra Sports brochure",
        html: `<p>Hi ${dto.name},</p><p>Thanks for your interest — here's your brochure:</p><ul>${downloadUrls
          .map((url) => `<li><a href="${url}">${url}</a></li>`)
          .join("")}</ul><p>Our sales team will also be in touch.</p>`,
        tags: ["brochure-download"],
      });
    }

    return { ...result, downloadUrls };
  }
}
