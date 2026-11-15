import { Injectable } from "@nestjs/common";
import { UpdateSettingsDto } from "./dto/update-settings.dto";
import { SettingsRepository } from "./settings.repository";

@Injectable()
export class SettingsService {
  constructor(private readonly settings: SettingsRepository) {}

  findAll(siteId: string) {
    return this.settings.findAll(siteId);
  }

  update(siteId: string, dto: UpdateSettingsDto) {
    return this.settings.upsertMany(siteId, dto.settings);
  }
}
