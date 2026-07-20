import { IsOptional, IsString, MaxLength } from "class-validator";
import { Prisma } from "@mantra-os/db";

/** Shared shape for the Json address fields (Customer, Supplier, Warehouse) — see DATABASE.md "Other schema notes". */
export class AddressDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  line1?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  line2?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;
}

/**
 * class-transformer produces an actual AddressDto instance, which doesn't
 * structurally satisfy Prisma's InputJsonValue (it wants a plain object with
 * an index signature). This is the one place that conversion happens —
 * every repository writing an address field calls this instead of casting
 * inline.
 */
export function addressToJson(address: AddressDto | undefined): Prisma.InputJsonValue | undefined {
  if (!address) return undefined;
  return { ...address } as Prisma.InputJsonValue;
}
