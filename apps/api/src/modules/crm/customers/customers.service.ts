import { Injectable } from "@nestjs/common";
import { DeletionGuardService } from "../../../common/deletion/deletion-guard.service";
import { CreateCustomerDto } from "./dto/create-customer.dto";
import { UpdateCustomerDto } from "./dto/update-customer.dto";
import { CustomersRepository } from "./customers.repository";

@Injectable()
export class CustomersService {
  constructor(
    private readonly customers: CustomersRepository,
    private readonly deletionGuard: DeletionGuardService,
  ) {}

  findAll(params: { skip?: number; take?: number; search?: string }) {
    return this.customers.findAll(params);
  }

  findOne(id: string) {
    return this.customers.findOneOrThrow(id);
  }

  create(dto: CreateCustomerDto) {
    return this.customers.create(dto);
  }

  update(id: string, dto: UpdateCustomerDto) {
    return this.customers.update(id, dto);
  }

  async remove(id: string) {
    const customer = await this.customers.findOneOrThrow(id);
    return this.deletionGuard.deleteWithGovernance({
      entityType: "Customer",
      entityId: id,
      entityCreatedBy: customer.createdBy,
      softDelete: () => this.customers.softDelete(id),
    });
  }
}
