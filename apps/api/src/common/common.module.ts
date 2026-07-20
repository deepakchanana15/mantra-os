import { Global, Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { TenantContextService } from "./context/tenant-context.service";
import { DeletionGuardService } from "./deletion/deletion-guard.service";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { PermissionGuard } from "./guards/permission.guard";
import { TenantMembershipGuard } from "./guards/tenant-membership.guard";
import { TenantContextInterceptor } from "./interceptors/tenant-context.interceptor";

/**
 * Cross-cutting providers available to every domain module without each one
 * importing this individually. See ARCHITECTURE.md for what each piece does.
 *
 * Request pipeline order for a tenant-scoped route:
 *   JwtAuthGuard -> TenantMembershipGuard -> PermissionGuard (guards)
 *   -> TenantContextInterceptor (opens the RLS transaction) -> handler
 */
@Global()
@Module({
  imports: [PrismaModule],
  providers: [
    JwtAuthGuard,
    TenantMembershipGuard,
    PermissionGuard,
    TenantContextInterceptor,
    TenantContextService,
    DeletionGuardService,
  ],
  exports: [
    PrismaModule,
    JwtAuthGuard,
    TenantMembershipGuard,
    PermissionGuard,
    TenantContextInterceptor,
    TenantContextService,
    DeletionGuardService,
  ],
})
export class CommonModule {}
