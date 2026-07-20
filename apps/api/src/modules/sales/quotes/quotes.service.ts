import { Injectable } from "@nestjs/common";
import { QuoteStatus } from "@mantra-os/db";
import { DeletionGuardService } from "../../../common/deletion/deletion-guard.service";
import { CreateQuoteDto } from "./dto/create-quote.dto";
import { QuotesRepository } from "./quotes.repository";

@Injectable()
export class QuotesService {
  constructor(
    private readonly quotes: QuotesRepository,
    private readonly deletionGuard: DeletionGuardService,
  ) {}

  findAll(params: { skip?: number; take?: number; customerId?: string }) {
    return this.quotes.findAll(params);
  }

  findOne(id: string) {
    return this.quotes.findOneOrThrow(id);
  }

  create(dto: CreateQuoteDto) {
    return this.quotes.create(dto);
  }

  updateStatus(id: string, status: QuoteStatus) {
    return this.quotes.updateStatus(id, status);
  }

  async remove(id: string) {
    const quote = await this.quotes.findOneOrThrow(id);
    return this.deletionGuard.deleteWithGovernance({
      entityType: "Quote",
      entityId: id,
      entityCreatedBy: quote.createdBy,
      softDelete: () => this.quotes.softDelete(id),
    });
  }
}
