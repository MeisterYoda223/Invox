import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ArrowLeft, Download, ArrowRight, Loader2, FileText, Check, X } from "lucide-react";
import { useAuth } from "../../lib/AuthContext";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";
import { exportPdf } from "../../lib/pdfExport";
import { formatCurrency, formatDate, getCustomerName, getStatusLabel, getStatusColors } from "../../lib/useSupabaseData";

interface QuoteItem {
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  vat_rate?: number;
  total: number;
}

interface QuoteDetail {
  id: string;
  quote_number: string;
  title: string;
  status: string;
  quote_date: string;
  valid_until?: string;
  subtotal: number;
  vat_amount: number;
  total: number;
  notes?: string;
  items: QuoteItem[];
  customer: any;
  customer_id: string;
  created_at: string;
}

const STATUS_OPTIONS = [
  { value: "draft",    label: "Entwurf" },
  { value: "sent",     label: "Versendet" },
  { value: "accepted", label: "Angenommen" },
  { value: "rejected", label: "Abgelehnt" },
  { value: "expired",  label: "Abgelaufen" },
];

// Rechnungsnummer hochzählen: "RE-2026-001" -> "RE-2026-002"
function incrementNumber(current: string): string {
  const match = current.match(/^(.*?)(\d+)$/);
  if (!match) return current;
  const next = String(parseInt(match[2]) + 1).padStart(match[2].length, "0");
  return `${match[1]}${next}`;
}

export function QuoteDetail() {
  const { id } = useParams<{ id: string }>();
  const { company, userProfile } = useAuth();
  const navigate = useNavigate();

  const [quote, setQuote] = useState<QuoteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [converting, setConverting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const { data, error } = await supabase
        .from("quotes")
        .select("*, customer:customers(*)")
        .eq("id", id)
        .single();
      if (error) {
        toast.error("Angebot nicht gefunden");
        navigate("/angebote");
        return;
      }
      setQuote(data);
      setLoading(false);
    };
    load();
  }, [id]);

  const handlePdf = async () => {
    if (!company || !quote) return;
    setExporting(true);
    await exportPdf("quote", quote, company);
    setExporting(false);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!quote) return;
    setUpdatingStatus(true);
    const { error } = await supabase
      .from("quotes")
      .update({ status: newStatus })
      .eq("id", quote.id);
    if (error) {
      toast.error("Fehler beim Aktualisieren des Status");
    } else {
      setQuote({ ...quote, status: newStatus });
      toast.success(`Status auf "${getStatusLabel(newStatus)}" gesetzt`);
    }
    setUpdatingStatus(false);
  };

  const handleConvertToInvoice = async () => {
    if (!company || !userProfile?.company_id || !quote) return;
    setConverting(true);
    try {
      // Aktuelle next_invoice_number direkt aus DB holen (nicht aus Cache)
      const { data: freshCompany, error: companyErr } = await supabase
        .from("companies")
        .select("next_invoice_number, payment_terms")
        .eq("id", userProfile.company_id)
        .single();

      if (companyErr) throw companyErr;

      const invoiceNumber = freshCompany.next_invoice_number ?? `RE-${Date.now()}`;
      const paymentTerms = freshCompany.payment_terms ?? 14;
      const invoiceDate = new Date().toISOString().slice(0, 10);
      const dueDate = new Date(Date.now() + paymentTerms * 86400000).toISOString().slice(0, 10);

      // vat_rate Fallback für ältere items
      const items = (quote.items ?? []).map((item: any) => ({
        ...item,
        vat_rate: item.vat_rate ?? 19,
      }));

      // Erst Nummer hochzählen, dann Insert — verhindert duplicate key
      const nextNumber = incrementNumber(invoiceNumber);
      const { error: updateErr } = await supabase
        .from("companies")
        .update({ next_invoice_number: nextNumber })
        .eq("id", userProfile.company_id);

      if (updateErr) throw updateErr;

      const { error: insertErr } = await supabase.from("invoices").insert({
        company_id: userProfile.company_id,
        customer_id: quote.customer_id,
        created_by: userProfile.id,
        invoice_number: invoiceNumber,
        title: quote.title,
        status: "draft",
        subtotal: quote.subtotal,
        vat_amount: quote.vat_amount,
        total: quote.total,
        invoice_date: invoiceDate,
        due_date: dueDate,
        items,
        notes: quote.notes ?? null,
        source_quote_id: quote.id,
      });

      if (insertErr) {
        // Nummer zurückrollen falls Insert scheitert
        await supabase
          .from("companies")
          .update({ next_invoice_number: invoiceNumber })
          .eq("id", userProfile.company_id);
        throw insertErr;
      }

      toast.success("Rechnung wurde erstellt!", {
        description: `Aus Angebot ${quote.quote_number} wurde eine Rechnung erstellt.`,
      });
      navigate("/rechnungen");
    } catch (err: any) {
      console.error("Convert error:", err);
      toast.error("Fehler beim Umwandeln", { description: err.message });
    } finally {
      setConverting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-12 flex items-center gap-3 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin" /><span>Lade Angebot...</span>
      </div>
    );
  }

  if (!quote) return null;

  const otherStatuses = STATUS_OPTIONS.filter(s => s.value !== quote.status);

  return (
    <div className="p-4 sm:p-6 lg:p-12 space-y-6 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate("/angebote")} className="gap-2 flex-shrink-0 mt-1">
          <ArrowLeft className="w-4 h-4" />Zurück
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-sm text-muted-foreground">{quote.quote_number}</span>
            <span className={`px-2 py-0.5 rounded text-xs ${getStatusColors(quote.status)}`}>
              {getStatusLabel(quote.status)}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl">{quote.title}</h1>
          <p className="text-muted-foreground mt-1">{getCustomerName(quote.customer)}</p>
        </div>
      </div>

      {/* Aktionen */}
      <Card className="p-4 sm:p-6">
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="gap-2 h-11" onClick={handlePdf} disabled={exporting}>
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            PDF exportieren
          </Button>

          {quote.status === "draft" && (
            <Button className="gap-2 h-11" onClick={() => handleStatusChange("sent")} disabled={updatingStatus}>
              {updatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              Als versendet markieren
            </Button>
          )}
          {quote.status === "sent" && (
            <>
              <Button className="gap-2 h-11 bg-green-600 hover:bg-green-700"
                onClick={() => handleStatusChange("accepted")} disabled={updatingStatus}>
                {updatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Angenommen
              </Button>
              <Button variant="outline" className="gap-2 h-11 text-red-500 border-red-500/30 hover:bg-red-500/10"
                onClick={() => handleStatusChange("rejected")} disabled={updatingStatus}>
                {updatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                Abgelehnt
              </Button>
            </>
          )}
          {quote.status === "accepted" && (
            <Button className="gap-2 h-11" onClick={handleConvertToInvoice} disabled={converting}>
              {converting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              Rechnung erstellen
            </Button>
          )}

          {/* Status korrigieren — natives select, kein Icon */}
          <select
            className="h-11 rounded-md border border-input bg-background px-3 text-sm cursor-pointer"
            value=""
            disabled={updatingStatus}
            onChange={e => { if (e.target.value) handleStatusChange(e.target.value); }}
          >
            <option value="" disabled>Status korrigieren…</option>
            {otherStatuses.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Grunddaten */}
      <Card className="p-5 sm:p-8 space-y-4">
        <h2 className="text-xl">Grunddaten</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground mb-1">Kunde</p>
            <p className="font-medium">{getCustomerName(quote.customer)}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Angebotsdatum</p>
            <p className="font-medium">{formatDate(quote.quote_date)}</p>
          </div>
          {quote.valid_until && (
            <div>
              <p className="text-muted-foreground mb-1">Gültig bis</p>
              <p className="font-medium">{formatDate(quote.valid_until)}</p>
            </div>
          )}
          <div>
            <p className="text-muted-foreground mb-1">Erstellt am</p>
            <p className="font-medium">{formatDate(quote.created_at)}</p>
          </div>
        </div>
      </Card>

      {/* Positionen */}
      <Card className="p-5 sm:p-8 space-y-4">
        <h2 className="text-xl">Positionen</h2>
        <div className="space-y-2">
          <div className="hidden sm:grid grid-cols-12 gap-2 text-xs text-muted-foreground px-3 pb-1 border-b border-border">
            <span className="col-span-5">Beschreibung</span>
            <span className="col-span-2 text-right">Menge</span>
            <span className="col-span-2 text-right">Einzelpreis</span>
            <span className="col-span-1 text-right">MwSt.</span>
            <span className="col-span-2 text-right">Gesamt</span>
          </div>
          {quote.items?.map((item, i) => (
            <div key={i} className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-2 p-3 bg-secondary/30 rounded-lg text-sm">
              <span className="sm:col-span-5 font-medium">{item.description}</span>
              <span className="sm:col-span-2 sm:text-right text-muted-foreground">
                <span className="sm:hidden">Menge: </span>{item.quantity} {item.unit}
              </span>
              <span className="sm:col-span-2 sm:text-right text-muted-foreground">
                <span className="sm:hidden">EP: </span>{formatCurrency(item.unit_price)}
              </span>
              <span className="sm:col-span-1 sm:text-right text-muted-foreground">
                <span className="sm:hidden">MwSt.: </span>{item.vat_rate ?? 19}%
              </span>
              <span className="sm:col-span-2 sm:text-right font-semibold">
                <span className="sm:hidden">Gesamt: </span>{formatCurrency(item.total)}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Zusammenfassung */}
      <Card className="p-5 sm:p-8">
        <h2 className="text-xl mb-4">Zusammenfassung</h2>
        <div className="max-w-xs ml-auto space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Nettobetrag</span>
            <span>{formatCurrency(quote.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">MwSt.</span>
            <span>{formatCurrency(quote.vat_amount)}</span>
          </div>
          <div className="h-px bg-border" />
          <div className="flex justify-between text-xl font-bold pt-2">
            <span>Gesamt</span>
            <span className="text-primary">{formatCurrency(quote.total)}</span>
          </div>
        </div>
      </Card>

      {quote.notes && (
        <Card className="p-5 sm:p-8 space-y-3">
          <h2 className="text-xl">Hinweise</h2>
          <p className="text-muted-foreground text-sm whitespace-pre-wrap">{quote.notes}</p>
        </Card>
      )}
    </div>
  );
}
