import { Injectable } from "@nestjs/common";
import { CreateMemberDto } from "./dto/create-member.dto";
import { MembershipsRepository } from "./memberships.repository";

@Injectable()
export class MembershipsService {
  constructor(private readonly memberships: MembershipsRepository) {}

  findAll() {
    return this.memberships.findAll();
  }

  create(dto: CreateMemberDto) {
    return this.memberships.create(dto);
  }

  updateRole(membershipId: string, roleKey: string) {
    return this.memberships.updateRole(membershipId, roleKey);
  }

  remove(membershipId: string) {
    return this.memberships.remove(membershipId);
  }
}
