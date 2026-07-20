import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsOptional, IsUUID, ValidateNested } from "class-validator";
import { OrderLineDto } from "../../../../common/dto/order-line.dto";

export class CreateSalesOrderDto {
  @IsUUID()
  customerId!: string;

  @IsOptional()
  @IsUUID()
  quoteId?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderLineDto)
  lines!: OrderLineDto[];
}
