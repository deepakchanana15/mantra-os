import { Injectable } from "@nestjs/common";
import { CreateMetaLeadPageDto } from "./dto/create-meta-lead-page.dto";
import { MetaLeadPagesRepository } from "./meta-lead-pages.repository";

@Injectable()
export class MetaLeadPagesService {
  constructor(private readonly pages: MetaLeadPagesRepository) {}

  findAll() {
    return this.pages.findAll();
  }

  create(dto: CreateMetaLeadPageDto) {
    return this.pages.create(dto);
  }

  remove(id: string) {
    return this.pages.remove(id);
  }
}
