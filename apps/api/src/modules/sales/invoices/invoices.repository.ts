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
      include: {
        customer: true,
        consigneeCompany: { include: { baseCurrency: true } },
        salesOrder: true,
        purchaseOrder: true,
        company: { include: { baseCurrency: true } },
        country: { include: { currency: true } },
      },
      skip: params.skip ?? 0,
      take: params.take ?? 50,
      orderBy: { createdAt: "desc" },
    });
  }

  async findOneOrThrow(id: string) {
    const invoice = await this.db.invoice.findFirst({
      where: { id, organizationId: this.organizationId, deletedAt: null },
      include: {
        customer: true,
        consigneeCompany: { include: { baseCurrency: true } },
        salesOrder: true,
        purchaseOrder: true,
        lines: { include: { product: true } },
        company: { include: { baseCurrency: true } },
        country: { include: { currency: true } },
      },
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
        consigneeCompanyId: dto.consigneeCompanyId,
        consigneePhone: dto.consigneePhone,
        purchaseOrderId: dto.purchaseOrderId,
        salesOrderId: dto.salesOrderId,
        invoiceNumber: dto.invoiceNumber,
        status: dto.status,
        amount: dto.amount,
        discountAmount: dto.discountAmount,
        gstApplicable: dto.gstApplicable,
        gstRate: dto.gstRate,
        exportUnderLut: dto.exportUnderLut,
        buyerTaxId: dto.buyerTaxId,
        carriageBy: dto.carriageBy,
        placeOfReceipt: dto.placeOfReceipt,
        countryOfOrigin: dto.countryOfOrigin,
        flightOrVesselNumber: dto.flightOrVesselNumber,
        portOfLoading: dto.portOfLoading,
        portOfDischarge: dto.portOfDischarge,
        paymentTerms: dto.paymentTerms,
        freightTerms: dto.freightTerms,
        exchangeRate: dto.exchangeRate,
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
        customerId: dto.customerId,
        consigneeCompanyId: dto.consigneeCompanyId,
        consigneePhone: dto.consigneePhone,
        purchaseOrderId: dto.purchaseOrderId,
        salesOrderId: dto.salesOrderId,
        status: dto.status,
        amount: dto.amount,
        discountAmount: dto.discountAmount,
        gstApplicable: dto.gstApplicable,
        gstRate: dto.gstRate,
        exportUnderLut: dto.exportUnderLut,
        buyerTaxId: dto.buyerTaxId,
        carriageBy: dto.carriageBy,
        placeOfReceipt: dto.placeOfReceipt,
        countryOfOrigin: dto.countryOfOrigin,
        flightOrVesselNumber: dto.flightOrVesselNumber,
        portOfLoading: dto.portOfLoading,
        portOfDischarge: dto.portOfDischarge,
        paymentTerms: dto.paymentTerms,
        freightTerms: dto.freightTerms,
        exchangeRate: dto.exchangeRate,
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

  async markPaid(id: string) {
    await this.findOneOrThrow(id);
    return this.db.invoice.update({
      where: { id },
      data: { status: "PAID", paidAt: new Date(), paidBy: this.userId, updatedBy: this.userId },
    });
  }
}
