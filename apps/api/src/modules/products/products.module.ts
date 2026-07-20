import { Module } from "@nestjs/common";
import { CategoriesController } from "./categories/categories.controller";
import { CategoriesRepository } from "./categories/categories.repository";
import { CategoriesService } from "./categories/categories.service";
import { ProductsController } from "./products/products.controller";
import { ProductsRepository } from "./products/products.repository";
import { ProductsService } from "./products/products.service";

@Module({
  controllers: [ProductsController, CategoriesController],
  providers: [ProductsRepository, ProductsService, CategoriesRepository, CategoriesService],
  exports: [ProductsRepository],
})
export class ProductsModule {}
