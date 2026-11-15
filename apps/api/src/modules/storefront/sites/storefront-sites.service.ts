import { Injectable } from "@nestjs/common";
import { CreateStorefrontSiteDto } from "./dto/create-storefront-site.dto";
import { UpdateStorefrontSiteDto } from "./dto/update-storefront-site.dto";
import { StorefrontSitesRepository } from "./storefront-sites.repository";

@Injectable()
export class StorefrontSitesService {
  constructor(private readonly sites: StorefrontSitesRepository) {}

  findAll() {
    return this.sites.findAll();
  }

  findOne(id: string) {
    return this.sites.findOneOrThrow(id);
  }

  create(dto: CreateStorefrontSiteDto) {
    return this.sites.create(dto);
  }

  update(id: string, dto: UpdateStorefrontSiteDto) {
    return this.sites.update(id, dto);
  }

  remove(id: string) {
    return this.sites.remove(id);
  }
}
