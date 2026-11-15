import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { StorefrontBlogPostForm } from "@/components/domain/storefront-blog-post-form";

export default function NewStorefrontBlogPostPage({ params }: { params: { siteId: string } }) {
  return (
    <div className="flex flex-col gap-4">
      <Link href={`/websites/${params.siteId}/blog`} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" />
        Blog
      </Link>
      <StorefrontBlogPostForm siteId={params.siteId} />
    </div>
  );
}
