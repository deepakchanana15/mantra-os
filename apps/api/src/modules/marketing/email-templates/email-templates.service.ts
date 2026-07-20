import { Injectable } from "@nestjs/common";
import { DeletionGuardService } from "../../../common/deletion/deletion-guard.service";
import { CreateEmailTemplateDto } from "./dto/create-email-template.dto";
import { UpdateEmailTemplateDto } from "./dto/update-email-template.dto";
import { EmailTemplatesRepository } from "./email-templates.repository";

@Injectable()
export class EmailTemplatesService {
  constructor(
    private readonly templates: EmailTemplatesRepository,
    private readonly deletionGuard: DeletionGuardService,
  ) {}

  findAll() {
    return this.templates.findAll();
  }

  findOne(id: string) {
    return this.templates.findOneOrThrow(id);
  }

  create(dto: CreateEmailTemplateDto) {
    return this.templates.create(dto);
  }

  update(id: string, dto: UpdateEmailTemplateDto) {
    return this.templates.update(id, dto);
  }

  async remove(id: string) {
    const template = await this.templates.findOneOrThrow(id);
    return this.deletionGuard.deleteWithGovernance({
      entityType: "EmailTemplate",
      entityId: id,
      entityCreatedBy: template.createdBy,
      softDelete: () => this.templates.softDelete(id),
    });
  }
}
