import { Module } from "@nestjs/common";
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ValidationPipe } from "@nestjs/common";
import { CommonModule } from "./common/common.module";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { TenantContextInterceptor } from "./common/interceptors/tenant-context.interceptor";
import { AuthModule } from "./modules/auth/auth.module";
import { CrmModule } from "./modules/crm/crm.module";
import { GlobalModule } from "./modules/global/global.module";
import { IdentityModule } from "./modules/identity/identity.module";
import { InventoryModule } from "./modules/inventory/inventory.module";
import { MarketingModule } from "./modules/marketing/marketing.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { ProductsModule } from "./modules/products/products.module";
import { PurchasingModule } from "./modules/purchasing/purchasing.module";
import { ReportsModule } from "./modules/reports/reports.module";
import { SalesModule } from "./modules/sales/sales.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    CommonModule,
    AuthModule,
    IdentityModule,
    GlobalModule,
    NotificationsModule,
    CrmModule,
    ProductsModule,
    InventoryModule,
    SalesModule,
    PurchasingModule,
    MarketingModule,
    ReportsModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    },
    // Global, not per-controller @UseInterceptors — every tenant-scoped
    // route needs the RLS transaction it opens. Its own SkipTenantContext
    // check (see the interceptor) is what lets org-picker-style routes
    // opt out, not selective registration here. Discovered missing via
    // packages/db/scripts/verify-frontend-e2e.js — see DECISIONS.md.
    { provide: APP_INTERCEPTOR, useClass: TenantContextInterceptor },
  ],
})
export class AppModule {}
