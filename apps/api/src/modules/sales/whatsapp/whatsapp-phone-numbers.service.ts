import { Injectable } from "@nestjs/common";
import { CreateWhatsAppPhoneNumberDto } from "./dto/create-whatsapp-phone-number.dto";
import { WhatsAppPhoneNumbersRepository } from "./whatsapp-phone-numbers.repository";

@Injectable()
export class WhatsAppPhoneNumbersService {
  constructor(private readonly phoneNumbers: WhatsAppPhoneNumbersRepository) {}

  findAll() {
    return this.phoneNumbers.findAll();
  }

  create(dto: CreateWhatsAppPhoneNumberDto) {
    return this.phoneNumbers.create(dto);
  }

  remove(id: string) {
    return this.phoneNumbers.remove(id);
  }
}
