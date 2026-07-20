import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsOptional, IsUUID, ValidateNested } from "class-validator";
import { OrderLineDto } from "../../../../common/dto/order-line.dto";

export class CreateQuoteDto {
  @IsUUID()
  customerId!: string;

  @IsOptional()
  validUntil?: Date;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderLineDto)
  lines!: OrderLineDto[];
}
