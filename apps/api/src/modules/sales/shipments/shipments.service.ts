import { Injectable } from "@nestjs/common";
import { InventoryTransactionType } from "@mantra-os/db";
import { DeletionGuardService } from "../../../common/deletion/deletion-guard.service";
import { InventoryService } from "../../inventory/stock/inventory.service";
import { SalesOrdersRepository } from "../sales-orders/sales-orders.repository";
import { CreateShipmentDto } from "./dto/create-shipment.dto";
import { computeShippingStatus } from "./shipment-status.util";
import { ShipmentsRepository } from "./shipments.repository";

/**
 * The one place Sales writes to the Inventory ledger — a direct service
 * call, not an event, because Sales genuinely depends on Inventory in the
 * DDD dependency graph (see ARCHITECTURE.md "Domain boundaries"). Events
 * are reserved for the Notifications-style "react, don't couple" case.
 */
@Injectable()
export class ShipmentsService {
  constructor(
    private readonly shipments: ShipmentsRepository,
    private readonly salesOrders: SalesOrdersRepository,
    private readonly inventory: InventoryService,
    private readonly deletionGuard: DeletionGuardService,
  ) {}

  findAll(params: { skip?: number; take?: number; salesOrderId?: string }) {
    return this.shipments.findAll(params);
  }

  findOne(id: string) {
    return this.shipments.findOneOrThrow(id);
  }

  async create(dto: CreateShipmentDto) {
    const productsByLineId = await this.shipments.resolveLineProducts(
      dto.lines.map((line) => line.salesOrderLineId),
    );

    const shipment = await this.shipments.create(dto);

    for (const line of dto.lines) {
      const salesOrderLine = productsByLineId.get(line.salesOrderLineId)!;
      await this.inventory.recordMovement({
        productId: salesOrderLine.productId,
        warehouseId: dto.warehouseId,
        type: InventoryTransactionType.SHIPMENT,
        quantityDelta: -line.quantity,
        referenceType: "Shipment",
        referenceId: shipment.id,
      });
    }

    await this.updateSalesOrderShippingStatus(dto.salesOrderId);
    return shipment;
  }

  async remove(id: string) {
    const shipment = await this.shipments.findOneOrThrow(id);
    return this.deletionGuard.deleteWithGovernance({
      entityType: "Shipment",
      entityId: id,
      entityCreatedBy: shipment.createdBy,
      softDelete: () => this.shipments.softDelete(id),
    });
  }

  /** Orchestration only — the actual status math is in shipment-status.util.ts (unit tested there). */
  private async updateSalesOrderShippingStatus(salesOrderId: string): Promise<void> {
    const order = await this.salesOrders.findOneOrThrow(salesOrderId);
    const shipments = await this.shipments.findAll({ salesOrderId, take: 1000 });
    const shipmentLines = shipments.flatMap((shipment) => shipment.lines);

    const status = computeShippingStatus(order.lines, shipmentLines, order.status);

    if (status !== order.status) {
      await this.salesOrders.updateStatus(salesOrderId, status);
    }
  }
}
