import { SetMetadata } from "@nestjs/common";
import { PermissionKey } from "../permissions/permission-keys";

export const REQUIRE_PERMISSION = "requirePermission";

export const RequirePermission = (key: PermissionKey) => SetMetadata(REQUIRE_PERMISSION, key);
