import { Injectable } from "@nestjs/common";
import { BlogRepository } from "./blog.repository";
import { CreateBlogCategoryDto } from "./dto/create-blog-category.dto";
import { CreateBlogPostDto } from "./dto/create-blog-post.dto";
import { CreateBlogTagDto } from "./dto/create-blog-tag.dto";
import { UpdateBlogPostDto } from "./dto/update-blog-post.dto";

@Injectable()
export class BlogService {
  constructor(private readonly blog: BlogRepository) {}

  findAllPosts(siteId: string, params: { skip?: number; take?: number; search?: string }) {
    return this.blog.findAllPosts(siteId, params);
  }

  findOnePost(siteId: string, id: string) {
    return this.blog.findOnePostOrThrow(siteId, id);
  }

  createPost(siteId: string, dto: CreateBlogPostDto) {
    return this.blog.createPost(siteId, dto);
  }

  updatePost(siteId: string, id: string, dto: UpdateBlogPostDto) {
    return this.blog.updatePost(siteId, id, dto);
  }

  removePost(siteId: string, id: string) {
    return this.blog.removePost(siteId, id);
  }

  findAllCategories(siteId: string) {
    return this.blog.findAllCategories(siteId);
  }

  createCategory(siteId: string, dto: CreateBlogCategoryDto) {
    return this.blog.createCategory(siteId, dto);
  }

  removeCategory(siteId: string, id: string) {
    return this.blog.removeCategory(siteId, id);
  }

  findAllTags(siteId: string) {
    return this.blog.findAllTags(siteId);
  }

  createTag(siteId: string, dto: CreateBlogTagDto) {
    return this.blog.createTag(siteId, dto);
  }

  removeTag(siteId: string, id: string) {
    return this.blog.removeTag(siteId, id);
  }
}
