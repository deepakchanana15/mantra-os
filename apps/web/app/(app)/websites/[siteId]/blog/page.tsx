import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SearchInput } from "@/components/domain/search-input";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  status: string;
  publishedAt: string | null;
}

interface BlogPostsPage {
  data: BlogPost[];
  total: number;
}

const PAGE_SIZE = 50;

export default async function StorefrontBlogPage({
  params,
  searchParams,
}: {
  params: { siteId: string };
  searchParams: { skip?: string; search?: string };
}) {
  const skip = Math.max(0, Number(searchParams.skip) || 0);
  const search = searchParams.search ?? "";
  const qs = `skip=${skip}&take=${PAGE_SIZE}${search ? `&search=${encodeURIComponent(search)}` : ""}`;
  const page = await apiFetch<BlogPostsPage>(`/v1/storefront/sites/${params.siteId}/blog/posts?${qs}`);
  const { data: posts, total } = page;

  const rangeStart = total === 0 ? 0 : skip + 1;
  const rangeEnd = Math.min(skip + posts.length, total);
  const hasPrev = skip > 0;
  const hasNext = skip + posts.length < total;
  const pageLink = (newSkip: number) => `/websites/${params.siteId}/blog?skip=${newSkip}${search ? `&search=${encodeURIComponent(search)}` : ""}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{total} posts</p>
        <div className="flex items-center gap-2">
          <SearchInput placeholder="Search posts…" />
          <Link href={`/websites/${params.siteId}/blog/new`}>
            <Button>
              <Plus className="h-4 w-4" />
              New post
            </Button>
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Published</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="py-10 text-center text-sm text-faint">
                  {search ? "No posts match your search." : "No posts yet."}
                </TableCell>
              </TableRow>
            ) : (
              posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell>
                    <Link href={`/websites/${params.siteId}/blog/${post.id}`} className="font-medium text-foreground hover:text-accent">
                      {post.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={post.status === "PUBLISHED" ? "success" : "neutral"}>{post.status}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {rangeStart}–{rangeEnd} of {total}
          </p>
          <div className="flex items-center gap-2">
            {hasPrev ? (
              <Link href={pageLink(Math.max(0, skip - PAGE_SIZE))}>
                <Button variant="outline" size="sm">
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Previous
                </Button>
              </Link>
            ) : (
              <Button variant="outline" size="sm" disabled>
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </Button>
            )}
            {hasNext ? (
              <Link href={pageLink(skip + PAGE_SIZE)}>
                <Button variant="outline" size="sm">
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            ) : (
              <Button variant="outline" size="sm" disabled>
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
