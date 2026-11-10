import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@mantra-os/db";
import { BusinessCodeService } from "../../../common/business-code/business-code.service";
import { addressToJson } from "../../../common/dto/address.dto";
import { BaseRepository } from "../../../common/repositories/base.repository";
import { TenantContextService } from "../../../common/context/tenant-context.service";
import { ActivityEntry } from "../../activity/activity-entry.type";
import { AuditLogRepository } from "../../activity/audit-log/audit-log.repository";
import { humanize } from "../../activity/humanize.util";
import { NotesRepository } from "../../activity/notes/notes.repository";
import { InvoicesRepository } from "../../sales/invoices/invoices.repository";
import { QuotesRepository } from "../../sales/quotes/quotes.repository";
import { SalesOrdersRepository } from "../../sales/sales-orders/sales-orders.repository";
import { CreateCustomerDto } from "./dto/create-customer.dto";
import { UpdateCustomerDto } from "./dto/update-customer.dto";

@Injectable()
export class CustomersRepository extends BaseRepository {
  constructor(
    tenantContext: TenantContextService,
    private readonly businessCode: BusinessCodeService,
    private readonly notes: NotesRepository,
    private readonly auditLog: AuditLogRepository,
    private readonly quotes: QuotesRepository,
    private readonly salesOrders: SalesOrdersRepository,
    private readonly invoices: InvoicesRepository,
  ) {
    super(tenantContext);
  }

  findAll(params: { skip?: number; take?: number; search?: string }) {
    const where: Prisma.CustomerWhereInput = {
      organizationId: this.organizationId,
      deletedAt: null,
      ...(params.search ? { name: { contains: params.search, mode: "insensitive" } } : {}),
    };
    return this.db.customer.findMany({
      where,
      skip: params.skip ?? 0,
      take: params.take ?? 50,
      orderBy: { createdAt: "desc" },
    });
  }

  async findOneOrThrow(id: string) {
    const customer = await this.db.customer.findFirst({
      where: { id, organizationId: this.organizationId, deletedAt: null },
      include: { contacts: { where: { deletedAt: null } } },
    });
    if (!customer) {
      throw new NotFoundException("Customer not found");
    }
    return customer;
  }

  async create(dto: CreateCustomerDto) {
    const code = await this.businessCode.next("customer", { companyId: dto.companyId, countryId: dto.countryId });
    return this.db.customer.create({
      data: {
        code,
        name: dto.name,
        type: dto.type,
        companyId: dto.companyId,
        countryId: dto.countryId,
        email: dto.email,
        phone: dto.phone,
        billingAddress: addressToJson(dto.billingAddress),
        shippingAddress: addressToJson(dto.shippingAddress),
        organizationId: this.organizationId,
        createdBy: this.userId,
        updatedBy: this.userId,
      },
    });
  }

  async update(id: string, dto: UpdateCustomerDto) {
    await this.findOneOrThrow(id);
    return this.db.customer.update({
      where: { id },
      data: {
        name: dto.name,
        type: dto.type,
        companyId: dto.companyId,
        countryId: dto.countryId,
        email: dto.email,
        phone: dto.phone,
        billingAddress: addressToJson(dto.billingAddress),
        shippingAddress: addressToJson(dto.shippingAddress),
        updatedBy: this.userId,
      },
    });
  }

  softDelete(id: string) {
    return this.db.customer.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: this.userId },
    });
  }

  addNote(id: string, body: string) {
    return this.notes.create({ entityType: "CUSTOMER", entityId: id, body });
  }

  findViews(id: string) {
    return this.auditLog.findViewSummary("CUSTOMER", id);
  }

  findViewLog(id: string) {
    return this.auditLog.findFullViewLog("CUSTOMER", id);
  }

  async findActivity(id: string): Promise<ActivityEntry[]> {
    const customer = await this.findOneOrThrow(id);

    const [quotes, salesOrders, invoices, notes, auditEntries] = await Promise.all([
      this.quotes.findAll({ customerId: id, take: 200 }),
      this.salesOrders.findAll({ customerId: id, take: 200 }),
      this.invoices.findAll({ customerId: id, take: 200 }),
      this.notes.findForEntity("CUSTOMER", id),
      this.auditLog.findActionsForEntity("CUSTOMER", id),
    ]);

    const entries: ActivityEntry[] = [
      { id: `created-${customer.id}`, type: "CREATED", timestamp: customer.createdAt, title: "Customer created", detail: null, actor: null },
    ];

    for (const q of quotes) {
      entries.push({ id: q.id, type: "QUOTE", timestamp: q.createdAt, title: `Quote raised (${humanize(q.status)})`, detail: null, actor: null });
    }

    for (const o of salesOrders) {
      const channelParts = [
        o.salesChannel ? humanize(o.salesChannel) : null,
        o.onlineChannelType ? humanize(o.onlineChannelType) : null,
        o.offlineChannelType ? humanize(o.offlineChannelType) : null,
      ].filter(Boolean);
      entries.push({
        id: o.id,
        type: "SALES_ORDER",
        timestamp: o.createdAt,
        title: `Sales order placed${channelParts.length ? ` (${channelParts.join(" · ")})` : ""}`,
        detail: o.orderReference ? `Ref: ${o.orderReference}` : null,
        actor: null,
      });
    }

    for (const inv of invoices) {
      entries.push({
        id: inv.id,
        type: "INVOICE",
        timestamp: inv.createdAt,
        title: `Invoice ${inv.invoiceNumber} issued (${humanize(inv.status)})`,
        detail: `Amount: ${inv.amount}`,
        actor: null,
      });
    }

    for (const n of notes) {
      entries.push({ id: n.id, type: "NOTE", timestamp: n.createdAt, title: "Note", detail: n.body, actor: n.authorName });
    }

    for (const a of auditEntries) {
      entries.push({ id: a.id, type: "AUDIT", timestamp: a.createdAt, title: humanize(a.action), detail: null, actor: a.performedBy.name });
    }

    return entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
}
