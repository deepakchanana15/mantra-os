import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { PermissionGuard } from "../../../common/guards/permission.guard";
import { TenantMembershipGuard } from "../../../common/guards/tenant-membership.guard";
import { PERMISSIONS } from "../../../common/permissions/permission-keys";
import { BlogService } from "./blog.service";
import { CreateBlogCategoryDto } from "./dto/create-blog-category.dto";
import { CreateBlogPostDto } from "./dto/create-blog-post.dto";
import { CreateBlogTagDto } from "./dto/create-blog-tag.dto";
import { ListBlogPostsQueryDto } from "./dto/list-blog-posts-query.dto";
import { UpdateBlogPostDto } from "./dto/update-blog-post.dto";

@Controller("v1/storefront/sites/:siteId/blog")
@UseGuards(JwtAuthGuard, TenantMembershipGuard, PermissionGuard)
export class BlogController {
  constructor(private readonly blog: BlogService) {}

  @Get("posts")
  @RequirePermission(PERMISSIONS.STOREFRONT_CONTENT_READ)
  findAllPosts(@Param("siteId") siteId: string, @Query() query: ListBlogPostsQueryDto) {
    return this.blog.findAllPosts(siteId, query);
  }

  @Get("posts/:id")
  @RequirePermission(PERMISSIONS.STOREFRONT_CONTENT_READ)
  findOnePost(@Param("siteId") siteId: string, @Param("id") id: string) {
    return this.blog.findOnePost(siteId, id);
  }

  @Post("posts")
  @RequirePermission(PERMISSIONS.STOREFRONT_CONTENT_WRITE)
  createPost(@Param("siteId") siteId: string, @Body() dto: CreateBlogPostDto) {
    return this.blog.createPost(siteId, dto);
  }

  @Patch("posts/:id")
  @RequirePermission(PERMISSIONS.STOREFRONT_CONTENT_WRITE)
  updatePost(@Param("siteId") siteId: string, @Param("id") id: string, @Body() dto: UpdateBlogPostDto) {
    return this.blog.updatePost(siteId, id, dto);
  }

  @Delete("posts/:id")
  @RequirePermission(PERMISSIONS.STOREFRONT_CONTENT_WRITE)
  async removePost(@Param("siteId") siteId: string, @Param("id") id: string) {
    await this.blog.removePost(siteId, id);
  }

  @Get("categories")
  @RequirePermission(PERMISSIONS.STOREFRONT_CONTENT_READ)
  findAllCategories(@Param("siteId") siteId: string) {
    return this.blog.findAllCategories(siteId);
  }

  @Post("categories")
  @RequirePermission(PERMISSIONS.STOREFRONT_CONTENT_WRITE)
  createCategory(@Param("siteId") siteId: string, @Body() dto: CreateBlogCategoryDto) {
    return this.blog.createCategory(siteId, dto);
  }

  @Delete("categories/:id")
  @RequirePermission(PERMISSIONS.STOREFRONT_CONTENT_WRITE)
  async removeCategory(@Param("siteId") siteId: string, @Param("id") id: string) {
    await this.blog.removeCategory(siteId, id);
  }

  @Get("tags")
  @RequirePermission(PERMISSIONS.STOREFRONT_CONTENT_READ)
  findAllTags(@Param("siteId") siteId: string) {
    return this.blog.findAllTags(siteId);
  }

  @Post("tags")
  @RequirePermission(PERMISSIONS.STOREFRONT_CONTENT_WRITE)
  createTag(@Param("siteId") siteId: string, @Body() dto: CreateBlogTagDto) {
    return this.blog.createTag(siteId, dto);
  }

  @Delete("tags/:id")
  @RequirePermission(PERMISSIONS.STOREFRONT_CONTENT_WRITE)
  async removeTag(@Param("siteId") siteId: string, @Param("id") id: string) {
    await this.blog.removeTag(siteId, id);
  }
}
