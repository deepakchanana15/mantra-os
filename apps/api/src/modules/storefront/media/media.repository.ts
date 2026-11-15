import { Injectable, NotFoundException } from "@nestjs/common";
import { v2 as cloudinary } from "cloudinary";
import { SiteConnectionManager } from "../site-connection-manager.service";

export interface UploadedFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

@Injectable()
export class MediaRepository {
  constructor(private readonly connections: SiteConnectionManager) {}

  async findAll(siteId: string) {
    const client = await this.connections.getPrismaClient(siteId);
    return client.media.findMany({ orderBy: { createdAt: "desc" } });
  }

  async upload(siteId: string, file: UploadedFile, altText?: string) {
    const { cloudName, apiKey, apiSecret } = await this.connections.getCloudinaryConfig(siteId);
    const dataUri = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      folder: "mantraos-cms",
      resource_type: "image",
    });

    const client = await this.connections.getPrismaClient(siteId);
    return client.media.create({
      data: {
        filename: file.originalname,
        url: result.secure_url,
        mimeType: file.mimetype,
        size: file.size,
        altText,
      },
    });
  }

  async remove(siteId: string, id: string) {
    const client = await this.connections.getPrismaClient(siteId);
    const media = await client.media.findUnique({ where: { id } });
    if (!media) {
      throw new NotFoundException("Media not found");
    }
    // Removes MantraOS's record only — the Cloudinary asset itself is left in
    // place. Media has no stored public_id (adding one would mean altering
    // each live site's schema, which this plan deliberately avoids), so
    // there's no reliable way to delete the remote asset from here.
    await client.media.delete({ where: { id } });
  }
}
