import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { PermissionGuard } from "../../../common/guards/permission.guard";
import { TenantMembershipGuard } from "../../../common/guards/tenant-membership.guard";
import { PERMISSIONS } from "../../../common/permissions/permission-keys";
import { CreateWhatsAppPhoneNumberDto } from "./dto/create-whatsapp-phone-number.dto";
import { WhatsAppPhoneNumbersService } from "./whatsapp-phone-numbers.service";

@Controller("v1/whatsapp-phone-numbers")
@UseGuards(JwtAuthGuard, TenantMembershipGuard, PermissionGuard)
export class WhatsAppPhoneNumbersController {
  constructor(private readonly phoneNumbers: WhatsAppPhoneNumbersService) {}

  @Get()
  @RequirePermission(PERMISSIONS.WHATSAPP_PHONE_NUMBERS_READ)
  findAll() {
    return this.phoneNumbers.findAll();
  }

  @Post()
  @RequirePermission(PERMISSIONS.WHATSAPP_PHONE_NUMBERS_CREATE)
  create(@Body() dto: CreateWhatsAppPhoneNumberDto) {
    return this.phoneNumbers.create(dto);
  }

  @Delete(":id")
  @RequirePermission(PERMISSIONS.WHATSAPP_PHONE_NUMBERS_DELETE)
  async remove(@Param("id") id: string) {
    await this.phoneNumbers.remove(id);
  }
}
