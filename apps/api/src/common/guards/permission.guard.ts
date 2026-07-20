import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import { REQUIRE_PERMISSION } from "../decorators/require-permission.decorator";

/**
 * Must run after TenantMembershipGuard (needs req.membership). Reads the
 * already-loaded role/permission bundle instead of querying again — the
 * membership lookup happens once per request, in the guard above.
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredKey = this.reflector.getAllAndOverride<string>(REQUIRE_PERMISSION, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredKey) {
      return true;
    }

    const req = context.switchToHttp().getRequest<Request>();
    const permissions = req.membership?.role.rolePermissions ?? [];
    const hasPermission = permissions.some((rp) => rp.permission.key === requiredKey);

    if (!hasPermission) {
      throw new ForbiddenException(`Missing permission: ${requiredKey}`);
    }
    return true;
  }
}
