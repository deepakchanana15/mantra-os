import { Injectable } from "@nestjs/common";
import { MediaRepository, UploadedFile } from "./media.repository";

@Injectable()
export class MediaService {
  constructor(private readonly media: MediaRepository) {}

  findAll(siteId: string) {
    return this.media.findAll(siteId);
  }

  upload(siteId: string, file: UploadedFile, altText?: string) {
    return this.media.upload(siteId, file, altText);
  }

  remove(siteId: string, id: string) {
    return this.media.remove(siteId, id);
  }
}
