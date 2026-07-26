import { Injectable, NotFoundException } from "@nestjs/common";
import * as crypto from "node:crypto";
import { BaseRepository } from "../../../common/repositories/base.repository";
import { CreateLeadIntakeKeyDto } from "./dto/create-lead-intake-key.dto";

/**
 * `LeadIntakeKey` carries no RLS policy (see its schema comment) — the
 * public /v1/leads/intake route needs to look one up with no org context
 * to set first. That means every query here MUST filter by
 * `organizationId` explicitly in the WHERE clause; the database will not
 * do it automatically the way it does for every other tenant-scoped table.
 */
@Injectable()
export class LeadIntakeKeysRepository extends BaseRepository {
  findAll() {
    return this.db.leadIntakeKey.findMany({
      where: { organizationId: this.organizationId },
      include: { company: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  create(dto: CreateLeadIntakeKeyDto) {
    const key = `lik_${crypto.randomBytes(24).toString("hex")}`;
    return this.db.leadIntakeKey.create({
      data: {
        organizationId: this.organizationId,
        companyId: dto.companyId,
        label: dto.label,
        key,
        createdBy: this.userId,
      },
      include: { company: { select: { name: true } } },
    });
  }

  async remove(id: string) {
    const existing = await this.db.leadIntakeKey.findFirst({
      where: { id, organizationId: this.organizationId },
    });
    if (!existing) {
      throw new NotFoundException("Lead intake key not found");
    }
    await this.db.leadIntakeKey.delete({ where: { id } });
  }
}
