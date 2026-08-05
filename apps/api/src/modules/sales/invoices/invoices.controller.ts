import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { PaginationQueryDto } from "../../../common/dto/pagination-query.dto";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { PermissionGuard } from "../../../common/guards/permission.guard";
import { TenantMembershipGuard } from "../../../common/guards/tenant-membership.guard";
import { PERMISSIONS } from "../../../common/permissions/permission-keys";
import { CreateInvoiceDto } from "./dto/create-invoice.dto";
import { UpdateInvoiceDto } from "./dto/update-invoice.dto";
import { InvoicesService } from "./invoices.service";

@Controller("v1/invoices")
@UseGuards(JwtAuthGuard, TenantMembershipGuard, PermissionGuard)
export class InvoicesController {
  constructor(private readonly invoices: InvoicesService) {}

  @Get()
  @RequirePermission(PERMISSIONS.INVOICES_READ)
  findAll(@Query() query: PaginationQueryDto) {
    return this.invoices.findAll(query);
  }

  @Get(":id")
  @RequirePermission(PERMISSIONS.INVOICES_READ)
  findOne(@Param("id") id: string) {
    return this.invoices.findOne(id);
  }

  @Get(":id/pdf")
  @RequirePermission(PERMISSIONS.INVOICES_READ)
  async downloadPdf(@Param("id") id: string, @Res() res: Response) {
    const { buffer, filename } = await this.invoices.getPdf(id);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Post()
  @RequirePermission(PERMISSIONS.INVOICES_CREATE)
  create(@Body() dto: CreateInvoiceDto) {
    return this.invoices.create(dto);
  }

  @Patch(":id")
  @RequirePermission(PERMISSIONS.INVOICES_UPDATE)
  update(@Param("id") id: string, @Body() dto: UpdateInvoiceDto) {
    return this.invoices.update(id, dto);
  }

  @Delete(":id")
  @RequirePermission(PERMISSIONS.INVOICES_DELETE)
  remove(@Param("id") id: string) {
    return this.invoices.remove(id);
  }
}
