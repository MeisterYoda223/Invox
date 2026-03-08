import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Search, Briefcase, Plus, Edit, Trash2 } from "lucide-react";

const services = [
  {
    name: "Elektroinstallation",
    description: "Standard Elektroinstallationsarbeiten",
    price: "€65.00",
    unit: "Stunde",
    category: "Installation",
  },
  {
    name: "Montage",
    description: "Montage von elektrischen Komponenten",
    price: "€55.00",
    unit: "Stunde",
    category: "Installation",
  },
  {
    name: "Reparatur",
    description: "Reparatur und Fehlersuche",
    price: "€70.00",
    unit: "Stunde",
    category: "Service",
  },
  {
    name: "Notfall-Service",
    description: "Notdienst außerhalb der Geschäftszeiten",
    price: "€95.00",
    unit: "Stunde",
    category: "Service",
  },
  {
    name: "Fahrtkosten",
    description: "Anfahrtskosten pro Kilometer",
    price: "€0.50",
    unit: "km",
    category: "Sonstiges",
  },
  {
    name: "Material",
    description: "Materialkosten pauschal",
    price: "€1.00",
    unit: "Pauschal",
    category: "Material",
  },
  {
    name: "Wartung",
    description: "Regelmäßige Wartungsarbeiten",
    price: "€60.00",
    unit: "Stunde",
    category: "Service",
  },
  {
    name: "Inspektion",
    description: "Elektrische Inspektion und Prüfung",
    price: "€75.00",
    unit: "Stunde",
    category: "Service",
  },
];

const categories = ["Alle", "Installation", "Service", "Material", "Sonstiges"];

export function Services() {
  return (
    <div className="p-4 sm:p-6 lg:p-12 space-y-6 lg:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl mb-2">Leistungsbibliothek</h1>
          <p className="text-lg sm:text-xl text-muted-foreground">
            Häufig verwendete Leistungen verwalten
          </p>
        </div>
        <Button size="lg" className="h-14 px-8 text-base sm:text-lg gap-3 w-full sm:w-auto">
          <Plus className="w-6 h-6" />
          Neue Leistung
        </Button>
      </div>

      {/* Summary Card */}
      <Card className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
          <div>
            <p className="text-base sm:text-lg text-muted-foreground mb-1">Gespeicherte Leistungen</p>
            <p className="text-2xl sm:text-3xl font-bold">{services.length}</p>
          </div>
          <div className="hidden sm:block h-12 w-px bg-border" />
          <div>
            <p className="text-base sm:text-lg text-muted-foreground mb-1">Kategorien</p>
            <p className="text-2xl sm:text-3xl font-bold">{categories.length - 1}</p>
          </div>
        </div>
      </Card>

      {/* Search */}
      <Card className="p-4 sm:p-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
          <Input
            placeholder="Leistung suchen..."
            className="pl-12 sm:pl-14 h-12 sm:h-14 text-base sm:text-lg"
          />
        </div>
      </Card>

      {/* Filter */}
      <Card className="p-4 sm:p-6">
        <div className="flex gap-2 flex-wrap">
          {categories.map((category) => (
            <Button
              key={category}
              variant={category === "Alle" ? "default" : "outline"}
              size="lg"
              className="h-12 sm:h-14 px-4 sm:px-6 text-sm sm:text-base"
            >
              {category}
            </Button>
          ))}
        </div>
      </Card>

      {/* Services List */}
      <div className="grid grid-cols-1 gap-4">
        {services.map((service) => (
          <Card key={service.name} className="p-4 sm:p-6 hover:bg-card/80 transition-colors">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 rounded-lg bg-primary/10 flex-shrink-0">
                <Briefcase className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
              </div>
              
              <div className="flex-1 min-w-0 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl mb-1">{service.name}</h3>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      {service.description}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-lg bg-secondary text-xs sm:text-sm whitespace-nowrap self-start">
                    {service.category}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                  <div className="text-xl sm:text-2xl font-bold text-primary">
                    {service.price}
                    <span className="text-sm sm:text-base text-muted-foreground ml-2">
                      / {service.unit}
                    </span>
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" size="sm" className="h-10 px-4 flex-1 sm:flex-initial text-sm sm:text-base">
                      <Edit className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Bearbeiten</span>
                    </Button>
                    <Button variant="outline" size="sm" className="h-10 px-4 flex-1 sm:flex-initial text-sm sm:text-base">
                      <Trash2 className="w-4 h-4 text-destructive sm:mr-2" />
                      <span className="hidden sm:inline">Löschen</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Info Card */}
      <Card className="p-6 sm:p-8 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-3 sm:gap-4">
          <Briefcase className="w-7 h-7 sm:w-8 sm:h-8 text-primary mt-1 flex-shrink-0" />
          <div className="space-y-2">
            <h3 className="text-lg sm:text-xl">Tipp: Leistungsbibliothek nutzen</h3>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Speichern Sie häufig verwendete Leistungen hier ab. Beim Erstellen von
              Angeboten und Rechnungen können Sie diese dann schnell einfügen und
              sparen wertvolle Zeit.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
