import Link from "next/link";
import { Plus } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeleteEntityButton } from "@/components/domain/delete-entity-button";

interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  customer: { id: string; name: string };
}

// Note: ContactsRepository.findAll doesn't implement text search yet (only
// customerId filtering) — no search box here until that's added, rather
// than shipping a search input that silently does nothing.
export default async function ContactsPage() {
  const contacts = await apiFetch<Contact[]>("/v1/contacts");

  return (
    <div className="flex flex-col gap-5 p-7">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Contacts</h1>
          <p className="text-sm text-muted-foreground">{contacts.length} contacts</p>
        </div>
        <Link href="/contacts/new">
          <Button>
            <Plus className="h-4 w-4" />
            New Contact
          </Button>
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-faint">
                  No contacts yet.
                </TableCell>
              </TableRow>
            ) : (
              contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium text-foreground">{contact.name}</TableCell>
                  <TableCell>
                    <Link href={`/customers/${contact.customer.id}`} className="text-muted-foreground hover:text-accent">
                      {contact.customer.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{contact.role ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{contact.email ?? "—"}</TableCell>
                  <TableCell>
                    <DeleteEntityButton apiPath={`/api/v1/contacts/${contact.id}`} entityLabel="Contact" />
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
