import { Module } from "@nestjs/common";
import { BlogController } from "./blog/blog.controller";
import { BlogRepository } from "./blog/blog.repository";
import { BlogService } from "./blog/blog.service";
import { CategoriesController } from "./categories/categories.controller";
import { CategoriesRepository } from "./categories/categories.repository";
import { CategoriesService } from "./categories/categories.service";
import { CollectionsController } from "./collections/collections.controller";
import { CollectionsRepository } from "./collections/collections.repository";
import { CollectionsService } from "./collections/collections.service";
import { MediaController } from "./media/media.controller";
import { MediaRepository } from "./media/media.repository";
import { MediaService } from "./media/media.service";
import { ProductsController } from "./products/products.controller";
import { ProductsRepository } from "./products/products.repository";
import { ProductsService } from "./products/products.service";
import { SettingsController } from "./settings/settings.controller";
import { SettingsRepository } from "./settings/settings.repository";
import { SettingsService } from "./settings/settings.service";
import { SiteConnectionManager } from "./site-connection-manager.service";
import { StorefrontSitesController } from "./sites/storefront-sites.controller";
import { StorefrontSitesRepository } from "./sites/storefront-sites.repository";
import { StorefrontSitesService } from "./sites/storefront-sites.service";

@Module({
  controllers: [StorefrontSitesController, SettingsController, MediaController, CategoriesController, CollectionsController, ProductsController, BlogController],
  providers: [
    SiteConnectionManager,
    StorefrontSitesRepository,
    StorefrontSitesService,
    SettingsRepository,
    SettingsService,
    MediaRepository,
    MediaService,
    CategoriesRepository,
    CategoriesService,
    CollectionsRepository,
    CollectionsService,
    ProductsRepository,
    ProductsService,
    BlogRepository,
    BlogService,
  ],
})
export class StorefrontModule {}
