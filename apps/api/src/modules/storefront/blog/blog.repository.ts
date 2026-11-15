import { Injectable, NotFoundException } from "@nestjs/common";
import { SiteConnectionManager } from "../site-connection-manager.service";
import { CreateBlogCategoryDto } from "./dto/create-blog-category.dto";
import { CreateBlogPostDto } from "./dto/create-blog-post.dto";
import { CreateBlogTagDto } from "./dto/create-blog-tag.dto";
import { UpdateBlogPostDto } from "./dto/update-blog-post.dto";

const POST_INCLUDE = {
  categories: { include: { category: true } },
  tags: { include: { tag: true } },
} as const;

@Injectable()
export class BlogRepository {
  constructor(private readonly connections: SiteConnectionManager) {}

  async findAllPosts(siteId: string, params: { skip?: number; take?: number; search?: string }) {
    const client = await this.connections.getPrismaClient(siteId);
    const where = params.search ? { title: { contains: params.search, mode: "insensitive" as const } } : {};
    const [data, total] = await Promise.all([
      client.blogPost.findMany({
        where,
        include: POST_INCLUDE,
        orderBy: { createdAt: "desc" },
        skip: params.skip ?? 0,
        take: params.take ?? 50,
      }),
      client.blogPost.count({ where }),
    ]);
    return { data, total };
  }

  async findOnePostOrThrow(siteId: string, id: string) {
    const client = await this.connections.getPrismaClient(siteId);
    const post = await client.blogPost.findUnique({ where: { id }, include: POST_INCLUDE });
    if (!post) {
      throw new NotFoundException("Blog post not found");
    }
    return post;
  }

  async createPost(siteId: string, dto: CreateBlogPostDto) {
    const client = await this.connections.getPrismaClient(siteId);
    const { categoryIds, tagIds, publishedAt, ...rest } = dto;
    const post = await client.blogPost.create({
      data: { ...rest, publishedAt: publishedAt ? new Date(publishedAt) : undefined },
    });
    await this.syncCategoriesAndTags(siteId, post.id, categoryIds, tagIds);
    return this.findOnePostOrThrow(siteId, post.id);
  }

  async updatePost(siteId: string, id: string, dto: UpdateBlogPostDto) {
    await this.findOnePostOrThrow(siteId, id);
    const client = await this.connections.getPrismaClient(siteId);
    const { categoryIds, tagIds, publishedAt, ...rest } = dto;
    await client.blogPost.update({
      where: { id },
      data: { ...rest, publishedAt: publishedAt ? new Date(publishedAt) : undefined },
    });
    await this.syncCategoriesAndTags(siteId, id, categoryIds, tagIds);
    return this.findOnePostOrThrow(siteId, id);
  }

  private async syncCategoriesAndTags(siteId: string, postId: string, categoryIds?: string[], tagIds?: string[]) {
    const client = await this.connections.getPrismaClient(siteId);
    if (categoryIds) {
      await client.blogPostCategory.deleteMany({ where: { postId } });
      if (categoryIds.length > 0) {
        await client.blogPostCategory.createMany({ data: categoryIds.map((categoryId) => ({ postId, categoryId })) });
      }
    }
    if (tagIds) {
      await client.blogPostTag.deleteMany({ where: { postId } });
      if (tagIds.length > 0) {
        await client.blogPostTag.createMany({ data: tagIds.map((tagId) => ({ postId, tagId })) });
      }
    }
  }

  async removePost(siteId: string, id: string) {
    await this.findOnePostOrThrow(siteId, id);
    const client = await this.connections.getPrismaClient(siteId);
    await client.$transaction([
      client.blogPostCategory.deleteMany({ where: { postId: id } }),
      client.blogPostTag.deleteMany({ where: { postId: id } }),
      client.blogPost.delete({ where: { id } }),
    ]);
  }

  async findAllCategories(siteId: string) {
    const client = await this.connections.getPrismaClient(siteId);
    return client.blogCategory.findMany({ orderBy: { name: "asc" } });
  }

  async createCategory(siteId: string, dto: CreateBlogCategoryDto) {
    const client = await this.connections.getPrismaClient(siteId);
    return client.blogCategory.create({ data: { ...dto } });
  }

  async removeCategory(siteId: string, id: string) {
    const client = await this.connections.getPrismaClient(siteId);
    await client.blogCategory.delete({ where: { id } });
  }

  async findAllTags(siteId: string) {
    const client = await this.connections.getPrismaClient(siteId);
    return client.blogTag.findMany({ orderBy: { name: "asc" } });
  }

  async createTag(siteId: string, dto: CreateBlogTagDto) {
    const client = await this.connections.getPrismaClient(siteId);
    return client.blogTag.create({ data: { ...dto } });
  }

  async removeTag(siteId: string, id: string) {
    const client = await this.connections.getPrismaClient(siteId);
    await client.blogTag.delete({ where: { id } });
  }
}
