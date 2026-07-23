import { Injectable, NotFoundException } from "@nestjs/common";
import { SalesChannel, SalesOrderStatus } from "@mantra-os/db";
import { BaseRepository } from "../../../common/repositories/base.repository";
import { CreateSalesOrderDto } from "./dto/create-sales-order.dto";

@Injectable()
export class SalesOrdersRepository extends BaseRepository {
  findAll(params: { skip?: number; take?: number; customerId?: string; salesChannel?: SalesChannel }) {
    return this.db.salesOrder.findMany({
      where: {
        organizationId: this.organizationId,
        deletedAt: null,
        ...(params.customerId ? { customerId: params.customerId } : {}),
        ...(params.salesChannel ? { salesChannel: params.salesChannel } : {}),
      },
      include: { customer: true, lines: { include: { product: true } } },
      skip: params.skip ?? 0,
      take: params.take ?? 50,
      orderBy: { createdAt: "desc" },
    });
  }

  async findOneOrThrow(id: string) {
    const order = await this.db.salesOrder.findFirst({
      where: { id, organizationId: this.organizationId, deletedAt: null },
      include: { customer: true, lines: { include: { product: true } }, shipments: true },
    });
    if (!order) {
      throw new NotFoundException("Sales order not found");
    }
    return order;
  }

  create(dto: CreateSalesOrderDto) {
    return this.db.salesOrder.create({
      data: {
        organizationId: this.organizationId,
        customerId: dto.customerId,
        quoteId: dto.quoteId,
        salesChannel: dto.salesChannel,
        onlineChannelType: dto.onlineChannelType,
        offlineChannelType: dto.offlineChannelType,
        orderReference: dto.orderReference,
        companyId: dto.companyId,
        countryId: dto.countryId,
        createdBy: this.userId,
        updatedBy: this.userId,
        lines: {
          create: dto.lines.map((line) => ({
            organizationId: this.organizationId,
            productId: line.productId,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
          })),
        },
      },
      include: { lines: true },
    });
  }

  async updateStatus(id: string, status: SalesOrderStatus) {
    await this.findOneOrThrow(id);
    return this.db.salesOrder.update({ where: { id }, data: { status, updatedBy: this.userId } });
  }

  softDelete(id: string) {
    return this.db.salesOrder.update({ where: { id }, data: { deletedAt: new Date(), updatedBy: this.userId } });
  }
}
