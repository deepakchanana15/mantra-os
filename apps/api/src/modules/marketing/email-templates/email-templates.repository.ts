import { Injectable, NotFoundException } from "@nestjs/common";
import { BaseRepository } from "../../../common/repositories/base.repository";
import { CreateEmailTemplateDto } from "./dto/create-email-template.dto";
import { UpdateEmailTemplateDto } from "./dto/update-email-template.dto";

@Injectable()
export class EmailTemplatesRepository extends BaseRepository {
  findAll() {
    return this.db.emailTemplate.findMany({
      where: { organizationId: this.organizationId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOneOrThrow(id: string) {
    const template = await this.db.emailTemplate.findFirst({
      where: { id, organizationId: this.organizationId, deletedAt: null },
    });
    if (!template) {
      throw new NotFoundException("Email template not found");
    }
    return template;
  }

  create(dto: CreateEmailTemplateDto) {
    return this.db.emailTemplate.create({
      data: { ...dto, organizationId: this.organizationId, createdBy: this.userId, updatedBy: this.userId },
    });
  }

  async update(id: string, dto: UpdateEmailTemplateDto) {
    await this.findOneOrThrow(id);
    return this.db.emailTemplate.update({ where: { id }, data: { ...dto, updatedBy: this.userId } });
  }

  softDelete(id: string) {
    return this.db.emailTemplate.update({ where: { id }, data: { deletedAt: new Date(), updatedBy: this.userId } });
  }
}
