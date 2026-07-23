import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { BaseRepository } from "../../../common/repositories/base.repository";
import { CreateMemberDto } from "./dto/create-member.dto";

const BCRYPT_ROUNDS = 10;

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

  /**
   * Creates a login directly — no email-verification step. If a User with
   * this email already exists (e.g. a member of another org), reuses that
   * account and just adds a Membership; their existing password is
   * untouched. Otherwise creates both the User and the Membership together.
   */
  async create(dto: CreateMemberDto) {
    const role = await this.db.role.findFirst({ where: { key: dto.roleKey, organizationId: null } });
    if (!role) {
      throw new NotFoundException(`Unknown role: ${dto.roleKey}`);
    }

    let user = await this.db.user.findFirst({ where: { email: dto.email, deletedAt: null } });
    if (user) {
      const existingMembership = await this.db.membership.findFirst({
        where: { organizationId: this.organizationId, userId: user.id },
      });
      if (existingMembership) {
        throw new ConflictException(`${dto.email} is already a member of this organization`);
      }
    } else {
      const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
      user = await this.db.user.create({ data: { email: dto.email, name: dto.name, passwordHash } });
    }

    return this.db.membership.create({
      data: { organizationId: this.organizationId, userId: user.id, roleId: role.id },
      include: { user: true, role: true },
    });
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
