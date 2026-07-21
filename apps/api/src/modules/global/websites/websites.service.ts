import { Injectable } from "@nestjs/common";
import { DeletionGuardService } from "../../../common/deletion/deletion-guard.service";
import { CreateWebsiteDto } from "./dto/create-website.dto";
import { UpdateWebsiteDto } from "./dto/update-website.dto";
import { WebsitesRepository } from "./websites.repository";

@Injectable()
export class WebsitesService {
  constructor(
    private readonly websites: WebsitesRepository,
    private readonly deletionGuard: DeletionGuardService,
  ) {}

  findAll() {
    return this.websites.findAll();
  }

  findOne(id: string) {
    return this.websites.findOneOrThrow(id);
  }

  create(dto: CreateWebsiteDto) {
    return this.websites.create(dto);
  }

  update(id: string, dto: UpdateWebsiteDto) {
    return this.websites.update(id, dto);
  }

  async remove(id: string) {
    const website = await this.websites.findOneOrThrow(id);
    return this.deletionGuard.deleteWithGovernance({
      entityType: "Website",
      entityId: id,
      entityCreatedBy: website.createdBy,
      softDelete: () => this.websites.softDelete(id),
    });
  }
}
