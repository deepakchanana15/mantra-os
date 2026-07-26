import { Injectable } from "@nestjs/common";
import { CreateLeadIntakeKeyDto } from "./dto/create-lead-intake-key.dto";
import { LeadIntakeKeysRepository } from "./lead-intake-keys.repository";

@Injectable()
export class LeadIntakeKeysService {
  constructor(private readonly keys: LeadIntakeKeysRepository) {}

  findAll() {
    return this.keys.findAll();
  }

  create(dto: CreateLeadIntakeKeyDto) {
    return this.keys.create(dto);
  }

  remove(id: string) {
    return this.keys.remove(id);
  }
}
