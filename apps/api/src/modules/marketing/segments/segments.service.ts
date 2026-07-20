import { Injectable } from "@nestjs/common";
import { DeletionGuardService } from "../../../common/deletion/deletion-guard.service";
import { CreateSegmentDto } from "./dto/create-segment.dto";
import { UpdateSegmentDto } from "./dto/update-segment.dto";
import { SegmentsRepository } from "./segments.repository";

@Injectable()
export class SegmentsService {
  constructor(
    private readonly segments: SegmentsRepository,
    private readonly deletionGuard: DeletionGuardService,
  ) {}

  findAll() {
    return this.segments.findAll();
  }

  findOne(id: string) {
    return this.segments.findOneOrThrow(id);
  }

  create(dto: CreateSegmentDto) {
    return this.segments.create(dto);
  }

  update(id: string, dto: UpdateSegmentDto) {
    return this.segments.update(id, dto);
  }

  async remove(id: string) {
    const segment = await this.segments.findOneOrThrow(id);
    return this.deletionGuard.deleteWithGovernance({
      entityType: "Segment",
      entityId: id,
      entityCreatedBy: segment.createdBy,
      softDelete: () => this.segments.softDelete(id),
    });
  }
}
