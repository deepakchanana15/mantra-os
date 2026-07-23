import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsEnum, IsOptional, IsString, IsUUID, MaxLength, ValidateNested } from "class-validator";
import { OfflineChannelType, OnlineChannelType, SalesChannel } from "@mantra-os/db";
import { OrderLineDto } from "../../../../common/dto/order-line.dto";

export class CreateSalesOrderDto {
  @IsUUID()
  customerId!: string;

  @IsOptional()
  @IsUUID()
  quoteId?: string;

  /** Required — see DECISIONS.md "Sales channel tracking". */
  @IsEnum(SalesChannel)
  salesChannel!: SalesChannel;

  @IsOptional()
  @IsEnum(OnlineChannelType)
  onlineChannelType?: OnlineChannelType;

  @IsOptional()
  @IsEnum(OfflineChannelType)
  offlineChannelType?: OfflineChannelType;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  orderReference?: string;

  /** Optional — see DECISIONS.md "Global multi-country, multi-company, multi-brand architecture" Sub-phase B. */
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @IsOptional()
  @IsUUID()
  countryId?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderLineDto)
  lines!: OrderLineDto[];
}
