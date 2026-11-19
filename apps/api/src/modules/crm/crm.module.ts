import { Module } from "@nestjs/common";
import { ActivityModule } from "../activity/activity.module";
import { SalesModule } from "../sales/sales.module";
import { ContactsController } from "./contacts/contacts.controller";
import { ContactsRepository } from "./contacts/contacts.repository";
import { ContactsService } from "./contacts/contacts.service";
import { ContactsExportController } from "./contacts-export/contacts-export.controller";
import { ContactsExportRepository } from "./contacts-export/contacts-export.repository";
import { ContactsExportService } from "./contacts-export/contacts-export.service";
import { CustomersController } from "./customers/customers.controller";
import { CustomersRepository } from "./customers/customers.repository";
import { CustomersService } from "./customers/customers.service";

@Module({
  imports: [ActivityModule, SalesModule],
  controllers: [CustomersController, ContactsController, ContactsExportController],
  providers: [
    CustomersRepository,
    CustomersService,
    ContactsRepository,
    ContactsService,
    ContactsExportRepository,
    ContactsExportService,
  ],
  exports: [CustomersRepository],
})
export class CrmModule {}
