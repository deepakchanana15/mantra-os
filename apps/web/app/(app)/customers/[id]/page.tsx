import Link from "next/link";
import { ArrowLeft, Mail, MapPin, Phone } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActivityTimeline } from "@/components/domain/activity-timeline";
import { customerTypeLabel } from "@/lib/customer-types";
import { formatAddress, type AddressValue } from "@/lib/address";
import { DeleteCustomerButton } from "./delete-customer-button";

interface ActivityEntry {
  id: string;
  type: "CREATED" | "STAGE_CHANGE" | "WHATSAPP_MESSAGE" | "QUOTE" | "SALES_ORDER" | "INVOICE" | "NOTE" | "AUDIT";
  timestamp: string;
  title: string;
  detail: string | null;
}

const PURCHASE_TYPES = new Set(["QUOTE", "SALES_ORDER", "INVOICE"]);

interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
}

interface Customer {
  id: string;
  code: string | null;
  name: string;
  type: string;
  email: string | null;
  phone: string | null;
  billingAddress: AddressValue | null;
  shippingAddress: AddressValue | null;
  createdAt: string;
  contacts: Contact[];
}

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const [customer, activity] = await Promise.all([
    apiFetch<Customer>(`/v1/customers/${params.id}`),
    apiFetch<ActivityEntry[]>(`/v1/customers/${params.id}/activity`),
  ]);
  const purchaseHistory = activity.filter((entry) => PURCHASE_TYPES.has(entry.type));

  return (
    <div className="grid grid-cols-1 gap-5 p-7 lg:grid-cols-[1fr_400px]">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div>
            <Link href="/customers" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3.5 w-3.5" />
              Customers
            </Link>
            <div className="mt-1 flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-foreground">{customer.name}</h1>
              <Badge variant="neutral">{customerTypeLabel(customer.type)}</Badge>
              {customer.code && <span className="font-mono text-xs text-faint">{customer.code}</span>}
            </div>
          </div>
          <DeleteCustomerButton customerId={customer.id} />
        </div>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="contacts">Contacts ({customer.contacts.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="flex flex-col gap-3">
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

            <div className="grid max-w-lg grid-cols-2 gap-3">
              <AddressCard title="Billing address" address={customer.billingAddress} />
              <AddressCard title="Shipping address" address={customer.shippingAddress} />
            </div>
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

        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Purchase history</CardTitle>
          </CardHeader>
          <CardContent>
            {purchaseHistory.length === 0 ? (
              <p className="text-sm text-faint">No quotes, orders, or invoices yet.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {purchaseHistory.map((entry) => (
                  <li key={entry.id} className="text-sm">
                    <p className="text-foreground">{entry.title}</p>
                    {entry.detail && <p className="text-xs text-muted-foreground">{entry.detail}</p>}
                    <p className="text-xs text-faint">{new Date(entry.timestamp).toLocaleDateString()}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="lg:sticky lg:top-7 lg:h-[calc(100vh-3.5rem)]">
        <ActivityTimeline basePath={`/customers/${customer.id}`} />
      </div>
    </div>
  );
}

function AddressCard({ title, address }: { title: string; address: AddressValue | null }) {
  const lines = formatAddress(address);
  return (
    <Card>
      <CardContent className="flex flex-col gap-2 p-5">
        <div className="flex items-center gap-2.5 text-sm font-medium text-foreground">
          <MapPin className="h-4 w-4 text-faint" />
          {title}
        </div>
        {lines.length === 0 ? (
          <p className="text-xs text-faint">No address on file</p>
        ) : (
          <div className="text-sm text-foreground">
            {lines.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
