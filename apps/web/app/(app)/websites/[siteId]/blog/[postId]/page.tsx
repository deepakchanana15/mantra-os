import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { StorefrontBlogPostForm, type StorefrontBlogPostInitial } from "@/components/domain/storefront-blog-post-form";

export default async function StorefrontBlogPostDetailPage({ params }: { params: { siteId: string; postId: string } }) {
  const post = await apiFetch<StorefrontBlogPostInitial>(`/v1/storefront/sites/${params.siteId}/blog/posts/${params.postId}`);

  return (
    <div className="flex flex-col gap-4">
      <Link href={`/websites/${params.siteId}/blog`} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" />
        Blog
      </Link>
      <StorefrontBlogPostForm siteId={params.siteId} initial={post} />
    </div>
  );
}
