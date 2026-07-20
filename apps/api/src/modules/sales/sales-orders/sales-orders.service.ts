import { Injectable } from "@nestjs/common";
import { SalesOrderStatus } from "@mantra-os/db";
import { DeletionGuardService } from "../../../common/deletion/deletion-guard.service";
import { CreateSalesOrderDto } from "./dto/create-sales-order.dto";
import { SalesOrdersRepository } from "./sales-orders.repository";

@Injectable()
export class SalesOrdersService {
  constructor(
    private readonly salesOrders: SalesOrdersRepository,
    private readonly deletionGuard: DeletionGuardService,
  ) {}

  findAll(params: { skip?: number; take?: number; customerId?: string }) {
    return this.salesOrders.findAll(params);
  }

  findOne(id: string) {
    return this.salesOrders.findOneOrThrow(id);
  }

  create(dto: CreateSalesOrderDto) {
    return this.salesOrders.create(dto);
  }

  updateStatus(id: string, status: SalesOrderStatus) {
    return this.salesOrders.updateStatus(id, status);
  }

  async remove(id: string) {
    const order = await this.salesOrders.findOneOrThrow(id);
    return this.deletionGuard.deleteWithGovernance({
      entityType: "SalesOrder",
      entityId: id,
      entityCreatedBy: order.createdBy,
      softDelete: () => this.salesOrders.softDelete(id),
    });
  }
}
