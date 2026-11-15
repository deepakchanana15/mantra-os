import { BadRequestException, Body, Controller, Delete, Get, Param, Post, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Express } from "express";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { PermissionGuard } from "../../../common/guards/permission.guard";
import { TenantMembershipGuard } from "../../../common/guards/tenant-membership.guard";
import { PERMISSIONS } from "../../../common/permissions/permission-keys";
import { MediaService } from "./media.service";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

@Controller("v1/storefront/sites/:siteId/media")
@UseGuards(JwtAuthGuard, TenantMembershipGuard, PermissionGuard)
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Get()
  @RequirePermission(PERMISSIONS.STOREFRONT_CONTENT_READ)
  findAll(@Param("siteId") siteId: string) {
    return this.media.findAll(siteId);
  }

  @Post()
  @RequirePermission(PERMISSIONS.STOREFRONT_CONTENT_WRITE)
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: MAX_FILE_SIZE_BYTES } }))
  upload(@Param("siteId") siteId: string, @UploadedFile() file?: Express.Multer.File, @Body("altText") altText?: string) {
    if (!file) {
      throw new BadRequestException("No file provided");
    }
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException("Unsupported file type");
    }
    return this.media.upload(siteId, file, altText);
  }

  @Delete(":mediaId")
  @RequirePermission(PERMISSIONS.STOREFRONT_CONTENT_WRITE)
  async remove(@Param("siteId") siteId: string, @Param("mediaId") mediaId: string) {
    await this.media.remove(siteId, mediaId);
  }
}
