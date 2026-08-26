import { BadRequestException, Injectable } from "@nestjs/common";
import { PurchaseOrderStatus } from "@mantra-os/db";
import { DeletionGuardService } from "../../../common/deletion/deletion-guard.service";
import { CreatePurchaseOrderDto } from "./dto/create-purchase-order.dto";
import { UpdatePurchaseOrderDto } from "./dto/update-purchase-order.dto";
import { PurchaseOrderPdfService } from "./purchase-order-pdf.service";
import { PurchaseOrdersRepository } from "./purchase-orders.repository";

@Injectable()
export class PurchaseOrdersService {
  constructor(
    private readonly purchaseOrders: PurchaseOrdersRepository,
    private readonly deletionGuard: DeletionGuardService,
    private readonly purchaseOrderPdf: PurchaseOrderPdfService,
  ) {}

  async getPdf(id: string): Promise<{ buffer: Buffer; filename: string }> {
    const order = await this.purchaseOrders.findOneOrThrow(id);
    const buffer = await this.purchaseOrderPdf.generate(order);
    return { buffer, filename: `${order.poNumber ?? `PO-${order.id.slice(0, 8).toUpperCase()}`}.pdf` };
  }

  findAll(params: { skip?: number; take?: number; supplierId?: string }) {
    return this.purchaseOrders.findAll(params);
  }

  findOne(id: string) {
    return this.purchaseOrders.findOneOrThrow(id);
  }

  create(dto: CreatePurchaseOrderDto) {
    return this.purchaseOrders.create(dto);
  }

  /** Editing is only safe before the order has been sent to the supplier or any goods received against it. */
  async update(id: string, dto: UpdatePurchaseOrderDto) {
    const order = await this.purchaseOrders.findOneOrThrow(id);
    if (order.status !== "DRAFT") {
      throw new BadRequestException("Only draft purchase orders can be edited — cancel and create a new one instead");
    }
    return this.purchaseOrders.update(id, dto);
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
