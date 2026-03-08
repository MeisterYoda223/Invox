import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Settings as SettingsIcon, Building, FileText, Upload } from "lucide-react";

export function Settings() {
  return (
    <div className="p-4 sm:p-6 lg:p-12 space-y-6 lg:space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl sm:text-4xl mb-2">Einstellungen</h1>
        <p className="text-lg sm:text-xl text-muted-foreground">
          Verwalten Sie Ihre Firmendaten und Einstellungen
        </p>
      </div>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-3 h-12 sm:h-14">
          <TabsTrigger value="company" className="text-sm sm:text-base lg:text-lg">
            Firma
          </TabsTrigger>
          <TabsTrigger value="documents" className="text-sm sm:text-base lg:text-lg">
            Dokumente
          </TabsTrigger>
          <TabsTrigger value="tax" className="text-sm sm:text-base lg:text-lg">
            Steuer
          </TabsTrigger>
        </TabsList>

        {/* Company Data */}
        <TabsContent value="company" className="space-y-6">
          <Card className="p-4 sm:p-6 lg:p-8">
            <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
              <div className="p-3 rounded-lg bg-primary/10 flex-shrink-0">
                <Building className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
              </div>
              <h2 className="text-xl sm:text-2xl">Firmendaten</h2>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2 sm:space-y-3">
                  <Label className="text-base sm:text-lg">Firmenname</Label>
                  <Input
                    placeholder="Mustermann Elektro GmbH"
                    className="h-12 sm:h-14 text-base sm:text-lg"
                  />
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <Label className="text-base sm:text-lg">Inhaber / Geschäftsführer</Label>
                  <Input
                    placeholder="Max Mustermann"
                    className="h-12 sm:h-14 text-base sm:text-lg"
                  />
                </div>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <Label className="text-base sm:text-lg">Straße und Hausnummer</Label>
                <Input
                  placeholder="Musterstraße 123"
                  className="h-12 sm:h-14 text-base sm:text-lg"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                <div className="space-y-2 sm:space-y-3">
                  <Label className="text-base sm:text-lg">PLZ</Label>
                  <Input placeholder="12345" className="h-12 sm:h-14 text-base sm:text-lg" />
                </div>
                <div className="md:col-span-2 space-y-2 sm:space-y-3">
                  <Label className="text-base sm:text-lg">Stadt</Label>
                  <Input placeholder="Musterstadt" className="h-12 sm:h-14 text-base sm:text-lg" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2 sm:space-y-3">
                  <Label className="text-base sm:text-lg">Telefon</Label>
                  <Input
                    placeholder="+49 123 456789"
                    className="h-12 sm:h-14 text-base sm:text-lg"
                  />
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <Label className="text-base sm:text-lg">E-Mail</Label>
                  <Input
                    type="email"
                    placeholder="info@muster-elektro.de"
                    className="h-12 sm:h-14 text-base sm:text-lg"
                  />
                </div>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <Label className="text-base sm:text-lg">Website (optional)</Label>
                <Input
                  placeholder="www.muster-elektro.de"
                  className="h-12 sm:h-14 text-base sm:text-lg"
                />
              </div>
            </div>
          </Card>

          {/* Logo Upload */}
          <Card className="p-4 sm:p-6 lg:p-8">
            <h2 className="text-xl sm:text-2xl mb-4 sm:mb-6">Firmenlogo</h2>
            <div className="space-y-4 sm:space-y-6">
              <div className="border-2 border-dashed border-border rounded-lg p-8 sm:p-12 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <Upload className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                <p className="text-lg sm:text-xl mb-2">Logo hochladen</p>
                <p className="text-sm sm:text-base text-muted-foreground">
                  PNG, JPG oder SVG (max. 2MB)
                </p>
              </div>
              <p className="text-sm sm:text-base text-muted-foreground">
                Ihr Logo erscheint auf allen Angeboten und Rechnungen.
              </p>
            </div>
          </Card>

          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
            <Button variant="outline" size="lg" className="h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg w-full sm:w-auto">
              Abbrechen
            </Button>
            <Button size="lg" className="h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg w-full sm:w-auto">
              Speichern
            </Button>
          </div>
        </TabsContent>

        {/* Document Settings */}
        <TabsContent value="documents" className="space-y-6">
          <Card className="p-4 sm:p-6 lg:p-8">
            <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
              <div className="p-3 rounded-lg bg-primary/10 flex-shrink-0">
                <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
              </div>
              <h2 className="text-xl sm:text-2xl">Dokument-Einstellungen</h2>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2 sm:space-y-3">
                  <Label className="text-base sm:text-lg">Nächste Angebotsnummer</Label>
                  <Input
                    placeholder="ANG-2026-001"
                    className="h-12 sm:h-14 text-base sm:text-lg"
                  />
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <Label className="text-base sm:text-lg">Nächste Rechnungsnummer</Label>
                  <Input
                    placeholder="RE-2026-001"
                    className="h-12 sm:h-14 text-base sm:text-lg"
                  />
                </div>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <Label className="text-base sm:text-lg">Zahlungsziel (Tage)</Label>
                <Input
                  type="number"
                  placeholder="14"
                  className="h-12 sm:h-14 text-base sm:text-lg max-w-xs"
                />
                <p className="text-sm sm:text-base text-muted-foreground">
                  Standard-Zahlungsziel für neue Rechnungen
                </p>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <Label className="text-base sm:text-lg">Standard-Fußzeile für Angebote</Label>
                <Textarea
                  placeholder="Wir freuen uns auf Ihre Auftragserteilung..."
                  className="min-h-28 sm:min-h-32 text-base sm:text-lg"
                />
              </div>

              <div className="space-y-2 sm:space-y-3">
                <Label className="text-base sm:text-lg">Standard-Fußzeile für Rechnungen</Label>
                <Textarea
                  placeholder="Vielen Dank für Ihren Auftrag..."
                  className="min-h-28 sm:min-h-32 text-base sm:text-lg"
                />
              </div>
            </div>
          </Card>

          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
            <Button variant="outline" size="lg" className="h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg w-full sm:w-auto">
              Abbrechen
            </Button>
            <Button size="lg" className="h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg w-full sm:w-auto">
              Speichern
            </Button>
          </div>
        </TabsContent>

        {/* Tax Settings */}
        <TabsContent value="tax" className="space-y-6">
          <Card className="p-4 sm:p-6 lg:p-8">
            <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
              <div className="p-3 rounded-lg bg-primary/10 flex-shrink-0">
                <SettingsIcon className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
              </div>
              <h2 className="text-xl sm:text-2xl">Steuerinformationen</h2>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2 sm:space-y-3">
                  <Label className="text-base sm:text-lg">Umsatzsteuer-ID</Label>
                  <Input
                    placeholder="DE123456789"
                    className="h-12 sm:h-14 text-base sm:text-lg"
                  />
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <Label className="text-base sm:text-lg">Steuernummer</Label>
                  <Input
                    placeholder="123/456/78901"
                    className="h-12 sm:h-14 text-base sm:text-lg"
                  />
                </div>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <Label className="text-base sm:text-lg">Standardmäßiger MwSt-Satz (%)</Label>
                <Input
                  type="number"
                  placeholder="19"
                  className="h-12 sm:h-14 text-base sm:text-lg max-w-xs"
                />
                <p className="text-sm sm:text-base text-muted-foreground">
                  Dieser Steuersatz wird automatisch bei neuen Positionen verwendet
                </p>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <Label className="text-base sm:text-lg">Bankverbindung</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <Input
                    placeholder="Bank Name"
                    className="h-12 sm:h-14 text-base sm:text-lg sm:col-span-2"
                  />
                  <Input
                    placeholder="IBAN"
                    className="h-12 sm:h-14 text-base sm:text-lg"
                  />
                  <Input
                    placeholder="BIC"
                    className="h-12 sm:h-14 text-base sm:text-lg"
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6 lg:p-8 bg-blue-500/5 border-blue-500/20">
            <div className="space-y-2 sm:space-y-3">
              <h3 className="text-lg sm:text-xl">Hinweis</h3>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                Bitte konsultieren Sie Ihren Steuerberater für korrekte steuerliche
                Angaben. Invox übernimmt keine Haftung für steuerrechtliche Fehler.
              </p>
            </div>
          </Card>

          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
            <Button variant="outline" size="lg" className="h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg w-full sm:w-auto">
              Abbrechen
            </Button>
            <Button size="lg" className="h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg w-full sm:w-auto">
              Speichern
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}