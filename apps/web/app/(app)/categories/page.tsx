import { apiFetch } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeleteEntityButton } from "@/components/domain/delete-entity-button";
import { CreateCategoryDialog } from "./create-category-dialog";

interface Category {
  id: string;
  name: string;
  parent: { name: string } | null;
}

export default async function CategoriesPage() {
  const categories = await apiFetch<Category[]>("/v1/categories");

  return (
    <div className="flex flex-col gap-5 p-7">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Categories</h1>
          <p className="text-sm text-muted-foreground">{categories.length} categories</p>
        </div>
        <CreateCategoryDialog />
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Parent</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="py-10 text-center text-sm text-faint">
                  No categories yet.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium text-foreground">{category.name}</TableCell>
                  <TableCell className="text-muted-foreground">{category.parent?.name ?? "—"}</TableCell>
                  <TableCell>
                    <DeleteEntityButton apiPath={`/api/v1/categories/${category.id}`} entityLabel="Category" />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
