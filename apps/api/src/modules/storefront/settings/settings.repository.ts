import { Injectable } from "@nestjs/common";
import { SiteConnectionManager } from "../site-connection-manager.service";

@Injectable()
export class SettingsRepository {
  constructor(private readonly connections: SiteConnectionManager) {}

  async findAll(siteId: string) {
    const client = await this.connections.getPrismaClient(siteId);
    return client.siteSetting.findMany({ orderBy: { key: "asc" } });
  }

  async upsertMany(siteId: string, items: { key: string; value?: string | null }[]) {
    const client = await this.connections.getPrismaClient(siteId);
    return Promise.all(
      items.map((item) =>
        client.siteSetting.upsert({
          where: { key: item.key },
          create: { key: item.key, value: item.value ?? null },
          update: { value: item.value ?? null },
        }),
      ),
    );
  }
}
