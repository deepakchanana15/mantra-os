import Link from "next/link";
import { ArrowLeft, Mail, Phone } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeleteCustomerButton } from "./delete-customer-button";

interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
}

interface Customer {
  id: string;
  name: string;
  type: "INDIVIDUAL" | "COMPANY";
  email: string | null;
  phone: string | null;
  createdAt: string;
  contacts: Contact[];
}

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const customer = await apiFetch<Customer>(`/v1/customers/${params.id}`);

  return (
    <div className="flex flex-col gap-5 p-7">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/customers" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" />
            Customers
          </Link>
          <div className="mt-1 flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-foreground">{customer.name}</h1>
            <Badge variant="neutral">{customer.type === "COMPANY" ? "Company" : "Individual"}</Badge>
          </div>
        </div>
        <DeleteCustomerButton customerId={customer.id} />
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contacts">Contacts ({customer.contacts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card className="max-w-lg">
            <CardContent className="flex flex-col gap-3 p-5">
              <div className="flex items-center gap-2.5 text-sm">
                <Mail className="h-4 w-4 text-faint" />
                <span className="text-foreground">{customer.email ?? "No email on file"}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <Phone className="h-4 w-4 text-faint" />
                <span className="text-foreground">{customer.phone ?? "No phone on file"}</span>
              </div>
              <div className="mt-1 text-xs text-faint">
                Customer since {new Date(customer.createdAt).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts">
          {customer.contacts.length === 0 ? (
            <p className="text-sm text-faint">No contacts yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {customer.contacts.map((contact) => (
                <Card key={contact.id} className="max-w-lg">
                  <CardContent className="p-4">
                    <div className="font-medium text-foreground">{contact.name}</div>
                    {contact.role && <div className="text-xs text-faint">{contact.role}</div>}
                    <div className="mt-1 flex gap-4 text-xs text-muted-foreground">
                      {contact.email && <span>{contact.email}</span>}
                      {contact.phone && <span>{contact.phone}</span>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
