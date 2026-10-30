import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { CustomerType, OpportunityLostReason, OpportunityStage } from "@mantra-os/db";
import { BusinessCodeService } from "../../../common/business-code/business-code.service";
import { TenantContextService } from "../../../common/context/tenant-context.service";
import { BaseRepository } from "../../../common/repositories/base.repository";
import { CreateOpportunityDto } from "./dto/create-opportunity.dto";
import { UpdateOpportunityDto } from "./dto/update-opportunity.dto";

// Pipeline order (New → ... → Won/Lost), matching OpportunityStage's own
// declaration order in schema.prisma — used to sort the in-memory search
// path the same way Postgres's native enum ordering already sorts the
// plain (no-search) path for free.
const STAGE_ORDER: Record<string, number> = {
  NEW: 0,
  ATTEMPTING_CONTACT: 1,
  QUALIFIED: 2,
  PROPOSAL: 3,
  NEGOTIATION: 4,
  WON: 5,
  LOST: 6,
};

function digitsOnly(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

function normalizeSpaces(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function stripWhitespace(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, "");
}

interface SortableOpportunity {
  createdAt: Date;
  stageChangedAt: Date;
  stage: string;
  estimatedValue: unknown;
  name: string;
}

function sortOpportunities<T extends SortableOpportunity>(rows: T[], sortBy: string, sortDir: "asc" | "desc"): T[] {
  const dir = sortDir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    let cmp: number;
    switch (sortBy) {
      case "stage":
        cmp = (STAGE_ORDER[a.stage] ?? 0) - (STAGE_ORDER[b.stage] ?? 0);
        break;
      case "stageChangedAt":
        cmp = a.stageChangedAt.getTime() - b.stageChangedAt.getTime();
        break;
      case "estimatedValue":
        cmp = Number(a.estimatedValue ?? 0) - Number(b.estimatedValue ?? 0);
        break;
      case "name":
        cmp = a.name.localeCompare(b.name);
        break;
      default:
        cmp = a.createdAt.getTime() - b.createdAt.getTime();
    }
    return cmp * dir;
  });
}

@Injectable()
export class OpportunitiesRepository extends BaseRepository {
  constructor(
    tenantContext: TenantContextService,
    private readonly businessCode: BusinessCodeService,
  ) {
    super(tenantContext);
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    customerId?: string;
    sortBy?: string;
    sortDir?: "asc" | "desc";
    search?: string;
  }) {
    const where = {
      organizationId: this.organizationId,
      deletedAt: null,
      ...(params.customerId ? { customerId: params.customerId } : {}),
    };
    const skip = params.skip ?? 0;
    const take = params.take ?? 50;
    const sortBy = params.sortBy ?? "createdAt";
    const sortDir = params.sortDir ?? "desc";
    const search = params.search?.trim();

    if (!search) {
      // stage sorts in pipeline order (New → ... → Won/Lost), not
      // alphabetically — Postgres enums order by their declaration order
      // in the schema, which happens to already be the funnel order
      // OpportunityStage was written in.
      const orderBy = { [sortBy]: sortDir };
      const [data, total] = await Promise.all([
        this.db.opportunity.findMany({ where, include: { customer: true }, skip, take, orderBy }),
        this.db.opportunity.count({ where }),
      ]);
      return { data, total, skip, take };
    }

    // A search needs to tolerate formatting differences a SQL `contains`
    // can't express — a phone pasted with spaces/dashes must still match
    // one stored without them, and a stray leading/trailing/doubled space
    // in what someone typed or pasted must never prevent a match. Same
    // "normalize and compare in application code" reasoning as the
    // WhatsApp/Meta webhooks' phonesMatch() — filtered here instead of at
    // the DB layer, fine at this business's real scale (revisit only if
    // it becomes a bottleneck).
    const candidates = await this.db.opportunity.findMany({ where, include: { customer: true } });
    const searchDigits = digitsOnly(search);
    const searchNoSpace = stripWhitespace(search).toLowerCase();
    const searchNameTerm = normalizeSpaces(search).toLowerCase();

    const matches = candidates.filter((o) => {
      const name = normalizeSpaces(o.name).toLowerCase();
      const email = stripWhitespace(o.leadEmail ?? o.customer?.email).toLowerCase();
      const phone = digitsOnly(o.leadPhone ?? o.customer?.phone);
      return (
        name.includes(searchNameTerm) ||
        (searchNoSpace.length > 0 && email.includes(searchNoSpace)) ||
        (searchDigits.length > 0 && phone.includes(searchDigits))
      );
    });

    const sorted = sortOpportunities(matches, sortBy, sortDir);
    const total = sorted.length;
    const data = sorted.slice(skip, skip + take);
    return { data, total, skip, take };
  }

  /**
   * A lost reason is required whenever the *effective* stage (after this
   * change) is LOST, and "Other" additionally requires notes explaining
   * what "other" means — see `OpportunityLostReason`'s schema comment for
   * why this lives here rather than as a DTO decorator.
   */
  private assertValidLostReason(params: { stage?: OpportunityStage; lostReason?: OpportunityLostReason | null; notes?: string | null }) {
    if (params.stage !== OpportunityStage.LOST) return;
    if (!params.lostReason) {
      throw new BadRequestException("A lost reason is required when marking an opportunity as Lost");
    }
    if (params.lostReason === OpportunityLostReason.OTHER && !params.notes?.trim()) {
      throw new BadRequestException('Notes are required when the lost reason is "Other"');
    }
  }

  async findOneOrThrow(id: string) {
    const opportunity = await this.db.opportunity.findFirst({
      where: { id, organizationId: this.organizationId, deletedAt: null },
      include: { customer: true },
    });
    if (!opportunity) {
      throw new NotFoundException("Opportunity not found");
    }
    return opportunity;
  }

  /**
   * No customer dropdown here — see DECISIONS.md "Opportunities no longer
   * require picking a Customer". A caller supplies either a known
   * `customerId` directly, or a lead's own `leadName`/`leadEmail`/
   * `leadPhone`; when only the latter is given, an existing Customer with
   * a matching email is linked automatically (same rule `/v1/leads/intake`
   * already uses) — otherwise the Opportunity stays unlinked, exactly like
   * a website-sourced lead.
   */
  async create(dto: CreateOpportunityDto) {
    if (!dto.customerId && !dto.leadEmail) {
      throw new BadRequestException("Provide either a customerId or a leadName/leadEmail to identify who this opportunity is with");
    }
    this.assertValidLostReason({ stage: dto.stage, lostReason: dto.lostReason, notes: dto.notes });

    let customerId = dto.customerId;
    if (!customerId && dto.leadEmail) {
      const existingCustomer = await this.db.customer.findFirst({
        where: { organizationId: this.organizationId, email: dto.leadEmail, deletedAt: null },
      });
      customerId = existingCustomer?.id;
    }

    const code = await this.businessCode.next("opportunity", { companyId: dto.companyId, countryId: dto.countryId });
    const opportunity = await this.db.opportunity.create({
      data: {
        code,
        customerId,
        leadName: customerId ? undefined : dto.leadName,
        leadEmail: customerId ? undefined : dto.leadEmail,
        leadPhone: customerId ? undefined : dto.leadPhone,
        name: dto.name,
        stage: dto.stage,
        lostReason: dto.lostReason,
        estimatedValue: dto.estimatedValue,
        expectedCloseDate: dto.expectedCloseDate ? new Date(dto.expectedCloseDate) : undefined,
        notes: dto.notes,
        companyId: dto.companyId,
        countryId: dto.countryId,
        organizationId: this.organizationId,
        createdBy: this.userId,
        updatedBy: this.userId,
      },
    });

    // See DECISIONS.md "Opportunity stage-duration tracking" — the initial
    // row (fromStage: null) establishes the starting point every later
    // "days in stage" calculation measures from.
    await this.db.opportunityStageHistory.create({
      data: {
        organizationId: this.organizationId,
        opportunityId: opportunity.id,
        fromStage: null,
        toStage: opportunity.stage,
        changedBy: this.userId,
      },
    });

    return opportunity;
  }

  async update(id: string, dto: UpdateOpportunityDto) {
    const existing = await this.findOneOrThrow(id);
    const stageChanged = dto.stage !== undefined && dto.stage !== existing.stage;

    // Effective values (this patch's, falling back to what's already
    // saved) — so a PATCH that sets stage=LOST without resending an
    // already-correct lostReason/notes from a prior edit isn't wrongly
    // rejected, while a PATCH that newly sets stage=LOST is still checked.
    this.assertValidLostReason({
      stage: dto.stage ?? existing.stage,
      lostReason: dto.lostReason !== undefined ? dto.lostReason : existing.lostReason,
      notes: dto.notes !== undefined ? dto.notes : existing.notes,
    });

    if (stageChanged) {
      await this.db.opportunityStageHistory.create({
        data: {
          organizationId: this.organizationId,
          opportunityId: id,
          fromStage: existing.stage,
          toStage: dto.stage!,
          changedBy: this.userId,
        },
      });
    }

    return this.db.opportunity.update({
      where: { id },
      data: {
        name: dto.name,
        stage: dto.stage,
        lostReason: dto.lostReason,
        stageChangedAt: stageChanged ? new Date() : undefined,
        estimatedValue: dto.estimatedValue,
        expectedCloseDate: dto.expectedCloseDate ? new Date(dto.expectedCloseDate) : undefined,
        notes: dto.notes,
        companyId: dto.companyId,
        countryId: dto.countryId,
        updatedBy: this.userId,
      },
    });
  }

  softDelete(id: string) {
    return this.db.opportunity.update({ where: { id }, data: { deletedAt: new Date(), updatedBy: this.userId } });
  }

  /**
   * A lead becomes a Customer only through this explicit action — never
   * automatically. See DECISIONS.md "Leads are not Customers": conversion
   * often follows an offline conversation (a phone call), so it can't be
   * inferred from data alone.
   */
  async convertToCustomer(id: string) {
    const opportunity = await this.findOneOrThrow(id);
    if (opportunity.customerId) {
      throw new BadRequestException("This opportunity is already linked to a customer");
    }
    if (!opportunity.leadEmail) {
      throw new BadRequestException("This opportunity has no lead contact details to convert");
    }

    const customerCode = await this.businessCode.next("customer", {
      companyId: opportunity.companyId,
      countryId: opportunity.countryId,
    });
    const customer = await this.db.customer.create({
      data: {
        organizationId: this.organizationId,
        companyId: opportunity.companyId,
        countryId: opportunity.countryId,
        code: customerCode,
        name: opportunity.leadName ?? opportunity.leadEmail,
        email: opportunity.leadEmail,
        phone: opportunity.leadPhone,
        type: CustomerType.USER,
        createdBy: this.userId,
        updatedBy: this.userId,
      },
    });

    return this.db.opportunity.update({
      where: { id },
      data: { customerId: customer.id, updatedBy: this.userId },
      include: { customer: true },
    });
  }
}
