import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { PermissionGuard } from "../../../common/guards/permission.guard";
import { TenantMembershipGuard } from "../../../common/guards/tenant-membership.guard";
import { PERMISSIONS } from "../../../common/permissions/permission-keys";
import { CreateSegmentDto } from "./dto/create-segment.dto";
import { UpdateSegmentDto } from "./dto/update-segment.dto";
import { SegmentsService } from "./segments.service";

@Controller("v1/segments")
@UseGuards(JwtAuthGuard, TenantMembershipGuard, PermissionGuard)
export class SegmentsController {
  constructor(private readonly segments: SegmentsService) {}

  @Get()
  @RequirePermission(PERMISSIONS.SEGMENTS_READ)
  findAll() {
    return this.segments.findAll();
  }

  @Get(":id")
  @RequirePermission(PERMISSIONS.SEGMENTS_READ)
  findOne(@Param("id") id: string) {
    return this.segments.findOne(id);
  }

  @Post()
  @RequirePermission(PERMISSIONS.SEGMENTS_CREATE)
  create(@Body() dto: CreateSegmentDto) {
    return this.segments.create(dto);
  }

  @Patch(":id")
  @RequirePermission(PERMISSIONS.SEGMENTS_UPDATE)
  update(@Param("id") id: string, @Body() dto: UpdateSegmentDto) {
    return this.segments.update(id, dto);
  }

  @Delete(":id")
  @RequirePermission(PERMISSIONS.SEGMENTS_DELETE)
  remove(@Param("id") id: string) {
    return this.segments.remove(id);
  }
}
