import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Search, Users, Plus, Mail, Phone, MapPin } from "lucide-react";

const customers = [
  {
    name: "Müller GmbH",
    contact: "Hans Müller",
    email: "info@mueller-gmbh.de",
    phone: "+49 123 456789",
    address: "Hauptstraße 12, 10115 Berlin",
    openQuotes: 2,
    openInvoices: 1,
    totalRevenue: "€24.500",
  },
  {
    name: "Schmidt Bau",
    contact: "Anna Schmidt",
    email: "kontakt@schmidt-bau.de",
    phone: "+49 234 567890",
    address: "Baustraße 5, 20095 Hamburg",
    openQuotes: 0,
    openInvoices: 0,
    totalRevenue: "€15.200",
  },
  {
    name: "Wagner Elektrik",
    contact: "Thomas Wagner",
    email: "info@wagner-elektrik.de",
    phone: "+49 345 678901",
    address: "Industrieweg 8, 80331 München",
    openQuotes: 1,
    openInvoices: 1,
    totalRevenue: "€8.750",
  },
  {
    name: "Fischer Installation",
    contact: "Michael Fischer",
    email: "m.fischer@installation.de",
    phone: "+49 456 789012",
    address: "Werkstraße 15, 50667 Köln",
    openQuotes: 1,
    openInvoices: 1,
    totalRevenue: "€12.400",
  },
];

export function Customers() {
  return (
    <div className="p-4 sm:p-6 lg:p-12 space-y-6 lg:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl mb-2">Kunden</h1>
          <p className="text-lg sm:text-xl text-muted-foreground">
            Verwalten Sie Ihre Kundendaten
          </p>
        </div>
        <Button size="lg" className="h-14 px-8 text-base sm:text-lg gap-3 w-full sm:w-auto">
          <Plus className="w-6 h-6" />
          Neuer Kunde
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <Card className="p-5 sm:p-6">
          <div className="space-y-2 sm:space-y-3">
            <p className="text-base sm:text-lg text-muted-foreground">Aktive Kunden</p>
            <p className="text-2xl sm:text-3xl font-bold">{customers.length}</p>
          </div>
        </Card>
        <Card className="p-5 sm:p-6">
          <div className="space-y-2 sm:space-y-3">
            <p className="text-base sm:text-lg text-muted-foreground">Offene Angebote</p>
            <p className="text-2xl sm:text-3xl font-bold">
              {customers.reduce((sum, c) => sum + c.openQuotes, 0)}
            </p>
          </div>
        </Card>
        <Card className="p-5 sm:p-6">
          <div className="space-y-2 sm:space-y-3">
            <p className="text-base sm:text-lg text-muted-foreground">Gesamtumsatz</p>
            <p className="text-2xl sm:text-3xl font-bold text-primary">€65.740</p>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4 sm:p-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
          <Input
            placeholder="Kunde suchen..."
            className="pl-12 sm:pl-14 h-12 sm:h-14 text-base sm:text-lg"
          />
        </div>
      </Card>

      {/* Customers List */}
      <div className="space-y-4">
        {customers.map((customer) => (
          <Card key={customer.name} className="p-4 sm:p-6 hover:bg-card/80 transition-colors">
            <div className="space-y-4">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="p-3 sm:p-4 rounded-lg bg-primary/10 flex-shrink-0">
                  <Users className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                </div>
                
                <div className="flex-1 min-w-0 space-y-3 sm:space-y-4">
                  <div>
                    <h3 className="text-xl sm:text-2xl mb-1">{customer.name}</h3>
                    <p className="text-base sm:text-lg text-muted-foreground">{customer.contact}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm sm:text-base truncate">{customer.email}</span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm sm:text-base">{customer.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm sm:text-base">{customer.address}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 sm:gap-6 pt-2 text-sm sm:text-base">
                    <div>
                      <span className="text-muted-foreground">Angebote: </span>
                      <span className="font-semibold">{customer.openQuotes}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Rechnungen: </span>
                      <span className="font-semibold">{customer.openInvoices}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Umsatz: </span>
                      <span className="font-semibold text-primary">{customer.totalRevenue}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 border-t border-border">
                <Button variant="default" size="lg" className="h-12 px-4 sm:px-6 text-sm sm:text-base flex-1">
                  Details anzeigen
                </Button>
                <Button variant="outline" size="lg" className="h-12 px-4 sm:px-6 text-sm sm:text-base flex-1">
                  Bearbeiten
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
