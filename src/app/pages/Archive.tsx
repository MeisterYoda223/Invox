import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Search, FileText, Receipt, Download } from "lucide-react";

const archivedQuotes = [
  {
    id: "ANG-2026-003",
    customer: "Schmidt Bau",
    title: "Beleuchtung Bürogebäude",
    amount: "€5.600",
    date: "03.03.2026",
    status: "Angenommen",
  },
  {
    id: "ANG-2026-005",
    customer: "Becker Malerei",
    title: "Steckdosen und Schalter",
    amount: "€890",
    date: "28.02.2026",
    status: "Abgelehnt",
  },
  {
    id: "ANG-2026-007",
    customer: "Wagner Elektrik",
    title: "Wartungsvertrag",
    amount: "€2.400",
    date: "25.02.2026",
    status: "Angenommen",
  },
];

const archivedInvoices = [
  {
    id: "RE-2026-015",
    customer: "Schmidt Bau",
    title: "Beleuchtung Bürogebäude",
    amount: "€5.200",
    date: "06.03.2026",
    paidDate: "15.03.2026",
    status: "Bezahlt",
  },
  {
    id: "RE-2026-012",
    customer: "Müller GmbH",
    title: "Elektroinstallation Neubau",
    amount: "€8.500",
    date: "20.02.2026",
    paidDate: "05.03.2026",
    status: "Bezahlt",
  },
  {
    id: "RE-2026-010",
    customer: "Fischer Installation",
    title: "Notfall-Service",
    amount: "€1.200",
    date: "15.02.2026",
    paidDate: "28.02.2026",
    status: "Bezahlt",
  },
];

export function Archive() {
  return (
    <div className="p-4 sm:p-6 lg:p-12 space-y-6 lg:space-y-8">
      <div>
        <h1 className="text-3xl sm:text-4xl mb-2">Archiv</h1>
        <p className="text-lg sm:text-xl text-muted-foreground">
          Abgeschlossene Angebote und Rechnungen
        </p>
      </div>

      {/* Search */}
      <Card className="p-4 sm:p-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
          <Input
            placeholder="Durchsuchen Sie das Archiv..."
            className="pl-12 sm:pl-14 h-12 sm:h-14 text-base sm:text-lg"
          />
        </div>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="invoices" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2 h-12 sm:h-14">
          <TabsTrigger value="invoices" className="text-base sm:text-lg">
            Rechnungen
          </TabsTrigger>
          <TabsTrigger value="quotes" className="text-base sm:text-lg">
            Angebote
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-4">
          {archivedInvoices.map((invoice) => (
            <Card key={invoice.id} className="p-4 sm:p-6 hover:bg-card/80 transition-colors">
              <div className="space-y-4">
                <div className="flex items-start gap-3 sm:gap-4 lg:gap-6">
                  <div className="p-3 sm:p-4 rounded-lg bg-green-500/10 flex-shrink-0">
                    <Receipt className="w-6 h-6 sm:w-7 sm:h-7 text-green-500" />
                  </div>
                  
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                      <span className="text-base sm:text-lg text-muted-foreground">
                        {invoice.id}
                      </span>
                      <span className="px-3 sm:px-4 py-1 rounded-lg text-sm sm:text-base bg-green-500/20 text-green-400">
                        {invoice.status}
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl">{invoice.title}</h3>
                    <p className="text-base sm:text-lg text-muted-foreground">{invoice.customer}</p>
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-border">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="text-xl sm:text-2xl font-bold">{invoice.amount}</div>
                    <div className="text-left sm:text-right space-y-1 text-sm sm:text-base">
                      <div className="text-muted-foreground">
                        Erstellt: {invoice.date}
                      </div>
                      <div className="text-green-400">
                        Bezahlt: {invoice.paidDate}
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
        </TabsContent>

        <TabsContent value="quotes" className="space-y-4">
          {archivedQuotes.map((quote) => (
            <Card key={quote.id} className="p-4 sm:p-6 hover:bg-card/80 transition-colors">
              <div className="space-y-4">
                <div className="flex items-start gap-3 sm:gap-4 lg:gap-6">
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
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {quote.status}
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl">{quote.title}</h3>
                    <p className="text-base sm:text-lg text-muted-foreground">{quote.customer}</p>
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-border">
                  <div className="flex items-center justify-between">
                    <div className="text-xl sm:text-2xl font-bold">{quote.amount}</div>
                    <div className="text-base sm:text-lg text-muted-foreground">{quote.date}</div>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}