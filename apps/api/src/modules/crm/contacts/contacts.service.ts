import { Injectable } from "@nestjs/common";
import { DeletionGuardService } from "../../../common/deletion/deletion-guard.service";
import { CreateContactDto } from "./dto/create-contact.dto";
import { UpdateContactDto } from "./dto/update-contact.dto";
import { ContactsRepository } from "./contacts.repository";

@Injectable()
export class ContactsService {
  constructor(
    private readonly contacts: ContactsRepository,
    private readonly deletionGuard: DeletionGuardService,
  ) {}

  findAll(params: { customerId?: string; skip?: number; take?: number }) {
    return this.contacts.findAll(params);
  }

  findOne(id: string) {
    return this.contacts.findOneOrThrow(id);
  }

  create(dto: CreateContactDto) {
    return this.contacts.create(dto);
  }

  update(id: string, dto: UpdateContactDto) {
    return this.contacts.update(id, dto);
  }

  async remove(id: string) {
    const contact = await this.contacts.findOneOrThrow(id);
    return this.deletionGuard.deleteWithGovernance({
      entityType: "Contact",
      entityId: id,
      entityCreatedBy: contact.createdBy,
      softDelete: () => this.contacts.softDelete(id),
    });
  }
}
