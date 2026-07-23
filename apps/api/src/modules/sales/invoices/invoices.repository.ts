import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { BaseRepository } from "../../../common/repositories/base.repository";
import { CreateInvoiceDto } from "./dto/create-invoice.dto";
import { UpdateInvoiceDto } from "./dto/update-invoice.dto";

@Injectable()
export class InvoicesRepository extends BaseRepository {
  findAll(params: { skip?: number; take?: number; customerId?: string }) {
    return this.db.invoice.findMany({
      where: {
        organizationId: this.organizationId,
        deletedAt: null,
        ...(params.customerId ? { customerId: params.customerId } : {}),
      },
      include: { customer: true, salesOrder: true },
      skip: params.skip ?? 0,
      take: params.take ?? 50,
      orderBy: { createdAt: "desc" },
    });
  }

  async findOneOrThrow(id: string) {
    const invoice = await this.db.invoice.findFirst({
      where: { id, organizationId: this.organizationId, deletedAt: null },
      include: { customer: true, salesOrder: true, lines: { include: { product: true } } },
    });
    if (!invoice) {
      throw new NotFoundException("Invoice not found");
    }
    return invoice;
  }

  /** dto.amount must already be the final total — InvoicesService computes it from dto.lines when lines are given. */
  async create(dto: CreateInvoiceDto & { amount: number }) {
    const existing = await this.db.invoice.findUnique({
      where: { organizationId_invoiceNumber: { organizationId: this.organizationId, invoiceNumber: dto.invoiceNumber } },
    });
    if (existing) {
      throw new ConflictException(`Invoice number "${dto.invoiceNumber}" already exists`);
    }
    return this.db.invoice.create({
      data: {
        customerId: dto.customerId,
        salesOrderId: dto.salesOrderId,
        invoiceNumber: dto.invoiceNumber,
        status: dto.status,
        amount: dto.amount,
        issuedAt: dto.issuedAt ? new Date(dto.issuedAt) : undefined,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        companyId: dto.companyId,
        countryId: dto.countryId,
        organizationId: this.organizationId,
        createdBy: this.userId,
        updatedBy: this.userId,
        ...(dto.lines?.length
          ? {
              lines: {
                create: dto.lines.map((line) => ({
                  organizationId: this.organizationId,
                  productId: line.productId,
                  quantity: line.quantity,
                  unitPrice: line.unitPrice,
                })),
              },
            }
          : {}),
      },
      include: { lines: true },
    });
  }

  async update(id: string, dto: UpdateInvoiceDto) {
    await this.findOneOrThrow(id);
    return this.db.invoice.update({
      where: { id },
      data: {
        salesOrderId: dto.salesOrderId,
        status: dto.status,
        amount: dto.amount,
        issuedAt: dto.issuedAt ? new Date(dto.issuedAt) : undefined,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        companyId: dto.companyId,
        countryId: dto.countryId,
        updatedBy: this.userId,
      },
    });
  }

  softDelete(id: string) {
    return this.db.invoice.update({ where: { id }, data: { deletedAt: new Date(), updatedBy: this.userId } });
  }
}
