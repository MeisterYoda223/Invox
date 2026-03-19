import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Search, Receipt, Plus, Download, Loader2 } from "lucide-react";
import { Link } from "react-router";
import { useState } from "react";
import { useInvoices, formatCurrency, formatDate, getCustomerName, getStatusLabel, getStatusColors } from "../../lib/useSupabaseData";
import { useAuth } from "../../lib/AuthContext";
import { exportPdf } from "../../lib/pdfExport";

export function Invoices() {
  const { company } = useAuth();
  const { invoices, loading, error } = useInvoices();
  const [search, setSearch] = useState('');
  const [exporting, setExporting] = useState<string | null>(null);

  const filtered = invoices.filter(i =>
    i.title?.toLowerCase().includes(search.toLowerCase()) ||
    i.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
    getCustomerName(i.customer).toLowerCase().includes(search.toLowerCase())
  );

  const active = filtered.filter(i => i.status !== 'cancelled');

  const openTotal = invoices.filter(i => ['sent','draft'].includes(i.status)).reduce((s,i) => s + Number(i.total), 0);
  const overdueTotal = invoices.filter(i => i.status === 'overdue').reduce((s,i) => s + Number(i.total), 0);
  const monthStr = new Date().toISOString().slice(0,7);
  const monthTotal = invoices.filter(i => i.status === 'paid' && i.paid_date?.startsWith(monthStr)).reduce((s,i) => s + Number(i.total), 0);

  const handlePdf = async (invoice: typeof invoices[0]) => {
    if (!company) return;
    setExporting(invoice.id);
    await exportPdf('invoice', invoice, company);
    setExporting(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-12 space-y-6 lg:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl mb-2">Rechnungen</h1>
          <p className="text-lg sm:text-xl text-muted-foreground">Alle Rechnungen im Überblick</p>
        </div>
        <Link to="/erstellen" className="w-full sm:w-auto">
          <Button size="lg" className="h-14 px-8 text-base gap-3 w-full sm:w-auto">
            <Plus className="w-6 h-6" />Neue Rechnung
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5"><p className="text-sm text-muted-foreground mb-1">Offen</p>
          <p className="text-2xl font-bold">{invoices.filter(i => ['sent','draft'].includes(i.status)).length}</p>
          <p className="text-sm text-muted-foreground">{formatCurrency(openTotal)}</p>
        </Card>
        <Card className="p-5"><p className="text-sm text-muted-foreground mb-1">Überfällig</p>
          <p className="text-2xl font-bold text-red-500">{invoices.filter(i => i.status === 'overdue').length}</p>
          <p className="text-sm text-muted-foreground">{formatCurrency(overdueTotal)}</p>
        </Card>
        <Card className="p-5"><p className="text-sm text-muted-foreground mb-1">Bezahlt diesen Monat</p>
          <p className="text-2xl font-bold text-green-500">{formatCurrency(monthTotal)}</p>
          <p className="text-sm text-muted-foreground">{invoices.filter(i => i.status === 'paid' && i.paid_date?.startsWith(monthStr)).length} Rechnungen</p>
        </Card>
      </div>

      <Card className="p-4 sm:p-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input placeholder="Rechnung suchen..." className="pl-12 h-12 text-base"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </Card>

      {loading ? (
        <div className="flex items-center gap-3 text-muted-foreground py-8">
          <Loader2 className="w-6 h-6 animate-spin" /><span>Lade Rechnungen...</span>
        </div>
      ) : error ? (
        <Card className="p-6 text-red-400">Fehler: {error}</Card>
      ) : active.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          {search ? 'Keine Rechnungen gefunden.' : 'Noch keine Rechnungen vorhanden.'}
        </Card>
      ) : (
        <div className="space-y-4">
          {active.map(invoice => (
            <Card key={invoice.id} className="p-4 sm:p-6 hover:bg-card/80 transition-colors">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-green-500/10 flex-shrink-0">
                    <Receipt className="w-6 h-6 text-green-500" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm text-muted-foreground">{invoice.invoice_number}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${getStatusColors(invoice.status)}`}>
                        {getStatusLabel(invoice.status)}
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl">{invoice.title}</h3>
                    <p className="text-base text-muted-foreground">{getCustomerName(invoice.customer)}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-border">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="text-xl font-bold">{formatCurrency(invoice.total)}</span>
                    <div className="text-sm text-muted-foreground space-y-0.5">
                      <div>Erstellt: {formatDate(invoice.invoice_date)}</div>
                      {invoice.due_date && (
                        <div className={invoice.status === 'overdue' ? 'text-red-400' : ''}>
                          Fällig: {formatDate(invoice.due_date)}
                        </div>
                      )}
                      {invoice.paid_date && <div className="text-green-400">Bezahlt: {formatDate(invoice.paid_date)}</div>}
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" size="sm" className="h-10 gap-2 flex-1 sm:flex-initial"
                      onClick={() => handlePdf(invoice)} disabled={exporting === invoice.id}>
                      {exporting === invoice.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Download className="w-4 h-4" />}
                      PDF
                    </Button>
                    <Button variant="outline" size="sm" className="h-10 flex-1 sm:flex-initial">Details</Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}