import { Module } from "@nestjs/common";
import { DeletionGrantsController } from "./deletion-grants/deletion-grants.controller";
import { DeletionGrantsRepository } from "./deletion-grants/deletion-grants.repository";
import { DeletionGrantsService } from "./deletion-grants/deletion-grants.service";
import { MembershipsController } from "./memberships/memberships.controller";
import { MembershipsRepository } from "./memberships/memberships.repository";
import { MembershipsService } from "./memberships/memberships.service";
import { OrganizationsController } from "./organizations/organizations.controller";
import { OrganizationsRepository } from "./organizations/organizations.repository";
import { OrganizationsService } from "./organizations/organizations.service";
import { RolesController } from "./roles/roles.controller";
import { RolesRepository } from "./roles/roles.repository";
import { RolesService } from "./roles/roles.service";

@Module({
  controllers: [OrganizationsController, MembershipsController, DeletionGrantsController, RolesController],
  providers: [
    OrganizationsRepository,
    OrganizationsService,
    MembershipsRepository,
    MembershipsService,
    DeletionGrantsRepository,
    DeletionGrantsService,
    RolesRepository,
    RolesService,
  ],
})
export class IdentityModule {}
