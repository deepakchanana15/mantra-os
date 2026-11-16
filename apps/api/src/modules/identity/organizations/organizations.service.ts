import { Injectable } from "@nestjs/common";
import { UpdateOrganizationDto } from "./dto/update-organization.dto";
import { OrganizationsRepository } from "./organizations.repository";

@Injectable()
export class OrganizationsService {
  constructor(private readonly organizations: OrganizationsRepository) {}

  listForUser(userId: string) {
    return this.organizations.findAllForUser(userId);
  }

  getCurrent() {
    return this.organizations.findCurrent();
  }

  updateCurrent(dto: UpdateOrganizationDto) {
    return this.organizations.updateCurrent(dto);
  }
}
