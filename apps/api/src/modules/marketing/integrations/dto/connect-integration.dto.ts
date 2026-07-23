import { IsEnum, IsString, MinLength } from "class-validator";
import { MarketingChannel } from "@mantra-os/db";

export class ConnectIntegrationDto {
  @IsEnum(MarketingChannel)
  channel!: MarketingChannel;

  @IsString()
  @MinLength(1)
  accessToken!: string;

  @IsString()
  @MinLength(1)
  accountId!: string;
}
