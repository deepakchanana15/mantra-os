import { Injectable } from "@nestjs/common";
import { AttachmentEntityType } from "@mantra-os/db";
import { BaseRepository } from "../repositories/base.repository";
import { AttachmentInputDto } from "../dto/attachment-input.dto";

/**
 * Attachment is polymorphic (entityType + entityId, no Prisma relation —
 * see the model's own comment), so callers can't reach it via `include`.
 * Domain services fetch/attach it explicitly through this shared
 * repository instead of every module re-deriving the same query.
 */
@Injectable()
export class AttachmentsRepository extends BaseRepository {
  findByEntity(entityType: AttachmentEntityType, entityId: string) {
    return this.db.attachment.findMany({
      where: { organizationId: this.organizationId, entityType, entityId },
      orderBy: { createdAt: "asc" },
    });
  }

  async findByEntities(entityType: AttachmentEntityType, entityIds: string[]) {
    if (entityIds.length === 0) return new Map<string, Awaited<ReturnType<typeof this.findByEntity>>>();
    const attachments = await this.db.attachment.findMany({
      where: { organizationId: this.organizationId, entityType, entityId: { in: entityIds } },
      orderBy: { createdAt: "asc" },
    });
    const byEntityId = new Map<string, typeof attachments>();
    for (const attachment of attachments) {
      const existing = byEntityId.get(attachment.entityId) ?? [];
      existing.push(attachment);
      byEntityId.set(attachment.entityId, existing);
    }
    return byEntityId;
  }

  createMany(entityType: AttachmentEntityType, entityId: string, attachments: AttachmentInputDto[]) {
    if (attachments.length === 0) return Promise.resolve({ count: 0 });
    return this.db.attachment.createMany({
      data: attachments.map((attachment) => ({
        organizationId: this.organizationId,
        entityType,
        entityId,
        fileUrl: attachment.fileUrl,
        fileName: attachment.fileName,
        contentType: attachment.contentType,
        createdBy: this.userId,
      })),
    });
  }
}
