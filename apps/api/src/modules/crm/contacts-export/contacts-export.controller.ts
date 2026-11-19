import { Controller, Get, Query, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { PermissionGuard } from "../../../common/guards/permission.guard";
import { TenantMembershipGuard } from "../../../common/guards/tenant-membership.guard";
import { PERMISSIONS } from "../../../common/permissions/permission-keys";
import { ContactsExportService } from "./contacts-export.service";

@Controller("v1/contacts-export")
@UseGuards(JwtAuthGuard, TenantMembershipGuard, PermissionGuard)
export class ContactsExportController {
  constructor(private readonly contactsExport: ContactsExportService) {}

  @Get("vcard")
  @RequirePermission(PERMISSIONS.CUSTOMERS_READ)
  async downloadVCard(@Query("country") country: string | undefined, @Res() res: Response) {
    const vcard = await this.contactsExport.buildVCard(country);
    const filename = country ? `mantra-os-contacts-${country.toLowerCase()}.vcf` : "mantra-os-contacts.vcf";
    res.setHeader("Content-Type", "text/vcard; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(vcard);
  }
}
