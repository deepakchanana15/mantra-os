import { BadRequestException, Body, Controller, Headers, HttpCode, Post, UnauthorizedException } from "@nestjs/common";
import { CustomerType, OpportunitySource } from "@mantra-os/db";
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
 */
@Controller("v1/leads")
@SkipTenantContext()
export class LeadIntakeController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
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

          let customer = await tx.customer.findFirst({
            where: { organizationId, email: dto.email, deletedAt: null },
          });
          if (!customer) {
            customer = await tx.customer.create({
              data: {
                organizationId,
                companyId,
                name: dto.name,
                email: dto.email,
                phone: dto.phone,
                type: CustomerType.USER,
                createdBy: SYSTEM_ACTOR,
                updatedBy: SYSTEM_ACTOR,
              },
            });
          }

          await tx.opportunity.create({
            data: {
              organizationId,
              companyId,
              customerId: customer.id,
              name: `Website lead — ${dto.name}`,
              source: OpportunitySource.WEBSITE,
              utmSource: dto.utmSource,
              utmMedium: dto.utmMedium,
              utmCampaign: dto.utmCampaign,
              externalLeadId: dto.externalLeadId,
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
