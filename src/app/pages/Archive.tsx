import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Search, FileText, Receipt, Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { useQuotes, useInvoices, formatCurrency, formatDate, getCustomerName, getStatusLabel, getStatusColors } from "../../lib/useSupabaseData";
import { useAuth } from "../../lib/AuthContext";
import { exportPdf } from "../../lib/pdfExport";

export function Archive() {
  const { company } = useAuth();
  const { quotes, loading: qLoading } = useQuotes();
  const { invoices, loading: iLoading } = useInvoices();
  const [search, setSearch] = useState('');
  const [exporting, setExporting] = useState<string | null>(null);

  const archivedQuotes = quotes.filter(q => ['accepted','rejected','expired'].includes(q.status));
  const archivedInvoices = invoices.filter(i => ['paid','cancelled'].includes(i.status));

  const filteredQuotes = archivedQuotes.filter(q =>
    q.title?.toLowerCase().includes(search.toLowerCase()) ||
    q.quote_number?.toLowerCase().includes(search.toLowerCase()) ||
    getCustomerName(q.customer).toLowerCase().includes(search.toLowerCase())
  );

  const filteredInvoices = archivedInvoices.filter(i =>
    i.title?.toLowerCase().includes(search.toLowerCase()) ||
    i.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
    getCustomerName(i.customer).toLowerCase().includes(search.toLowerCase())
  );

  const handlePdf = async (type: 'quote' | 'invoice', doc: any) => {
    if (!company) return;
    setExporting(doc.id);
    await exportPdf(type, doc, company);
    setExporting(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-12 space-y-6 lg:space-y-8">
      <div>
        <h1 className="text-3xl sm:text-4xl mb-2">Archiv</h1>
        <p className="text-lg sm:text-xl text-muted-foreground">Abgeschlossene Angebote und Rechnungen</p>
      </div>

      <Card className="p-4 sm:p-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input placeholder="Archiv durchsuchen..." className="pl-12 h-12 text-base"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </Card>

      <Tabs defaultValue="invoices" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2 h-12">
          <TabsTrigger value="invoices">Rechnungen ({archivedInvoices.length})</TabsTrigger>
          <TabsTrigger value="quotes">Angebote ({archivedQuotes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-4">
          {iLoading ? (
            <div className="flex items-center gap-3 text-muted-foreground py-8">
              <Loader2 className="w-6 h-6 animate-spin" /><span>Lade...</span>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">Keine archivierten Rechnungen.</Card>
          ) : filteredInvoices.map(invoice => (
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
                    <h3 className="text-lg">{invoice.title}</h3>
                    <p className="text-sm text-muted-foreground">{getCustomerName(invoice.customer)}</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-border">
                  <div className="space-y-0.5 text-sm">
                    <div className="text-xl font-bold">{formatCurrency(invoice.total)}</div>
                    <div className="text-muted-foreground">Erstellt: {formatDate(invoice.invoice_date)}</div>
                    {invoice.paid_date && <div className="text-green-400">Bezahlt: {formatDate(invoice.paid_date)}</div>}
                  </div>
                  <Button variant="outline" size="sm" className="h-10 gap-2"
                    onClick={() => handlePdf('invoice', invoice)} disabled={exporting === invoice.id}>
                    {exporting === invoice.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    PDF
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="quotes" className="space-y-4">
          {qLoading ? (
            <div className="flex items-center gap-3 text-muted-foreground py-8">
              <Loader2 className="w-6 h-6 animate-spin" /><span>Lade...</span>
            </div>
          ) : filteredQuotes.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">Keine archivierten Angebote.</Card>
          ) : filteredQuotes.map(quote => (
            <Card key={quote.id} className="p-4 sm:p-6 hover:bg-card/80 transition-colors">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-blue-500/10 flex-shrink-0">
                    <FileText className="w-6 h-6 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm text-muted-foreground">{quote.quote_number}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${getStatusColors(quote.status)}`}>
                        {getStatusLabel(quote.status)}
                      </span>
                    </div>
                    <h3 className="text-lg">{quote.title}</h3>
                    <p className="text-sm text-muted-foreground">{getCustomerName(quote.customer)}</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-border">
                  <div>
                    <div className="text-xl font-bold">{formatCurrency(quote.total)}</div>
                    <div className="text-sm text-muted-foreground">{formatDate(quote.quote_date)}</div>
                  </div>
                  <Button variant="outline" size="sm" className="h-10 gap-2"
                    onClick={() => handlePdf('quote', quote)} disabled={exporting === quote.id}>
                    {exporting === quote.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    PDF
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}