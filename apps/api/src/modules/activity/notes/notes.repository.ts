import { Injectable } from "@nestjs/common";
import { BaseRepository } from "../../../common/repositories/base.repository";
import { resolveUserNames } from "../user-names.util";

@Injectable()
export class NotesRepository extends BaseRepository {
  create(params: { entityType: string; entityId: string; body: string }) {
    return this.db.note.create({
      data: {
        organizationId: this.organizationId,
        entityType: params.entityType,
        entityId: params.entityId,
        body: params.body,
        createdBy: this.userId,
      },
    });
  }

  async findForEntity(entityType: string, entityId: string) {
    const notes = await this.db.note.findMany({
      where: { organizationId: this.organizationId, entityType, entityId },
      orderBy: { createdAt: "desc" },
    });
    const names = await resolveUserNames(this.db, notes.map((n) => n.createdBy));
    return notes.map((note) => ({ ...note, authorName: names.get(note.createdBy) ?? "Unknown user" }));
  }
}
