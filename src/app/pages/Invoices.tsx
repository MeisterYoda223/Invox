import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Search, Receipt, Plus, Download } from "lucide-react";
import { Link } from "react-router";

const invoices = [
  {
    id: "RE-2026-015",
    customer: "Schmidt Bau",
    title: "Beleuchtung Bürogebäude",
    amount: "€5.200",
    date: "06.03.2026",
    dueDate: "20.03.2026",
    status: "Bezahlt",
  },
  {
    id: "RE-2026-016",
    customer: "Fischer Installation",
    title: "Verkabelung Produktionshalle",
    amount: "€3.400",
    date: "04.03.2026",
    dueDate: "18.03.2026",
    status: "Offen",
  },
  {
    id: "RE-2026-017",
    customer: "Becker Malerei",
    title: "Steckdosen und Schalter",
    amount: "€890",
    date: "03.03.2026",
    dueDate: "10.03.2026",
    status: "Überfällig",
  },
  {
    id: "RE-2026-018",
    customer: "Wagner Elektrik",
    title: "Wartung Schaltschrank",
    amount: "€1.250",
    date: "02.03.2026",
    dueDate: "16.03.2026",
    status: "Offen",
  },
];

export function Invoices() {
  return (
    <div className="p-4 sm:p-6 lg:p-12 space-y-6 lg:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl mb-2">Laufende Rechnungen</h1>
          <p className="text-lg sm:text-xl text-muted-foreground">
            Alle aktiven Rechnungen im Überblick
          </p>
        </div>
        <Link to="/erstellen" className="w-full sm:w-auto">
          <Button size="lg" className="h-14 px-8 text-base sm:text-lg gap-3 w-full sm:w-auto">
            <Plus className="w-6 h-6" />
            Neue Rechnung
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <Card className="p-5 sm:p-6">
          <div className="space-y-2 sm:space-y-3">
            <p className="text-base sm:text-lg text-muted-foreground">Offene Rechnungen</p>
            <p className="text-2xl sm:text-3xl font-bold">8</p>
            <p className="text-base sm:text-lg text-muted-foreground">€15.420 gesamt</p>
          </div>
        </Card>
        <Card className="p-5 sm:p-6">
          <div className="space-y-2 sm:space-y-3">
            <p className="text-base sm:text-lg text-muted-foreground">Überfällige Rechnungen</p>
            <p className="text-2xl sm:text-3xl font-bold text-red-500">2</p>
            <p className="text-base sm:text-lg text-muted-foreground">€1.780 gesamt</p>
          </div>
        </Card>
        <Card className="p-5 sm:p-6">
          <div className="space-y-2 sm:space-y-3">
            <p className="text-base sm:text-lg text-muted-foreground">Dieser Monat</p>
            <p className="text-2xl sm:text-3xl font-bold text-green-500">€28.450</p>
            <p className="text-base sm:text-lg text-muted-foreground">12 Rechnungen</p>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4 sm:p-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
          <Input
            placeholder="Rechnung suchen..."
            className="pl-12 sm:pl-14 h-12 sm:h-14 text-base sm:text-lg"
          />
        </div>
      </Card>

      {/* Invoices List */}
      <div className="space-y-4">
        {invoices.map((invoice) => (
          <Card key={invoice.id} className="p-4 sm:p-6 hover:bg-card/80 transition-colors">
            <div className="space-y-4">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="p-3 sm:p-4 rounded-lg bg-green-500/10 flex-shrink-0">
                  <Receipt className="w-6 h-6 sm:w-7 sm:h-7 text-green-500" />
                </div>
                
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                    <span className="text-base sm:text-lg text-muted-foreground">
                      {invoice.id}
                    </span>
                    <span
                      className={`px-3 sm:px-4 py-1 rounded-lg text-sm sm:text-base ${
                        invoice.status === "Bezahlt"
                          ? "bg-green-500/20 text-green-400"
                          : invoice.status === "Überfällig"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-blue-500/20 text-blue-400"
                      }`}
                    >
                      {invoice.status}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl">{invoice.title}</h3>
                  <p className="text-base sm:text-lg text-muted-foreground">{invoice.customer}</p>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xl sm:text-2xl font-bold">{invoice.amount}</span>
                  <div className="text-right space-y-1">
                    <div className="text-sm sm:text-base text-muted-foreground">
                      Erstellt: {invoice.date}
                    </div>
                    <div className={`text-sm sm:text-base ${
                      invoice.status === "Überfällig" ? "text-red-400" : "text-muted-foreground"
                    }`}>
                      Fällig: {invoice.dueDate}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <Button variant="outline" size="lg" className="h-12 px-4 sm:px-6 gap-2 text-sm sm:text-base flex-1 sm:flex-initial">
                    <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                    PDF
                  </Button>
                  <Button variant="outline" size="lg" className="h-12 px-4 sm:px-6 text-sm sm:text-base flex-1 sm:flex-initial">
                    Details
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
