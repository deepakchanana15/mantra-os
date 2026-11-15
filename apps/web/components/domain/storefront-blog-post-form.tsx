"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RichTextEditor } from "./rich-text-editor";

interface BlogCategory {
  id: string;
  name: string;
}

interface BlogTag {
  id: string;
  name: string;
}

export interface StorefrontBlogPostInitial {
  id?: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string[];
  categories: { category: BlogCategory }[];
  tags: { tag: BlogTag }[];
}

export function StorefrontBlogPostForm({ siteId, initial }: { siteId: string; initial?: StorefrontBlogPostInitial }) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [status, setStatus] = useState(initial?.status ?? "DRAFT");
  const [categoryIds, setCategoryIds] = useState<string[]>(initial?.categories.map((c) => c.category.id) ?? []);
  const [tagIds, setTagIds] = useState<string[]>(initial?.tags.map((t) => t.tag.id) ?? []);
  const [metaTitle, setMetaTitle] = useState(initial?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(initial?.metaDescription ?? "");
  const [metaKeywords, setMetaKeywords] = useState(initial?.metaKeywords?.join(", ") ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/v1/storefront/sites/${siteId}/blog/categories`)
      .then((res) => (res.ok ? res.json() : []))
      .then(setCategories);
    fetch(`/api/v1/storefront/sites/${siteId}/blog/tags`)
      .then((res) => (res.ok ? res.json() : []))
      .then(setTags);
  }, [siteId]);

  function toggleId(list: string[], id: string): string[] {
    return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !slug) return;
    setSaving(true);
    try {
      const body = {
        title,
        slug,
        excerpt: excerpt || undefined,
        content: content || undefined,
        status,
        categoryIds,
        tagIds,
        metaTitle: metaTitle || undefined,
        metaDescription: metaDescription || undefined,
        metaKeywords: metaKeywords ? metaKeywords.split(",").map((k) => k.trim()).filter(Boolean) : undefined,
      };
      const res = await fetch(
        isEdit ? `/api/v1/storefront/sites/${siteId}/blog/posts/${initial!.id}` : `/api/v1/storefront/sites/${siteId}/blog/posts`,
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? "Couldn't save this post.");
        return;
      }
      toast.success(isEdit ? "Post saved" : "Post created");
      if (!isEdit) {
        router.push(`/websites/${siteId}/blog/${data.id}`);
      } else {
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Post</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="postTitle">Title</Label>
              <Input id="postTitle" required value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="postSlug">Slug</Label>
              <Input id="postSlug" required value={slug} onChange={(e) => setSlug(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="postExcerpt">Excerpt</Label>
            <Textarea id="postExcerpt" rows={2} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Content</Label>
            <RichTextEditor value={content} onChange={setContent} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Status</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" type="button" className="w-full justify-start">
                    {status}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                  {(["DRAFT", "PUBLISHED", "ARCHIVED"] as const).map((s) => (
                    <DropdownMenuItem key={s} onSelect={() => setStatus(s)}>
                      {s}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Categories</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" type="button" className="w-full justify-start truncate">
                    {categoryIds.length > 0 ? `${categoryIds.length} selected` : "None"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                  {categories.map((c) => (
                    <DropdownMenuCheckboxItem key={c.id} checked={categoryIds.includes(c.id)} onCheckedChange={() => setCategoryIds((ids) => toggleId(ids, c.id))}>
                      {c.name}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Tags</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" type="button" className="w-full justify-start truncate">
                    {tagIds.length > 0 ? `${tagIds.length} selected` : "None"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                  {tags.map((t) => (
                    <DropdownMenuCheckboxItem key={t.id} checked={tagIds.includes(t.id)} onCheckedChange={() => setTagIds((ids) => toggleId(ids, t.id))}>
                      {t.name}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>SEO</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="postMetaTitle">Meta title ({metaTitle.length}/70)</Label>
            <Input id="postMetaTitle" maxLength={70} value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="postMetaDescription">Meta description ({metaDescription.length}/160)</Label>
            <Textarea id="postMetaDescription" rows={3} maxLength={160} value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="postMetaKeywords">Meta keywords (comma-separated)</Label>
            <Input id="postMetaKeywords" value={metaKeywords} onChange={(e) => setMetaKeywords(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <div>
        <Button type="submit" disabled={saving || !title || !slug}>
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create post"}
        </Button>
      </div>
    </form>
  );
}
