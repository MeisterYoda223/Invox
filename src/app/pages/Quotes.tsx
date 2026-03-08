import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Search, FileText, ArrowRight, Plus } from "lucide-react";
import { Link } from "react-router";

const quotes = [
  {
    id: "ANG-2026-001",
    customer: "Müller GmbH",
    title: "Elektroinstallation Neubau",
    amount: "€2.450",
    date: "07.03.2026",
    status: "Offen",
  },
  {
    id: "ANG-2026-002",
    customer: "Wagner Elektrik",
    title: "Reparatur Schaltanlage",
    amount: "€1.850",
    date: "05.03.2026",
    status: "Offen",
  },
  {
    id: "ANG-2026-003",
    customer: "Schmidt Bau",
    title: "Beleuchtung Bürogebäude",
    amount: "€5.600",
    date: "03.03.2026",
    status: "Angenommen",
  },
  {
    id: "ANG-2026-004",
    customer: "Fischer Installation",
    title: "Verkabelung Produktionshalle",
    amount: "€8.900",
    date: "01.03.2026",
    status: "Offen",
  },
  {
    id: "ANG-2026-005",
    customer: "Becker Malerei",
    title: "Steckdosen und Schalter",
    amount: "€890",
    date: "28.02.2026",
    status: "Abgelehnt",
  },
];

export function Quotes() {
  return (
    <div className="p-4 sm:p-6 lg:p-12 space-y-6 lg:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl mb-2">Angebote</h1>
          <p className="text-lg sm:text-xl text-muted-foreground">
            Alle Ihre Angebote im Überblick
          </p>
        </div>
        <Link to="/erstellen" className="w-full sm:w-auto">
          <Button size="lg" className="h-14 px-8 text-base sm:text-lg gap-3 w-full sm:w-auto">
            <Plus className="w-6 h-6" />
            Neues Angebot
          </Button>
        </Link>
      </div>

      {/* Search */}
      <Card className="p-4 sm:p-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
          <Input
            placeholder="Angebot suchen..."
            className="pl-12 sm:pl-14 h-12 sm:h-14 text-base sm:text-lg"
          />
        </div>
      </Card>

      {/* Quotes List */}
      <div className="space-y-4">
        {quotes.map((quote) => (
          <Card key={quote.id} className="p-4 sm:p-6 hover:bg-card/80 transition-colors">
            <div className="space-y-4">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="p-3 sm:p-4 rounded-lg bg-blue-500/10 flex-shrink-0">
                  <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-blue-500" />
                </div>
                
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                    <span className="text-base sm:text-lg text-muted-foreground">
                      {quote.id}
                    </span>
                    <span
                      className={`px-3 sm:px-4 py-1 rounded-lg text-sm sm:text-base ${
                        quote.status === "Angenommen"
                          ? "bg-green-500/20 text-green-400"
                          : quote.status === "Abgelehnt"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-blue-500/20 text-blue-400"
                      }`}
                    >
                      {quote.status}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl">{quote.title}</h3>
                  <p className="text-base sm:text-lg text-muted-foreground">{quote.customer}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-border">
                <div className="flex items-center justify-between sm:justify-start gap-4">
                  <div className="text-xl sm:text-2xl font-bold">{quote.amount}</div>
                  <div className="text-base sm:text-lg text-muted-foreground">{quote.date}</div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  {quote.status === "Angenommen" && (
                    <Button size="lg" className="h-12 px-4 sm:px-6 text-sm sm:text-base gap-2">
                      In Rechnung umwandeln
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Button>
                  )}
                  <Button variant="outline" size="lg" className="h-12 px-4 sm:px-6 text-sm sm:text-base">
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
