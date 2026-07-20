import { Injectable, NotFoundException } from "@nestjs/common";
import { BaseRepository } from "../../../common/repositories/base.repository";

@Injectable()
export class MembershipsRepository extends BaseRepository {
  findAll() {
    return this.db.membership.findMany({
      where: { organizationId: this.organizationId },
      include: { user: true, role: true },
      orderBy: { createdAt: "asc" },
    });
  }

  async findOneOrThrow(membershipId: string) {
    const membership = await this.db.membership.findFirst({
      where: { id: membershipId, organizationId: this.organizationId },
      include: { user: true, role: true },
    });
    if (!membership) {
      throw new NotFoundException("Member not found");
    }
    return membership;
  }

  async updateRole(membershipId: string, roleKey: string) {
    const role = await this.db.role.findFirst({
      where: { key: roleKey, organizationId: null },
    });
    if (!role) {
      throw new NotFoundException(`Unknown role: ${roleKey}`);
    }
    await this.findOneOrThrow(membershipId);
    return this.db.membership.update({
      where: { id: membershipId },
      data: { roleId: role.id },
      include: { user: true, role: true },
    });
  }

  async remove(membershipId: string) {
    await this.findOneOrThrow(membershipId);
    return this.db.membership.delete({ where: { id: membershipId } });
  }
}
