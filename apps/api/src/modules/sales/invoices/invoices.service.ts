import { BadRequestException, Injectable } from "@nestjs/common";
import { AttachmentEntityType } from "@mantra-os/db";
import { AttachmentsRepository } from "../../../common/attachments/attachments.repository";
import { DeletionGuardService } from "../../../common/deletion/deletion-guard.service";
import { CreateInvoiceDto } from "./dto/create-invoice.dto";
import { MarkInvoicePaidDto } from "./dto/mark-invoice-paid.dto";
import { UpdateInvoiceDto } from "./dto/update-invoice.dto";
import { InvoicePdfService } from "./invoice-pdf.service";
import { InvoicesRepository } from "./invoices.repository";

const UNPAYABLE_STATUSES = new Set(["PAID", "VOID"]);

@Injectable()
export class InvoicesService {
  constructor(
    private readonly invoices: InvoicesRepository,
    private readonly deletionGuard: DeletionGuardService,
    private readonly invoicePdf: InvoicePdfService,
    private readonly attachments: AttachmentsRepository,
  ) {}

  async getPdf(id: string): Promise<{ buffer: Buffer; filename: string }> {
    const invoice = await this.invoices.findOneOrThrow(id);
    const buffer = await this.invoicePdf.generate(invoice);
    return { buffer, filename: `${invoice.invoiceNumber}.pdf` };
  }

  findAll(params: { skip?: number; take?: number; customerId?: string }) {
    return this.invoices.findAll(params);
  }

  async findOne(id: string) {
    const invoice = await this.invoices.findOneOrThrow(id);
    const paymentProof = await this.attachments.findByEntity(AttachmentEntityType.INVOICE, id);
    return { ...invoice, paymentProof };
  }

  async markPaid(id: string, dto: MarkInvoicePaidDto) {
    const invoice = await this.invoices.findOneOrThrow(id);
    if (UNPAYABLE_STATUSES.has(invoice.status)) {
      throw new BadRequestException(`Invoice is already ${invoice.status.toLowerCase()}`);
    }
    await this.attachments.createMany(AttachmentEntityType.INVOICE, id, dto.attachments);
    return this.invoices.markPaid(id);
  }

  create(dto: CreateInvoiceDto) {
    const amount = dto.lines?.length ? dto.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0) : dto.amount;
    if (amount === undefined) {
      throw new BadRequestException("Provide either an amount or line items");
    }
    if (dto.discountAmount !== undefined && dto.discountAmount > amount) {
      throw new BadRequestException("Discount cannot exceed the invoice subtotal");
    }
    return this.invoices.create({ ...dto, amount });
  }

  update(id: string, dto: UpdateInvoiceDto) {
    return this.invoices.update(id, dto);
  }

  async remove(id: string) {
    const invoice = await this.invoices.findOneOrThrow(id);
    return this.deletionGuard.deleteWithGovernance({
      entityType: "Invoice",
      entityId: id,
      entityCreatedBy: invoice.createdBy,
      softDelete: () => this.invoices.softDelete(id),
    });
  }
}
