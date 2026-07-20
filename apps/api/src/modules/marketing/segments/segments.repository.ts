import { Injectable, NotFoundException } from "@nestjs/common";
import { BaseRepository } from "../../../common/repositories/base.repository";
import { CreateSegmentDto } from "./dto/create-segment.dto";
import { SegmentFilterDto, segmentFilterToJson } from "./dto/segment-filter.dto";
import { UpdateSegmentDto } from "./dto/update-segment.dto";

@Injectable()
export class SegmentsRepository extends BaseRepository {
  findAll() {
    return this.db.segment.findMany({
      where: { organizationId: this.organizationId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOneOrThrow(id: string) {
    const segment = await this.db.segment.findFirst({
      where: { id, organizationId: this.organizationId, deletedAt: null },
    });
    if (!segment) {
      throw new NotFoundException("Segment not found");
    }
    return segment;
  }

  create(dto: CreateSegmentDto) {
    return this.db.segment.create({
      data: {
        name: dto.name,
        filterJson: segmentFilterToJson(dto.filter),
        organizationId: this.organizationId,
        createdBy: this.userId,
        updatedBy: this.userId,
      },
    });
  }

  async update(id: string, dto: UpdateSegmentDto) {
    await this.findOneOrThrow(id);
    return this.db.segment.update({
      where: { id },
      data: {
        name: dto.name,
        filterJson: dto.filter ? segmentFilterToJson(dto.filter) : undefined,
        updatedBy: this.userId,
      },
    });
  }

  softDelete(id: string) {
    return this.db.segment.update({ where: { id }, data: { deletedAt: new Date(), updatedBy: this.userId } });
  }

  /** Resolves the saved filter into actual recipient emails — see segment-filter.dto.ts for the (deliberately small) filter shape. */
  async resolveRecipientEmails(id: string): Promise<string[]> {
    const segment = await this.findOneOrThrow(id);
    const filter = segment.filterJson as unknown as SegmentFilterDto;

    const customers = await this.db.customer.findMany({
      where: {
        organizationId: this.organizationId,
        deletedAt: null,
        ...(filter.customerType ? { type: filter.customerType } : {}),
      },
      include: { contacts: { where: { deletedAt: null } } },
    });

    const emails = new Set<string>();
    for (const customer of customers) {
      if (customer.email) emails.add(customer.email);
      for (const contact of customer.contacts) {
        if (contact.email) emails.add(contact.email);
      }
    }
    return Array.from(emails);
  }
}
