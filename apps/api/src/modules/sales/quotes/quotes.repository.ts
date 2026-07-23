import { Injectable, NotFoundException } from "@nestjs/common";
import { QuoteStatus } from "@mantra-os/db";
import { BaseRepository } from "../../../common/repositories/base.repository";
import { CreateQuoteDto } from "./dto/create-quote.dto";

@Injectable()
export class QuotesRepository extends BaseRepository {
  findAll(params: { skip?: number; take?: number; customerId?: string }) {
    return this.db.quote.findMany({
      where: {
        organizationId: this.organizationId,
        deletedAt: null,
        ...(params.customerId ? { customerId: params.customerId } : {}),
      },
      include: { customer: true, lines: { include: { product: true } }, opportunity: true },
      skip: params.skip ?? 0,
      take: params.take ?? 50,
      orderBy: { createdAt: "desc" },
    });
  }

  async findOneOrThrow(id: string) {
    const quote = await this.db.quote.findFirst({
      where: { id, organizationId: this.organizationId, deletedAt: null },
      include: { customer: true, lines: { include: { product: true } }, opportunity: true },
    });
    if (!quote) {
      throw new NotFoundException("Quote not found");
    }
    return quote;
  }

  create(dto: CreateQuoteDto) {
    return this.db.quote.create({
      data: {
        organizationId: this.organizationId,
        customerId: dto.customerId,
        companyId: dto.companyId,
        countryId: dto.countryId,
        opportunityId: dto.opportunityId,
        validUntil: dto.validUntil,
        createdBy: this.userId,
        updatedBy: this.userId,
        lines: {
          create: dto.lines.map((line) => ({
            organizationId: this.organizationId,
            productId: line.productId,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
          })),
        },
      },
      include: { lines: true },
    });
  }

  async updateStatus(id: string, status: QuoteStatus) {
    await this.findOneOrThrow(id);
    return this.db.quote.update({
      where: { id },
      data: { status, updatedBy: this.userId },
    });
  }

  softDelete(id: string) {
    return this.db.quote.update({ where: { id }, data: { deletedAt: new Date(), updatedBy: this.userId } });
  }
}
