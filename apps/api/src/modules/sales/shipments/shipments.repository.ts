import { Injectable, NotFoundException } from "@nestjs/common";
import { BaseRepository } from "../../../common/repositories/base.repository";
import { CreateShipmentDto } from "./dto/create-shipment.dto";

@Injectable()
export class ShipmentsRepository extends BaseRepository {
  findAll(params: { skip?: number; take?: number; salesOrderId?: string }) {
    return this.db.shipment.findMany({
      where: {
        organizationId: this.organizationId,
        deletedAt: null,
        ...(params.salesOrderId ? { salesOrderId: params.salesOrderId } : {}),
      },
      include: { warehouse: true, lines: true },
      skip: params.skip ?? 0,
      take: params.take ?? 50,
      orderBy: { createdAt: "desc" },
    });
  }

  async findOneOrThrow(id: string) {
    const shipment = await this.db.shipment.findFirst({
      where: { id, organizationId: this.organizationId, deletedAt: null },
      include: { warehouse: true, lines: { include: { salesOrderLine: true } } },
    });
    if (!shipment) {
      throw new NotFoundException("Shipment not found");
    }
    return shipment;
  }

  /** Resolves each line's productId from its SalesOrderLine — the DTO only carries salesOrderLineId + quantity. */
  async resolveLineProducts(salesOrderLineIds: string[]) {
    const lines = await this.db.salesOrderLine.findMany({
      where: { id: { in: salesOrderLineIds }, organizationId: this.organizationId },
    });
    const byId = new Map(lines.map((line) => [line.id, line]));
    const missing = salesOrderLineIds.filter((id) => !byId.has(id));
    if (missing.length > 0) {
      throw new NotFoundException(`Sales order line(s) not found: ${missing.join(", ")}`);
    }
    return byId;
  }

  create(dto: CreateShipmentDto) {
    return this.db.shipment.create({
      data: {
        organizationId: this.organizationId,
        salesOrderId: dto.salesOrderId,
        warehouseId: dto.warehouseId,
        createdBy: this.userId,
        updatedBy: this.userId,
        lines: {
          create: dto.lines.map((line) => ({
            organizationId: this.organizationId,
            salesOrderLineId: line.salesOrderLineId,
            quantity: line.quantity,
          })),
        },
      },
      include: { lines: true },
    });
  }

  softDelete(id: string) {
    return this.db.shipment.update({ where: { id }, data: { deletedAt: new Date(), updatedBy: this.userId } });
  }
}
