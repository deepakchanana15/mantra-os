import { BadRequestException, Injectable } from "@nestjs/common";
import { DeletionGuardService } from "../../../common/deletion/deletion-guard.service";
import { CreateInvoiceDto } from "./dto/create-invoice.dto";
import { UpdateInvoiceDto } from "./dto/update-invoice.dto";
import { InvoicePdfService } from "./invoice-pdf.service";
import { InvoicesRepository } from "./invoices.repository";

@Injectable()
export class InvoicesService {
  constructor(
    private readonly invoices: InvoicesRepository,
    private readonly deletionGuard: DeletionGuardService,
    private readonly invoicePdf: InvoicePdfService,
  ) {}

  async getPdf(id: string): Promise<{ buffer: Buffer; filename: string }> {
    const invoice = await this.invoices.findOneOrThrow(id);
    const buffer = await this.invoicePdf.generate(invoice);
    return { buffer, filename: `${invoice.invoiceNumber}.pdf` };
  }

  findAll(params: { skip?: number; take?: number; customerId?: string }) {
    return this.invoices.findAll(params);
  }

  findOne(id: string) {
    return this.invoices.findOneOrThrow(id);
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
