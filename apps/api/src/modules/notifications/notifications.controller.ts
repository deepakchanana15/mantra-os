import { Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionGuard } from "../../common/guards/permission.guard";
import { TenantMembershipGuard } from "../../common/guards/tenant-membership.guard";
import { User } from "@mantra-os/db";
import { NotificationsService } from "./notifications.service";

@Controller("v1/notifications")
@UseGuards(JwtAuthGuard, TenantMembershipGuard, PermissionGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.notifications.findAllForUser(user.id);
  }

  @Patch(":id/read")
  markRead(@Param("id") id: string, @CurrentUser() user: User) {
    return this.notifications.markRead(id, user.id);
  }
}
