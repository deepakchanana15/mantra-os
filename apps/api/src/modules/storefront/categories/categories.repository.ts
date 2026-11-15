import { Injectable, NotFoundException } from "@nestjs/common";
import { SiteConnectionManager } from "../site-connection-manager.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";

@Injectable()
export class CategoriesRepository {
  constructor(private readonly connections: SiteConnectionManager) {}

  async findAll(siteId: string) {
    const client = await this.connections.getPrismaClient(siteId);
    return client.category.findMany({ orderBy: { sortOrder: "asc" } });
  }

  async findOneOrThrow(siteId: string, id: string) {
    const client = await this.connections.getPrismaClient(siteId);
    const category = await client.category.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException("Category not found");
    }
    return category;
  }

  async create(siteId: string, dto: CreateCategoryDto) {
    const client = await this.connections.getPrismaClient(siteId);
    return client.category.create({ data: { ...dto } });
  }

  async update(siteId: string, id: string, dto: UpdateCategoryDto) {
    await this.findOneOrThrow(siteId, id);
    const client = await this.connections.getPrismaClient(siteId);
    return client.category.update({ where: { id }, data: { ...dto } });
  }

  async remove(siteId: string, id: string) {
    await this.findOneOrThrow(siteId, id);
    const client = await this.connections.getPrismaClient(siteId);
    await client.category.delete({ where: { id } });
  }
}
