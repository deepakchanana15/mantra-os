import { BadRequestException, Body, Controller, Headers, HttpCode, Post, UnauthorizedException } from "@nestjs/common";
import { OpportunitySource } from "@mantra-os/db";
import { BusinessCodeService } from "../../../common/business-code/business-code.service";
import { SkipTenantContext } from "../../../common/decorators/skip-tenant-context.decorator";
import { TenantContextService } from "../../../common/context/tenant-context.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { LeadIntakeDto } from "./dto/lead-intake.dto";

const SYSTEM_ACTOR = "lead-intake";
const RATE_LIMIT_PER_HOUR = 30;

/**
 * Public, unauthenticated: a visitor's own browser calls this directly from
 * one of the organization's websites, so there's no MantraOS session to
 * derive tenant context from. Authenticated instead by a per-Company
 * `LeadIntakeKey` (see that model's schema comment for why it carries no
 * RLS). See DECISIONS.md "Public lead intake: website forms, Phase 5 (lead
 * attribution)".
 *
 * Deliberately does NOT create a Customer — a person who just submitted a
 * form isn't a paying Customer yet, and mixing the two pools was exactly
 * the problem this was built to avoid (see DECISIONS.md "Leads are not
 * Customers"). If the email already matches an existing real Customer
 * (someone who's bought before, reaching out again), the new Opportunity
 * links to them directly; otherwise it stays unlinked, carrying the
 * prospect's own name/email/phone until a human explicitly converts it.
 */
@Controller("v1/leads")
@SkipTenantContext()
export class LeadIntakeController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly businessCode: BusinessCodeService,
  ) {}

  @Post("intake")
  @HttpCode(200)
  async intake(@Headers("x-intake-key") intakeKey: string | undefined, @Body() dto: LeadIntakeDto) {
    // Honeypot tripped — respond exactly like success so a bot has no
    // signal it was caught, but do nothing.
    if (dto.website) {
      return { ok: true };
    }

    if (!intakeKey) {
      throw new UnauthorizedException();
    }
    const keyRecord = await this.prisma.leadIntakeKey.findUnique({ where: { key: intakeKey } });
    if (!keyRecord || !keyRecord.enabled) {
      throw new UnauthorizedException();
    }

    const { organizationId, companyId } = keyRecord;

    return this.prisma.$transaction(
      async (tx) => {
        // organizationId came from our own key lookup above, not raw input.
        await tx.$executeRawUnsafe(`SET LOCAL app.current_org_id = '${organizationId}'`);
        return this.tenantContext.run({ tx, organizationId, userId: SYSTEM_ACTOR }, async () => {
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
          const recentCount = await tx.opportunity.count({
            where: {
              organizationId,
              companyId,
              source: OpportunitySource.WEBSITE,
              createdAt: { gte: oneHourAgo },
            },
          });
          if (recentCount >= RATE_LIMIT_PER_HOUR) {
            throw new BadRequestException("Too many submissions from this site right now — try again later");
          }

          // Only link to an existing Customer if this email already belongs
          // to one — a past buyer reaching out again. A brand-new inquiry
          // never creates a Customer; it stays a bare lead until someone
          // converts it (POST /v1/opportunities/:id/convert-to-customer).
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
              utmSource: dto.utmSource,
              utmMedium: dto.utmMedium,
              utmCampaign: dto.utmCampaign,
              externalLeadId: dto.externalLeadId,
              customerType: dto.customerType,
              productInterest: dto.productInterest,
              notes: dto.message,
              createdBy: SYSTEM_ACTOR,
              updatedBy: SYSTEM_ACTOR,
            },
          });

          return { ok: true };
        });
      },
      { timeout: 15000 },
    );
  }
}
