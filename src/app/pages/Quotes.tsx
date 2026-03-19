import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Search, FileText, Plus, ArrowRight, Loader2, Download } from "lucide-react";
import { Link } from "react-router";
import { useState } from "react";
import { useQuotes, formatCurrency, formatDate, getCustomerName, getStatusLabel, getStatusColors } from "../../lib/useSupabaseData";
import { useAuth } from "../../lib/AuthContext";
import { exportPdf } from "../../lib/pdfExport";

export function Quotes() {
  const { company } = useAuth();
  const { quotes, loading, error } = useQuotes();
  const [search, setSearch] = useState('');
  const [exporting, setExporting] = useState<string | null>(null);

  const filtered = quotes.filter(q =>
    q.title?.toLowerCase().includes(search.toLowerCase()) ||
    q.quote_number?.toLowerCase().includes(search.toLowerCase()) ||
    getCustomerName(q.customer).toLowerCase().includes(search.toLowerCase())
  );

  const active = filtered.filter(q => !['rejected','expired'].includes(q.status));

  const handlePdf = async (quote: typeof quotes[0]) => {
    if (!company) return;
    setExporting(quote.id);
    await exportPdf('quote', quote, company);
    setExporting(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-12 space-y-6 lg:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl mb-2">Angebote</h1>
          <p className="text-lg sm:text-xl text-muted-foreground">Alle Ihre Angebote im Überblick</p>
        </div>
        <Link to="/erstellen" className="w-full sm:w-auto">
          <Button size="lg" className="h-14 px-8 text-base gap-3 w-full sm:w-auto">
            <Plus className="w-6 h-6" />Neues Angebot
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {['draft','sent','accepted','rejected'].map(s => (
          <Card key={s} className="p-4">
            <p className="text-sm text-muted-foreground mb-1">{getStatusLabel(s)}</p>
            <p className="text-2xl font-bold">{quotes.filter(q => q.status === s).length}</p>
          </Card>
        ))}
      </div>

      <Card className="p-4 sm:p-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input placeholder="Angebot suchen..." className="pl-12 h-12 text-base"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </Card>

      {loading ? (
        <div className="flex items-center gap-3 text-muted-foreground py-8">
          <Loader2 className="w-6 h-6 animate-spin" /><span>Lade Angebote...</span>
        </div>
      ) : error ? (
        <Card className="p-6 text-red-400">Fehler: {error}</Card>
      ) : active.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          {search ? 'Keine Angebote gefunden.' : 'Noch keine Angebote vorhanden. Erstellen Sie Ihr erstes Angebot!'}
        </Card>
      ) : (
        <div className="space-y-4">
          {active.map(quote => (
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
                    <h3 className="text-lg sm:text-xl">{quote.title}</h3>
                    <p className="text-base text-muted-foreground">{getCustomerName(quote.customer)}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-border">
                  <div className="flex items-center gap-4">
                    <span className="text-xl font-bold">{formatCurrency(quote.total)}</span>
                    <span className="text-sm text-muted-foreground">{formatDate(quote.quote_date)}</span>
                    {quote.valid_until && (
                      <span className="text-sm text-muted-foreground">Bis: {formatDate(quote.valid_until)}</span>
                    )}
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" size="sm" className="h-10 gap-2 flex-1 sm:flex-initial"
                      onClick={() => handlePdf(quote)} disabled={exporting === quote.id}>
                      {exporting === quote.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Download className="w-4 h-4" />}
                      PDF
                    </Button>
                    {quote.status === 'accepted' && (
                      <Button size="sm" className="h-10 gap-2 flex-1 sm:flex-initial">
                        Rechnung erstellen<ArrowRight className="w-4 h-4" />
                      </Button>
                    )}
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