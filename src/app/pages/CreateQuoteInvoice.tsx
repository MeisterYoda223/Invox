import { useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Plus, Trash2, FileText, Receipt, Download } from "lucide-react";

const customers = [
  "Müller GmbH",
  "Schmidt Bau",
  "Wagner Elektrik",
  "Fischer Installation",
  "Becker Malerei",
];

const serviceTemplates = [
  { name: "Elektroinstallation", price: "65.00", unit: "Stunde" },
  { name: "Montage", price: "55.00", unit: "Stunde" },
  { name: "Reparatur", price: "70.00", unit: "Stunde" },
  { name: "Material", price: "1.00", unit: "Pauschal" },
  { name: "Fahrtkosten", price: "0.50", unit: "km" },
];

export function CreateQuoteInvoice() {
  const [documentType, setDocumentType] = useState<"quote" | "invoice">("quote");
  const [items, setItems] = useState([
    { description: "", quantity: "", price: "", unit: "Stunde" },
  ]);

  const addItem = () => {
    setItems([...items, { description: "", quantity: "", price: "", unit: "Stunde" }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    const subtotal = items.reduce((sum, item) => {
      const itemTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0);
      return sum + itemTotal;
    }, 0);
    const tax = subtotal * 0.19;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const { subtotal, tax, total } = calculateTotal();

  return (
    <div className="p-4 sm:p-6 lg:p-12 space-y-6 lg:space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl sm:text-4xl mb-2">
          {documentType === "quote" ? "Neues Angebot" : "Neue Rechnung"} erstellen
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground">
          Füllen Sie die Felder aus und erstellen Sie ein PDF
        </p>
      </div>

      {/* Document Type Selection */}
      <Card className="p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <Button
            size="lg"
            variant={documentType === "quote" ? "default" : "outline"}
            className="h-14 sm:h-16 text-base sm:text-lg gap-2 sm:gap-3"
            onClick={() => setDocumentType("quote")}
          >
            <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
            Angebot
          </Button>
          <Button
            size="lg"
            variant={documentType === "invoice" ? "default" : "outline"}
            className="h-14 sm:h-16 text-base sm:text-lg gap-2 sm:gap-3"
            onClick={() => setDocumentType("invoice")}
          >
            <Receipt className="w-5 h-5 sm:w-6 sm:h-6" />
            Rechnung
          </Button>
        </div>
      </Card>

      {/* Customer Selection */}
      <Card className="p-5 sm:p-8 space-y-5 sm:space-y-6">
        <h2 className="text-xl sm:text-2xl">Kunde</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          <div className="space-y-3">
            <Label className="text-base sm:text-lg">Kunde auswählen</Label>
            <Select>
              <SelectTrigger className="h-12 sm:h-14 text-base sm:text-lg">
                <SelectValue placeholder="Kunde wählen..." />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer} value={customer} className="text-base sm:text-lg py-3">
                    {customer}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            <Label className="text-base sm:text-lg">Datum</Label>
            <Input type="date" className="h-12 sm:h-14 text-base sm:text-lg" defaultValue="2026-03-07" />
          </div>
        </div>
      </Card>

      {/* Items */}
      <Card className="p-5 sm:p-8 space-y-5 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl sm:text-2xl">Leistungspositionen</h2>
          <Button size="lg" onClick={addItem} className="h-12 gap-2 w-full sm:w-auto">
            <Plus className="w-5 h-5" />
            Position hinzufügen
          </Button>
        </div>

        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="p-4 sm:p-6 bg-secondary/30 rounded-lg space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-base">Beschreibung</Label>
                  <Input
                    placeholder="z.B. Elektroinstallation"
                    className="h-12 sm:h-14 text-base sm:text-lg"
                    value={item.description}
                    onChange={(e) => {
                      const newItems = [...items];
                      newItems[index].description = e.target.value;
                      setItems(newItems);
                    }}
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label className="text-sm sm:text-base">Menge</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      className="h-12 sm:h-14 text-base sm:text-lg"
                      value={item.quantity}
                      onChange={(e) => {
                        const newItems = [...items];
                        newItems[index].quantity = e.target.value;
                        setItems(newItems);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm sm:text-base">Einheit</Label>
                    <Select
                      value={item.unit}
                      onValueChange={(value) => {
                        const newItems = [...items];
                        newItems[index].unit = value;
                        setItems(newItems);
                      }}
                    >
                      <SelectTrigger className="h-12 sm:h-14 text-base sm:text-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Stunde" className="text-base sm:text-lg">Std.</SelectItem>
                        <SelectItem value="Stück" className="text-base sm:text-lg">Stk.</SelectItem>
                        <SelectItem value="km" className="text-base sm:text-lg">km</SelectItem>
                        <SelectItem value="Pauschal" className="text-base sm:text-lg">Paus.</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm sm:text-base">Preis €</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      className="h-12 sm:h-14 text-base sm:text-lg"
                      value={item.price}
                      onChange={(e) => {
                        const newItems = [...items];
                        newItems[index].price = e.target.value;
                        setItems(newItems);
                      }}
                    />
                  </div>
                </div>

                {items.length > 1 && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => removeItem(index)}
                    className="h-12 w-full gap-2"
                  >
                    <Trash2 className="w-5 h-5 text-destructive" />
                    Löschen
                  </Button>
                )}
              </div>

              {/* Quick Templates */}
              {item.description === "" && (
                <div className="flex gap-2 flex-wrap pt-2">
                  <span className="text-sm text-muted-foreground w-full mb-1">Vorlage wählen:</span>
                  {serviceTemplates.map((template) => (
                    <Button
                      key={template.name}
                      variant="outline"
                      size="sm"
                      className="text-sm"
                      onClick={() => {
                        const newItems = [...items];
                        newItems[index] = {
                          description: template.name,
                          quantity: "1",
                          price: template.price,
                          unit: template.unit,
                        };
                        setItems(newItems);
                      }}
                    >
                      {template.name}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Additional Info */}
      <Card className="p-5 sm:p-8 space-y-5 sm:space-y-6">
        <h2 className="text-xl sm:text-2xl">Zusätzliche Informationen</h2>
        <div className="space-y-3">
          <Label className="text-base sm:text-lg">Bemerkungen</Label>
          <Textarea
            placeholder="Optional: Zusätzliche Notizen oder Hinweise..."
            className="min-h-32 text-base sm:text-lg"
          />
        </div>
      </Card>

      {/* Summary */}
      <Card className="p-5 sm:p-8 space-y-5 sm:space-y-6">
        <h2 className="text-xl sm:text-2xl">Zusammenfassung</h2>
        <div className="space-y-4">
          <div className="flex justify-between text-lg sm:text-xl">
            <span className="text-muted-foreground">Zwischensumme:</span>
            <span>€{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg sm:text-xl">
            <span className="text-muted-foreground">MwSt. (19%):</span>
            <span>€{tax.toFixed(2)}</span>
          </div>
          <div className="h-px bg-border" />
          <div className="flex justify-between text-2xl sm:text-3xl font-bold">
            <span>Gesamtsumme:</span>
            <span className="text-primary">€{total.toFixed(2)}</span>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button size="lg" className="h-14 sm:h-16 text-lg sm:text-xl gap-3 order-1">
          <Download className="w-6 h-6" />
          PDF erstellen
        </Button>
        <Button variant="outline" size="lg" className="h-14 sm:h-16 text-lg sm:text-xl order-2">
          Abbrechen
        </Button>
      </div>
    </div>
  );
}