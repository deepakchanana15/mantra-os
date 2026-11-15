import { PartialType } from "@nestjs/mapped-types";
import { CreateStorefrontSiteDto } from "./create-storefront-site.dto";

export class UpdateStorefrontSiteDto extends PartialType(CreateStorefrontSiteDto) {}
