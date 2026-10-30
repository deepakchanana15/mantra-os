import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { BaseRepository } from "../../../common/repositories/base.repository";
import { CreateMetaLeadPageDto } from "./dto/create-meta-lead-page.dto";

const META_LEAD_PAGE_SELECT = {
  id: true,
  pageId: true,
  label: true,
  enabled: true,
  companyId: true,
  company: { select: { name: true } },
  createdAt: true,
} as const;

/**
 * `MetaLeadPage` carries no RLS policy (see its schema comment) — the
 * public leadgen webhook needs to look one up by Meta's `pageId` with no
 * org context to set first. That means every query here MUST filter by
 * `organizationId` explicitly in the WHERE clause; the database will not
 * do it automatically the way it does for every other tenant-scoped table.
 *
 * `pageAccessToken` is deliberately never included in `META_LEAD_PAGE_SELECT`
 * — the frontend only ever sees connection status, not the credential
 * itself, once it's stored. Same reasoning as `IntegrationsRepository`.
 */
@Injectable()
export class MetaLeadPagesRepository extends BaseRepository {
  findAll() {
    return this.db.metaLeadPage.findMany({
      where: { organizationId: this.organizationId },
      select: META_LEAD_PAGE_SELECT,
      orderBy: { createdAt: "desc" },
    });
  }

  async create(dto: CreateMetaLeadPageDto) {
    const existing = await this.db.metaLeadPage.findUnique({ where: { pageId: dto.pageId } });
    if (existing) {
      throw new ConflictException("This Facebook Page is already connected");
    }
    return this.db.metaLeadPage.create({
      data: {
        organizationId: this.organizationId,
        companyId: dto.companyId,
        pageId: dto.pageId,
        pageAccessToken: dto.pageAccessToken,
        label: dto.label,
        createdBy: this.userId,
        updatedBy: this.userId,
      },
      select: META_LEAD_PAGE_SELECT,
    });
  }

  async remove(id: string) {
    const existing = await this.db.metaLeadPage.findFirst({
      where: { id, organizationId: this.organizationId },
    });
    if (!existing) {
      throw new NotFoundException("Meta lead page not found");
    }
    await this.db.metaLeadPage.delete({ where: { id } });
  }
}
