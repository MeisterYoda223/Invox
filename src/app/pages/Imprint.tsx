import { Card } from "../components/ui/card";

export function Imprint() {
  return (
    <div className="p-4 sm:p-6 lg:p-12 max-w-5xl mx-auto">
      <div className="mb-6 lg:mb-8">
        <h1 className="text-3xl sm:text-4xl mb-2">Impressum</h1>
        <p className="text-lg sm:text-xl text-muted-foreground">
          Angaben gemäß § 5 TMG
        </p>
      </div>

      <Card className="p-6 sm:p-8 space-y-6">
        <section>
          <h2 className="text-xl sm:text-2xl mb-4">Anbieter</h2>
          <div className="text-base sm:text-lg space-y-2 text-muted-foreground">
            <p>[Ihr Firmenname]</p>
            <p>[Straße und Hausnummer]</p>
            <p>[PLZ Ort]</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl mb-4">Kontakt</h2>
          <div className="text-base sm:text-lg space-y-2 text-muted-foreground">
            <p>Telefon: [Ihre Telefonnummer]</p>
            <p>E-Mail: [Ihre E-Mail-Adresse]</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl mb-4">Vertretungsberechtigte</h2>
          <div className="text-base sm:text-lg text-muted-foreground">
            <p>[Name des Geschäftsführers/Inhabers]</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl mb-4">Registereintrag</h2>
          <div className="text-base sm:text-lg space-y-2 text-muted-foreground">
            <p>Registergericht: [Amtsgericht]</p>
            <p>Registernummer: [HRB-Nummer]</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl mb-4">Umsatzsteuer-ID</h2>
          <div className="text-base sm:text-lg text-muted-foreground">
            <p>
              Umsatzsteuer-Identifikationsnummer gemäß §27 a Umsatzsteuergesetz:
            </p>
            <p className="mt-2">[Ihre USt-IdNr.]</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl mb-4">
            Verantwortlich für den Inhalt
          </h2>
          <div className="text-base sm:text-lg text-muted-foreground">
            <p>[Name]</p>
            <p>[Adresse]</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl mb-4">Haftungsausschluss</h2>
          <div className="text-base sm:text-lg space-y-4 text-muted-foreground">
            <div>
              <h3 className="font-semibold text-foreground mb-2">
                Haftung für Inhalte
              </h3>
              <p>
                Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt.
                Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte
                können wir jedoch keine Gewähr übernehmen.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">
                Haftung für Links
              </h3>
              <p>
                Unser Angebot enthält Links zu externen Webseiten Dritter, auf
                deren Inhalte wir keinen Einfluss haben. Deshalb können wir für
                diese fremden Inhalte auch keine Gewähr übernehmen.
              </p>
            </div>
          </div>
        </section>

        <section className="pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Stand: März 2026
          </p>
        </section>
      </Card>
    </div>
  );
}
