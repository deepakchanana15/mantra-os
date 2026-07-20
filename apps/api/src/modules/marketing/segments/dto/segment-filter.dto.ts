import { IsEnum, IsOptional } from "class-validator";
import { CustomerType, Prisma } from "@mantra-os/db";

/**
 * Deliberately minimal for V1 — one filterable field. This is the actual
 * "query DSL" for Segments; grow it here (not by hand-editing filterJson
 * elsewhere) if Marketing needs more targeting criteria.
 */
export class SegmentFilterDto {
  @IsOptional()
  @IsEnum(CustomerType)
  customerType?: CustomerType;
}

export function segmentFilterToJson(filter: SegmentFilterDto): Prisma.InputJsonValue {
  return { ...filter } as Prisma.InputJsonValue;
}
