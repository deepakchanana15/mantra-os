import { Injectable } from "@nestjs/common";
import { DeletionGuardService } from "../../../common/deletion/deletion-guard.service";
import { CreateInvoiceDto } from "./dto/create-invoice.dto";
import { UpdateInvoiceDto } from "./dto/update-invoice.dto";
import { InvoicesRepository } from "./invoices.repository";

@Injectable()
export class InvoicesService {
  constructor(
    private readonly invoices: InvoicesRepository,
    private readonly deletionGuard: DeletionGuardService,
  ) {}

  findAll(params: { skip?: number; take?: number; customerId?: string }) {
    return this.invoices.findAll(params);
  }

  findOne(id: string) {
    return this.invoices.findOneOrThrow(id);
  }

  create(dto: CreateInvoiceDto) {
    return this.invoices.create(dto);
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
