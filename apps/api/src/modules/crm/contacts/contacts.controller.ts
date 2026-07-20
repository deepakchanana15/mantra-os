import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { IsOptional, IsUUID } from "class-validator";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { PaginationQueryDto } from "../../../common/dto/pagination-query.dto";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { PermissionGuard } from "../../../common/guards/permission.guard";
import { TenantMembershipGuard } from "../../../common/guards/tenant-membership.guard";
import { PERMISSIONS } from "../../../common/permissions/permission-keys";
import { CreateContactDto } from "./dto/create-contact.dto";
import { UpdateContactDto } from "./dto/update-contact.dto";
import { ContactsService } from "./contacts.service";

class ListContactsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  customerId?: string;
}

@Controller("v1/contacts")
@UseGuards(JwtAuthGuard, TenantMembershipGuard, PermissionGuard)
export class ContactsController {
  constructor(private readonly contacts: ContactsService) {}

  @Get()
  @RequirePermission(PERMISSIONS.CONTACTS_READ)
  findAll(@Query() query: ListContactsQueryDto) {
    return this.contacts.findAll(query);
  }

  @Get(":id")
  @RequirePermission(PERMISSIONS.CONTACTS_READ)
  findOne(@Param("id") id: string) {
    return this.contacts.findOne(id);
  }

  @Post()
  @RequirePermission(PERMISSIONS.CONTACTS_CREATE)
  create(@Body() dto: CreateContactDto) {
    return this.contacts.create(dto);
  }

  @Patch(":id")
  @RequirePermission(PERMISSIONS.CONTACTS_UPDATE)
  update(@Param("id") id: string, @Body() dto: UpdateContactDto) {
    return this.contacts.update(id, dto);
  }

  @Delete(":id")
  @RequirePermission(PERMISSIONS.CONTACTS_DELETE)
  remove(@Param("id") id: string) {
    return this.contacts.remove(id);
  }
}
