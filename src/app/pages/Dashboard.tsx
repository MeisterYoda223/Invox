import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { FileText, Receipt, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Link } from "react-router";
import { useQuotes, useInvoices, formatCurrency, formatDate, getCustomerName, getStatusLabel, getStatusColors } from "../../lib/useSupabaseData";
import { useAuth } from '../../lib/AuthContext';


export function Dashboard() {
  const { userProfile, company } = useAuth();
  const { quotes, loading: qLoading } = useQuotes();
  const { invoices, loading: iLoading } = useInvoices();

  const loading = qLoading || iLoading;

  const openQuotes = quotes.filter(q => ['draft','sent'].includes(q.status));
  const openInvoices = invoices.filter(i => ['sent','draft'].includes(i.status));
  const overdueInvoices = invoices.filter(i => i.status === 'overdue');
  const paidThisMonth = invoices
    .filter(i => i.status === 'paid' && i.paid_date?.startsWith(new Date().toISOString().slice(0,7)))
    .reduce((sum, i) => sum + Number(i.total), 0);

  const recent = [
    ...quotes.slice(0, 3).map(q => ({ ...q, type: 'Angebot' as const })),
    ...invoices.slice(0, 3).map(i => ({ ...i, type: 'Rechnung' as const })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 6);

  return (
    <div className="p-4 sm:p-6 lg:p-12 space-y-6 lg:space-y-8">
      <div>
        <h1 className="text-3xl sm:text-4xl mb-2">
          Willkommen{userProfile?.name ? `, ${userProfile.name}` : ''}
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground">
          {company?.company_name ?? 'Übersicht Ihrer Angebote und Rechnungen'}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 text-muted-foreground py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Lade Daten...</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
            {[
              { title: 'Offene Angebote', value: openQuotes.length, icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' },
              { title: 'Offene Rechnungen', value: openInvoices.length, icon: Receipt, color: 'text-green-500', bg: 'bg-green-500/10' },
              { title: 'Überfällig', value: overdueInvoices.length, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
              { title: 'Bezahlt diesen Monat', value: formatCurrency(paidThisMonth), icon: CheckCircle, color: 'text-primary', bg: 'bg-primary/10' },
            ].map(stat => (
              <Card key={stat.title} className="p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm sm:text-base text-muted-foreground">{stat.title}</span>
                  <div className={`p-3 rounded-lg ${stat.bg}`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-bold">{stat.value}</div>
              </Card>
            ))}
          </div>

          <Card className="p-5 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-xl sm:text-2xl">Letzte Aktivitäten</h2>
              <Link to="/archiv">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">Alle anzeigen</Button>
              </Link>
            </div>
            {recent.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Noch keine Aktivitäten vorhanden.</p>
            ) : (
              <div className="space-y-3">
                {recent.map(item => (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-secondary/50 rounded-lg gap-3">
                    <div className="flex items-center gap-3">
                      {item.type === 'Angebot'
                        ? <FileText className="w-6 h-6 text-blue-500 flex-shrink-0" />
                        : <Receipt className="w-6 h-6 text-green-500 flex-shrink-0" />}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{item.type}</span>
                          <span className={`px-2 py-0.5 rounded text-xs ${getStatusColors(item.status)}`}>
                            {getStatusLabel(item.status)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {getCustomerName(item.customer)} — {item.title}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-semibold">{formatCurrency(item.total)}</span>
                      <span className="text-muted-foreground">{formatDate(item.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              { to: '/erstellen', icon: FileText, title: 'Neues Angebot', desc: 'Schnell ein neues Angebot erstellen' },
              { to: '/erstellen', icon: Receipt, title: 'Neue Rechnung', desc: 'Schnell eine neue Rechnung erstellen' },
              { to: '/kunden', icon: CheckCircle, title: 'Kunden', desc: 'Kunden anzeigen und verwalten' },
            ].map(action => (
              <Link key={action.title} to={action.to}>
                <Card className="p-6 sm:p-8 hover:bg-card/80 transition-colors cursor-pointer h-full">
                  <div className="flex flex-col items-center text-center gap-4">
                    <div className="p-4 rounded-lg bg-primary/10">
                      <action.icon className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl">{action.title}</h3>
                    <p className="text-muted-foreground text-base">{action.desc}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}