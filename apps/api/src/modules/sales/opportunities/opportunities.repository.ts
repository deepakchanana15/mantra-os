import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { CustomerType } from "@mantra-os/db";
import { BusinessCodeService } from "../../../common/business-code/business-code.service";
import { TenantContextService } from "../../../common/context/tenant-context.service";
import { BaseRepository } from "../../../common/repositories/base.repository";
import { CreateOpportunityDto } from "./dto/create-opportunity.dto";
import { UpdateOpportunityDto } from "./dto/update-opportunity.dto";

@Injectable()
export class OpportunitiesRepository extends BaseRepository {
  constructor(
    tenantContext: TenantContextService,
    private readonly businessCode: BusinessCodeService,
  ) {
    super(tenantContext);
  }

  findAll(params: { skip?: number; take?: number; customerId?: string }) {
    return this.db.opportunity.findMany({
      where: {
        organizationId: this.organizationId,
        deletedAt: null,
        ...(params.customerId ? { customerId: params.customerId } : {}),
      },
      include: { customer: true },
      skip: params.skip ?? 0,
      take: params.take ?? 50,
      orderBy: { createdAt: "desc" },
    });
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

    let customerId = dto.customerId;
    if (!customerId && dto.leadEmail) {
      const existingCustomer = await this.db.customer.findFirst({
        where: { organizationId: this.organizationId, email: dto.leadEmail, deletedAt: null },
      });
      customerId = existingCustomer?.id;
    }

    const code = await this.businessCode.next("opportunity", { companyId: dto.companyId, countryId: dto.countryId });
    return this.db.opportunity.create({
      data: {
        code,
        customerId,
        leadName: customerId ? undefined : dto.leadName,
        leadEmail: customerId ? undefined : dto.leadEmail,
        leadPhone: customerId ? undefined : dto.leadPhone,
        name: dto.name,
        stage: dto.stage,
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
  }

  async update(id: string, dto: UpdateOpportunityDto) {
    await this.findOneOrThrow(id);
    return this.db.opportunity.update({
      where: { id },
      data: {
        name: dto.name,
        stage: dto.stage,
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
