import { Injectable } from "@nestjs/common";
import { BaseRepository } from "../../../common/repositories/base.repository";

@Injectable()
export class RolesRepository extends BaseRepository {
  /** System roles only for V1 — organizationId is always null. See ARCHITECTURE.md "RBAC scope". */
  findAllSystemRoles() {
    return this.db.role.findMany({
      where: { organizationId: null },
      include: { rolePermissions: { include: { permission: true } } },
      orderBy: { name: "asc" },
    });
  }
}
