import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { BaseRepository } from "../../../common/repositories/base.repository";
import { CreateWhatsAppPhoneNumberDto } from "./dto/create-whatsapp-phone-number.dto";

/**
 * `WhatsAppPhoneNumber` carries no RLS policy (see its schema comment) —
 * the public webhook needs to look one up by Meta's `phoneNumberId` with
 * no org context to set first. That means every query here MUST filter by
 * `organizationId` explicitly in the WHERE clause; the database will not
 * do it automatically the way it does for every other tenant-scoped table.
 */
@Injectable()
export class WhatsAppPhoneNumbersRepository extends BaseRepository {
  findAll() {
    return this.db.whatsAppPhoneNumber.findMany({
      where: { organizationId: this.organizationId },
      include: { company: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(dto: CreateWhatsAppPhoneNumberDto) {
    const existing = await this.db.whatsAppPhoneNumber.findUnique({ where: { phoneNumberId: dto.phoneNumberId } });
    if (existing) {
      throw new ConflictException("This WhatsApp phone number is already connected");
    }
    return this.db.whatsAppPhoneNumber.create({
      data: {
        organizationId: this.organizationId,
        companyId: dto.companyId,
        phoneNumberId: dto.phoneNumberId,
        displayPhoneNumber: dto.displayPhoneNumber,
        label: dto.label,
        createdBy: this.userId,
        updatedBy: this.userId,
      },
      include: { company: { select: { name: true } } },
    });
  }

  async remove(id: string) {
    const existing = await this.db.whatsAppPhoneNumber.findFirst({
      where: { id, organizationId: this.organizationId },
    });
    if (!existing) {
      throw new NotFoundException("WhatsApp phone number not found");
    }
    await this.db.whatsAppPhoneNumber.delete({ where: { id } });
  }
}
