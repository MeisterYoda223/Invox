import { Card } from "../components/ui/card";

export function Terms() {
  return (
    <div className="p-4 sm:p-6 lg:p-12 max-w-5xl mx-auto">
      <div className="mb-6 lg:mb-8">
        <h1 className="text-3xl sm:text-4xl mb-2">Nutzungsbedingungen</h1>
        <p className="text-lg sm:text-xl text-muted-foreground">
          Allgemeine Geschäftsbedingungen für die Nutzung von Invox
        </p>
      </div>

      <Card className="p-6 sm:p-8 space-y-6">
        <section>
          <h2 className="text-xl sm:text-2xl mb-4">1. Geltungsbereich</h2>
          <div className="text-base sm:text-lg space-y-4 text-muted-foreground">
            <p>
              Diese Nutzungsbedingungen regeln die Nutzung der Software-Anwendung
              "Invox" (nachfolgend "App") zur Erstellung und Verwaltung von
              Angeboten und Rechnungen. Mit der Nutzung der App erklären Sie sich
              mit diesen Bedingungen einverstanden.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl mb-4">2. Registrierung und Nutzerkonto</h2>
          <div className="text-base sm:text-lg space-y-4 text-muted-foreground">
            <div>
              <h3 className="font-semibold text-foreground mb-2">2.1 Registrierung</h3>
              <p>
                Für die Nutzung der App ist eine Registrierung erforderlich. Bei
                der Registrierung sind vollständige und wahrheitsgemäße Angaben zu
                machen.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">
                2.2 Zugangsdaten
              </h3>
              <p>
                Sie sind verpflichtet, Ihre Zugangsdaten geheim zu halten und vor
                dem Zugriff durch Dritte zu schützen. Bei Verdacht auf Missbrauch
                sind Sie verpflichtet, uns unverzüglich zu informieren.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl mb-4">3. Leistungsumfang</h2>
          <div className="text-base sm:text-lg space-y-4 text-muted-foreground">
            <div>
              <h3 className="font-semibold text-foreground mb-2">
                3.1 Funktionsumfang
              </h3>
              <p>Die App bietet folgende Hauptfunktionen:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                <li>Erstellung und Verwaltung von Angeboten</li>
                <li>Erstellung und Verwaltung von Rechnungen</li>
                <li>Kundenverwaltung</li>
                <li>Leistungskatalog-Verwaltung</li>
                <li>Archivierung von Dokumenten</li>
                <li>Dashboard mit Übersichten</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">
                3.2 Verfügbarkeit
              </h3>
              <p>
                Wir bemühen uns um eine möglichst hohe Verfügbarkeit der App. Eine
                Garantie für ununterbrochene Verfügbarkeit können wir jedoch nicht
                geben. Wartungsarbeiten werden nach Möglichkeit außerhalb der
                üblichen Geschäftszeiten durchgeführt.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl mb-4">4. Nutzerpflichten</h2>
          <div className="text-base sm:text-lg space-y-4 text-muted-foreground">
            <p>Als Nutzer verpflichten Sie sich:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Die App nur für rechtmäßige Zwecke zu nutzen</li>
              <li>
                Keine Inhalte zu erstellen oder zu teilen, die gegen geltendes
                Recht verstoßen
              </li>
              <li>Keine Schadsoftware hochzuladen oder zu verbreiten</li>
              <li>
                Keine Maßnahmen zu ergreifen, die die Funktionalität der App
                beeinträchtigen könnten
              </li>
              <li>
                Regelmäßige Sicherungen Ihrer Daten auf eigenen Systemen
                durchzuführen
              </li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl mb-4">5. Datenschutz und Datensicherheit</h2>
          <div className="text-base sm:text-lg space-y-4 text-muted-foreground">
            <p>
              Die Verarbeitung personenbezogener Daten erfolgt gemäß unserer
              Datenschutzerklärung und den geltenden datenschutzrechtlichen
              Bestimmungen, insbesondere der DSGVO.
            </p>
            <p className="mt-4">
              Sie sind selbst für die Rechtmäßigkeit der von Ihnen in der App
              gespeicherten Daten verantwortlich und verpflichtet, die
              datenschutzrechtlichen Bestimmungen bei der Verarbeitung von
              Kundendaten einzuhalten.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl mb-4">6. Haftung</h2>
          <div className="text-base sm:text-lg space-y-4 text-muted-foreground">
            <div>
              <h3 className="font-semibold text-foreground mb-2">
                6.1 Haftungsbeschränkung
              </h3>
              <p>
                Wir haften unbeschränkt für Schäden aus der Verletzung des Lebens,
                des Körpers oder der Gesundheit sowie für Schäden, die auf Vorsatz
                oder grober Fahrlässigkeit beruhen.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">
                6.2 Datenverlust
              </h3>
              <p>
                Wir empfehlen dringend, regelmäßige Backups Ihrer Daten
                anzulegen. Eine Haftung für Datenverlust besteht nur im Rahmen der
                gesetzlichen Bestimmungen.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl mb-4">7. Preise und Zahlung</h2>
          <div className="text-base sm:text-lg space-y-4 text-muted-foreground">
            <p>
              Die aktuellen Preise für die Nutzung der App entnehmen Sie bitte
              unserer Website. Alle Preise verstehen sich inklusive der
              gesetzlichen Mehrwertsteuer.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl mb-4">8. Laufzeit und Kündigung</h2>
          <div className="text-base sm:text-lg space-y-4 text-muted-foreground">
            <div>
              <h3 className="font-semibold text-foreground mb-2">8.1 Laufzeit</h3>
              <p>
                Der Vertrag wird auf unbestimmte Zeit geschlossen und kann von
                beiden Parteien mit einer Frist von einem Monat gekündigt werden.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">
                8.2 Außerordentliche Kündigung
              </h3>
              <p>
                Das Recht zur außerordentlichen Kündigung aus wichtigem Grund
                bleibt unberührt. Ein wichtiger Grund liegt insbesondere vor, wenn
                der Nutzer gegen wesentliche Bestimmungen dieser
                Nutzungsbedingungen verstößt.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl mb-4">9. Änderungen der Nutzungsbedingungen</h2>
          <div className="text-base sm:text-lg space-y-4 text-muted-foreground">
            <p>
              Wir behalten uns das Recht vor, diese Nutzungsbedingungen zu ändern.
              Über Änderungen werden Sie rechtzeitig vor deren Inkrafttreten per
              E-Mail informiert. Widersprechen Sie den Änderungen nicht innerhalb
              von vier Wochen nach Zugang der Mitteilung, gelten die Änderungen
              als angenommen.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl mb-4">10. Schlussbestimmungen</h2>
          <div className="text-base sm:text-lg space-y-4 text-muted-foreground">
            <div>
              <h3 className="font-semibold text-foreground mb-2">
                10.1 Anwendbares Recht
              </h3>
              <p>
                Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss
                des UN-Kaufrechts.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">10.2 Gerichtsstand</h3>
              <p>
                Soweit gesetzlich zulässig, ist ausschließlicher Gerichtsstand für
                alle Streitigkeiten aus diesem Vertragsverhältnis der Sitz unseres
                Unternehmens.
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
