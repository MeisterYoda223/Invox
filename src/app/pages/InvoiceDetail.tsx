import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ArrowLeft, Download, Loader2, Check, X, Send, Ban } from "lucide-react";
import { useAuth } from "../../lib/AuthContext";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";
import { exportPdf } from "../../lib/pdfExport";
import { formatCurrency, formatDate, getCustomerName, getStatusLabel, getStatusColors } from "../../lib/useSupabaseData";

interface InvoiceItem {
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  vat_rate?: number;
  total: number;
}

interface InvoiceDetail {
  id: string;
  invoice_number: string;
  title: string;
  status: string;
  invoice_date: string;
  due_date?: string;
  paid_date?: string;
  subtotal: number;
  vat_amount: number;
  total: number;
  notes?: string;
  items: InvoiceItem[];
  customer: any;
  customer_id: string;
  source_quote_id?: string;
  created_at: string;
}

const STATUS_OPTIONS = [
  { value: "draft",     label: "Entwurf" },
  { value: "sent",      label: "Versendet" },
  { value: "overdue",   label: "Überfällig" },
  { value: "paid",      label: "Bezahlt" },
  { value: "cancelled", label: "Storniert" },
];

export function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const { company } = useAuth();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const { data, error } = await supabase
        .from("invoices")
        .select("*, customer:customers(*)")
        .eq("id", id)
        .single();
      if (error) {
        toast.error("Rechnung nicht gefunden");
        navigate("/rechnungen");
        return;
      }
      setInvoice(data);
      setLoading(false);
    };
    load();
  }, [id]);

  const handlePdf = async () => {
    if (!company || !invoice) return;
    setExporting(true);
    await exportPdf("invoice", invoice, company);
    setExporting(false);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!invoice) return;
    setUpdatingStatus(true);
    const update: Record<string, any> = { status: newStatus };
    if (newStatus === "paid") {
      update.paid_date = new Date().toISOString().slice(0, 10);
    } else {
      update.paid_date = null;
    }
    const { error } = await supabase
      .from("invoices")
      .update(update)
      .eq("id", invoice.id);
    if (error) {
      toast.error("Fehler beim Aktualisieren des Status");
    } else {
      setInvoice({ ...invoice, ...update });
      toast.success(`Status auf "${getStatusLabel(newStatus)}" gesetzt`);
    }
    setUpdatingStatus(false);
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-12 flex items-center gap-3 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin" /><span>Lade Rechnung...</span>
      </div>
    );
  }

  if (!invoice) return null;

  const isOverdue = invoice.status === "overdue";
  const otherStatuses = STATUS_OPTIONS.filter(s => s.value !== invoice.status);

  return (
    <div className="p-4 sm:p-6 lg:p-12 space-y-6 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate("/rechnungen")} className="gap-2 flex-shrink-0 mt-1">
          <ArrowLeft className="w-4 h-4" />Zurück
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-sm text-muted-foreground">{invoice.invoice_number}</span>
            <span className={`px-2 py-0.5 rounded text-xs ${getStatusColors(invoice.status)}`}>
              {getStatusLabel(invoice.status)}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl">{invoice.title}</h1>
          <p className="text-muted-foreground mt-1">{getCustomerName(invoice.customer)}</p>
        </div>
      </div>

      {/* Aktionen */}
      <Card className="p-4 sm:p-6">
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="gap-2 h-11" onClick={handlePdf} disabled={exporting}>
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            PDF exportieren
          </Button>

          {invoice.status === "draft" && (
            <Button className="gap-2 h-11" onClick={() => handleStatusChange("sent")} disabled={updatingStatus}>
              {updatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Als versendet markieren
            </Button>
          )}
          {(invoice.status === "sent" || invoice.status === "overdue") && (
            <>
              <Button className="gap-2 h-11 bg-green-600 hover:bg-green-700"
                onClick={() => handleStatusChange("paid")} disabled={updatingStatus}>
                {updatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Als bezahlt markieren
              </Button>
              {!isOverdue && (
                <Button variant="outline" className="gap-2 h-11 text-red-500 border-red-500/30 hover:bg-red-500/10"
                  onClick={() => handleStatusChange("overdue")} disabled={updatingStatus}>
                  {updatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                  Als überfällig markieren
                </Button>
              )}
            </>
          )}
          {invoice.status !== "cancelled" && invoice.status !== "paid" && (
            <Button variant="outline" className="gap-2 h-11 text-muted-foreground"
              onClick={() => handleStatusChange("cancelled")} disabled={updatingStatus}>
              {updatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
              Stornieren
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
            <p className="font-medium">{getCustomerName(invoice.customer)}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Rechnungsdatum</p>
            <p className="font-medium">{formatDate(invoice.invoice_date)}</p>
          </div>
          {invoice.due_date && (
            <div>
              <p className="text-muted-foreground mb-1">Fällig am</p>
              <p className={`font-medium ${isOverdue ? "text-red-400" : ""}`}>{formatDate(invoice.due_date)}</p>
            </div>
          )}
          {invoice.paid_date && (
            <div>
              <p className="text-muted-foreground mb-1">Bezahlt am</p>
              <p className="font-medium text-green-400">{formatDate(invoice.paid_date)}</p>
            </div>
          )}
          <div>
            <p className="text-muted-foreground mb-1">Erstellt am</p>
            <p className="font-medium">{formatDate(invoice.created_at)}</p>
          </div>
          {invoice.source_quote_id && (
            <div>
              <p className="text-muted-foreground mb-1">Aus Angebot</p>
              <Button variant="link" className="p-0 h-auto text-primary text-sm"
                onClick={() => navigate(`/angebote/${invoice.source_quote_id}`)}>
                Angebot anzeigen →
              </Button>
            </div>
          )}
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
          {invoice.items?.map((item, i) => (
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
            <span>{formatCurrency(invoice.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">MwSt.</span>
            <span>{formatCurrency(invoice.vat_amount)}</span>
          </div>
          <div className="h-px bg-border" />
          <div className="flex justify-between text-xl font-bold pt-2">
            <span>Gesamt</span>
            <span className="text-primary">{formatCurrency(invoice.total)}</span>
          </div>
        </div>
      </Card>

      {invoice.notes && (
        <Card className="p-5 sm:p-8 space-y-3">
          <h2 className="text-xl">Hinweise</h2>
          <p className="text-muted-foreground text-sm whitespace-pre-wrap">{invoice.notes}</p>
        </Card>
      )}
    </div>
  );
}
