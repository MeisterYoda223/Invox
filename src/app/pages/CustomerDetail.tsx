import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  ArrowLeft, Loader2, Mail, Phone, MapPin, Users,
  FileText, Receipt, Edit,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";
import { formatCurrency, formatDate, getCustomerName, getStatusLabel, getStatusColors } from "../../lib/useSupabaseData";

interface Customer {
  id: string;
  customer_number?: string;
  company_name?: string;
  first_name?: string;
  last_name?: string;
  street?: string;
  zip?: string;
  city?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  notes?: string;
  created_at: string;
}

export function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;

      const [custRes, quotesRes, invoicesRes] = await Promise.all([
        supabase.from("customers").select("*").eq("id", id).single(),
        supabase.from("quotes").select("*").eq("customer_id", id).order("created_at", { ascending: false }),
        supabase.from("invoices").select("*").eq("customer_id", id).order("created_at", { ascending: false }),
      ]);

      if (custRes.error) {
        toast.error("Kunde nicht gefunden");
        navigate("/kunden");
        return;
      }

      setCustomer(custRes.data);
      setQuotes(quotesRes.data ?? []);
      setInvoices(invoicesRes.data ?? []);
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-12 flex items-center gap-3 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin" /><span>Lade Kunde...</span>
      </div>
    );
  }

  if (!customer) return null;

  const totalRevenue = invoices
    .filter(i => i.status === "paid")
    .reduce((s, i) => s + Number(i.total), 0);

  return (
    <div className="p-4 sm:p-6 lg:p-12 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate("/kunden")} className="gap-2 flex-shrink-0 mt-1">
          <ArrowLeft className="w-4 h-4" />Zurück
        </Button>
        <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-2xl sm:text-3xl">{getCustomerName(customer)}</h1>
              {customer.customer_number && (
                <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                  {customer.customer_number}
                </span>
              )}
            </div>
            {customer.company_name && (customer.first_name || customer.last_name) && (
              <p className="text-muted-foreground">
                {[customer.first_name, customer.last_name].filter(Boolean).join(" ")}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            className="gap-2 h-10 flex-shrink-0"
            onClick={() => navigate(`/kunden/${customer.id}/bearbeiten`)}
          >
            <Edit className="w-4 h-4" />Bearbeiten
          </Button>
        </div>
      </div>

      {/* Statistiken */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Angebote gesamt</p>
          <p className="text-2xl font-bold">{quotes.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Rechnungen gesamt</p>
          <p className="text-2xl font-bold">{invoices.length}</p>
        </Card>
        <Card className="p-4 col-span-2 sm:col-span-1">
          <p className="text-sm text-muted-foreground mb-1">Umsatz (bezahlt)</p>
          <p className="text-2xl font-bold text-primary">{formatCurrency(totalRevenue)}</p>
        </Card>
      </div>

      {/* Kontaktdaten */}
      <Card className="p-5 sm:p-8 space-y-4">
        <h2 className="text-xl">Kontaktdaten</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {customer.email && (
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-muted-foreground text-xs mb-0.5">E-Mail</p>
                <a href={`mailto:${customer.email}`} className="text-primary hover:underline">{customer.email}</a>
              </div>
            </div>
          )}
          {customer.phone && (
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-muted-foreground text-xs mb-0.5">Telefon</p>
                <a href={`tel:${customer.phone}`} className="hover:underline">{customer.phone}</a>
              </div>
            </div>
          )}
          {customer.mobile && (
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-muted-foreground text-xs mb-0.5">Mobil</p>
                <a href={`tel:${customer.mobile}`} className="hover:underline">{customer.mobile}</a>
              </div>
            </div>
          )}
          {customer.street && (
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-muted-foreground text-xs mb-0.5">Adresse</p>
                <p>{customer.street}</p>
                <p>{customer.zip} {customer.city}</p>
              </div>
            </div>
          )}
        </div>
        {customer.notes && (
          <div className="pt-3 border-t border-border">
            <p className="text-muted-foreground text-xs mb-1">Notizen</p>
            <p className="text-sm whitespace-pre-wrap">{customer.notes}</p>
          </div>
        )}
      </Card>

      {/* Angebote */}
      <Card className="p-5 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl">Angebote ({quotes.length})</h2>
          <Button
            size="sm"
            variant="outline"
            className="gap-2 h-9"
            onClick={() => navigate(`/erstellen?type=quote`)}
          >
            <FileText className="w-4 h-4" />Neues Angebot
          </Button>
        </div>
        {quotes.length === 0 ? (
          <p className="text-muted-foreground text-sm">Noch keine Angebote für diesen Kunden.</p>
        ) : (
          <div className="space-y-2">
            {quotes.slice(0, 5).map(q => (
              <div
                key={q.id}
                className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors"
                onClick={() => navigate(`/angebote/${q.id}`)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{q.title}</p>
                    <p className="text-xs text-muted-foreground">{q.quote_number} · {formatDate(q.quote_date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                  <span className={`px-2 py-0.5 rounded text-xs ${getStatusColors(q.status)}`}>
                    {getStatusLabel(q.status)}
                  </span>
                  <span className="text-sm font-semibold">{formatCurrency(q.total)}</span>
                </div>
              </div>
            ))}
            {quotes.length > 5 && (
              <p className="text-xs text-muted-foreground text-center pt-1">
                + {quotes.length - 5} weitere
              </p>
            )}
          </div>
        )}
      </Card>

      {/* Rechnungen */}
      <Card className="p-5 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl">Rechnungen ({invoices.length})</h2>
          <Button
            size="sm"
            variant="outline"
            className="gap-2 h-9"
            onClick={() => navigate(`/erstellen?type=invoice`)}
          >
            <Receipt className="w-4 h-4" />Neue Rechnung
          </Button>
        </div>
        {invoices.length === 0 ? (
          <p className="text-muted-foreground text-sm">Noch keine Rechnungen für diesen Kunden.</p>
        ) : (
          <div className="space-y-2">
            {invoices.slice(0, 5).map(inv => (
              <div
                key={inv.id}
                className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors"
                onClick={() => navigate(`/rechnungen/${inv.id}`)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Receipt className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{inv.title}</p>
                    <p className="text-xs text-muted-foreground">{inv.invoice_number} · {formatDate(inv.invoice_date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                  <span className={`px-2 py-0.5 rounded text-xs ${getStatusColors(inv.status)}`}>
                    {getStatusLabel(inv.status)}
                  </span>
                  <span className="text-sm font-semibold">{formatCurrency(inv.total)}</span>
                </div>
              </div>
            ))}
            {invoices.length > 5 && (
              <p className="text-xs text-muted-foreground text-center pt-1">
                + {invoices.length - 5} weitere
              </p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
