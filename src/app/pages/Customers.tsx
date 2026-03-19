import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Search, Users, Plus, Mail, Phone, MapPin, Loader2 } from "lucide-react";
import { Link } from "react-router";
import { useState } from "react";
import { useCustomers, useQuotes, useInvoices, formatCurrency, getCustomerName } from "../../lib/useSupabaseData";

export function Customers() {
  const { customers, loading, error } = useCustomers();
  const { quotes } = useQuotes();
  const { invoices } = useInvoices();
  const [search, setSearch] = useState('');

  const filtered = customers.filter(c =>
    getCustomerName(c).toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.customer_number?.toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = invoices
    .filter(i => i.status === 'paid')
    .reduce((s, i) => s + Number(i.total), 0);

  return (
    <div className="p-4 sm:p-6 lg:p-12 space-y-6 lg:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl mb-2">Kunden</h1>
          <p className="text-lg sm:text-xl text-muted-foreground">Verwalten Sie Ihre Kundendaten</p>
        </div>
        <Link to="/kunden/neu">
          <Button size="lg" className="h-14 px-8 text-base gap-3 w-full sm:w-auto">
            <Plus className="w-6 h-6" />Neuer Kunde
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5"><p className="text-sm text-muted-foreground mb-1">Aktive Kunden</p>
          <p className="text-2xl font-bold">{customers.length}</p>
        </Card>
        <Card className="p-5"><p className="text-sm text-muted-foreground mb-1">Offene Angebote</p>
          <p className="text-2xl font-bold">{quotes.filter(q => ['draft','sent'].includes(q.status)).length}</p>
        </Card>
        <Card className="p-5"><p className="text-sm text-muted-foreground mb-1">Gesamtumsatz</p>
          <p className="text-2xl font-bold text-primary">{formatCurrency(totalRevenue)}</p>
        </Card>
      </div>

      <Card className="p-4 sm:p-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input placeholder="Kunde suchen..." className="pl-12 h-12 text-base"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </Card>

      {loading ? (
        <div className="flex items-center gap-3 text-muted-foreground py-8">
          <Loader2 className="w-6 h-6 animate-spin" /><span>Lade Kunden...</span>
        </div>
      ) : error ? (
        <Card className="p-6 text-red-400">Fehler: {error}</Card>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          {search ? 'Keine Kunden gefunden.' : 'Noch keine Kunden vorhanden. Fügen Sie Ihren ersten Kunden hinzu!'}
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map(customer => {
            const custQuotes = quotes.filter(q => q.customer_id === customer.id && ['draft','sent'].includes(q.status));
            const custInvoices = invoices.filter(i => i.customer_id === customer.id && ['sent','draft','overdue'].includes(i.status));
            const custRevenue = invoices.filter(i => i.customer_id === customer.id && i.status === 'paid').reduce((s,i) => s + Number(i.total), 0);

            return (
              <Card key={customer.id} className="p-4 sm:p-6 hover:bg-card/80 transition-colors">
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/10 flex-shrink-0">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-xl">{getCustomerName(customer)}</h3>
                          {customer.customer_number && (
                            <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                              {customer.customer_number}
                            </span>
                          )}
                        </div>
                        {customer.company_name && (customer.first_name || customer.last_name) && (
                          <p className="text-sm text-muted-foreground">
                            {[customer.first_name, customer.last_name].filter(Boolean).join(' ')}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        {customer.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm truncate">{customer.email}</span>
                          </div>
                        )}
                        {(customer.phone || customer.mobile) && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm">{customer.phone ?? customer.mobile}</span>
                          </div>
                        )}
                        {customer.street && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm">{customer.street}, {customer.zip} {customer.city}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm pt-1">
                        <span><span className="text-muted-foreground">Angebote: </span><strong>{custQuotes.length}</strong></span>
                        <span><span className="text-muted-foreground">Rechnungen: </span><strong>{custInvoices.length}</strong></span>
                        <span><span className="text-muted-foreground">Umsatz: </span><strong className="text-primary">{formatCurrency(custRevenue)}</strong></span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-border">
                    <Button variant="default" size="sm" className="h-10 flex-1">Details</Button>
                    <Button variant="outline" size="sm" className="h-10 flex-1">Bearbeiten</Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
