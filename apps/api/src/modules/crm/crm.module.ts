import { Module } from "@nestjs/common";
import { ContactsController } from "./contacts/contacts.controller";
import { ContactsRepository } from "./contacts/contacts.repository";
import { ContactsService } from "./contacts/contacts.service";
import { CustomersController } from "./customers/customers.controller";
import { CustomersRepository } from "./customers/customers.repository";
import { CustomersService } from "./customers/customers.service";

@Module({
  controllers: [CustomersController, ContactsController],
  providers: [CustomersRepository, CustomersService, ContactsRepository, ContactsService],
  exports: [CustomersRepository],
})
export class CrmModule {}
