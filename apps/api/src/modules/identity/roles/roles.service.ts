import { Injectable } from "@nestjs/common";
import { RolesRepository } from "./roles.repository";

@Injectable()
export class RolesService {
  constructor(private readonly roles: RolesRepository) {}

  findAll() {
    return this.roles.findAllSystemRoles();
  }
}
