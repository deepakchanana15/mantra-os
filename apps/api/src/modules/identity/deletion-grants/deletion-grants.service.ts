import { Injectable } from "@nestjs/common";
import { DeletionGrantsRepository } from "./deletion-grants.repository";

@Injectable()
export class DeletionGrantsService {
  constructor(private readonly grants: DeletionGrantsRepository) {}

  findAll() {
    return this.grants.findAll();
  }

  grant(userId: string) {
    return this.grants.grant(userId);
  }

  revoke(userId: string) {
    return this.grants.revoke(userId);
  }
}
