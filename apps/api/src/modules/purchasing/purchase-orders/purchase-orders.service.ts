import { Injectable } from "@nestjs/common";
import { PurchaseOrderStatus } from "@mantra-os/db";
import { DeletionGuardService } from "../../../common/deletion/deletion-guard.service";
import { CreatePurchaseOrderDto } from "./dto/create-purchase-order.dto";
import { PurchaseOrdersRepository } from "./purchase-orders.repository";

@Injectable()
export class PurchaseOrdersService {
  constructor(
    private readonly purchaseOrders: PurchaseOrdersRepository,
    private readonly deletionGuard: DeletionGuardService,
  ) {}

  findAll(params: { skip?: number; take?: number; supplierId?: string }) {
    return this.purchaseOrders.findAll(params);
  }

  findOne(id: string) {
    return this.purchaseOrders.findOneOrThrow(id);
  }

  create(dto: CreatePurchaseOrderDto) {
    return this.purchaseOrders.create(dto);
  }

  updateStatus(id: string, status: PurchaseOrderStatus) {
    return this.purchaseOrders.updateStatus(id, status);
  }

  async remove(id: string) {
    const order = await this.purchaseOrders.findOneOrThrow(id);
    return this.deletionGuard.deleteWithGovernance({
      entityType: "PurchaseOrder",
      entityId: id,
      entityCreatedBy: order.createdBy,
      softDelete: () => this.purchaseOrders.softDelete(id),
    });
  }
}
