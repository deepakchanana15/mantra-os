import { Injectable, NotFoundException } from "@nestjs/common";
import { BaseRepository } from "../../../common/repositories/base.repository";
import { CreateStorefrontSiteDto } from "./dto/create-storefront-site.dto";
import { UpdateStorefrontSiteDto } from "./dto/update-storefront-site.dto";

/**
 * `databaseUrl`/`cloudinaryApiKey`/`cloudinaryApiSecret` are deliberately
 * never included here — the frontend only ever sees a site's identity and
 * status, not its connection credentials. See the `StorefrontSite` model
 * comment in schema.prisma and `IntegrationsRepository.INTEGRATION_SELECT`
 * for the same pattern used for Meta ad-account tokens.
 */
const STOREFRONT_SITE_SELECT = {
  id: true,
  organizationId: true,
  name: true,
  code: true,
  domain: true,
  locale: true,
  currencyCode: true,
  cloudinaryCloudName: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true,
} as const;

@Injectable()
export class StorefrontSitesRepository extends BaseRepository {
  findAll() {
    return this.db.storefrontSite.findMany({
      where: { organizationId: this.organizationId },
      select: STOREFRONT_SITE_SELECT,
      orderBy: { name: "asc" },
    });
  }

  async findOneOrThrow(id: string) {
    const site = await this.db.storefrontSite.findFirst({
      where: { id, organizationId: this.organizationId },
      select: STOREFRONT_SITE_SELECT,
    });
    if (!site) {
      throw new NotFoundException("Site not found");
    }
    return site;
  }

  /**
   * Full row, including connection credentials — used ONLY by
   * SiteConnectionManager to open the site's own database/Cloudinary
   * connection. Never call this from a controller-facing path.
   */
  async findConnectionConfigOrThrow(id: string) {
    const site = await this.db.storefrontSite.findFirst({
      where: { id, organizationId: this.organizationId },
    });
    if (!site) {
      throw new NotFoundException("Site not found");
    }
    return site;
  }

  create(dto: CreateStorefrontSiteDto) {
    return this.db.storefrontSite.create({
      data: {
        name: dto.name,
        code: dto.code,
        domain: dto.domain,
        locale: dto.locale,
        currencyCode: dto.currencyCode,
        databaseUrl: dto.databaseUrl,
        cloudinaryCloudName: dto.cloudinaryCloudName,
        cloudinaryApiKey: dto.cloudinaryApiKey,
        cloudinaryApiSecret: dto.cloudinaryApiSecret,
        status: dto.status,
        organizationId: this.organizationId,
        createdBy: this.userId,
        updatedBy: this.userId,
      },
      select: STOREFRONT_SITE_SELECT,
    });
  }

  async update(id: string, dto: UpdateStorefrontSiteDto) {
    await this.findConnectionConfigOrThrow(id);
    return this.db.storefrontSite.update({
      where: { id },
      data: {
        name: dto.name,
        code: dto.code,
        domain: dto.domain,
        locale: dto.locale,
        currencyCode: dto.currencyCode,
        databaseUrl: dto.databaseUrl,
        cloudinaryCloudName: dto.cloudinaryCloudName,
        cloudinaryApiKey: dto.cloudinaryApiKey,
        cloudinaryApiSecret: dto.cloudinaryApiSecret,
        status: dto.status,
        updatedBy: this.userId,
      },
      select: STOREFRONT_SITE_SELECT,
    });
  }

  async remove(id: string) {
    await this.findConnectionConfigOrThrow(id);
    await this.db.storefrontSite.delete({ where: { id } });
  }
}
