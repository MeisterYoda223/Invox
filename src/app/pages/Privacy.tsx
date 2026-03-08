import { Card } from "../components/ui/card";

export function Privacy() {
  return (
    <div className="p-4 sm:p-6 lg:p-12 max-w-5xl mx-auto">
      <div className="mb-6 lg:mb-8">
        <h1 className="text-3xl sm:text-4xl mb-2">Datenschutzerklärung</h1>
        <p className="text-lg sm:text-xl text-muted-foreground">
          Informationen zur Verarbeitung Ihrer personenbezogenen Daten
        </p>
      </div>

      <Card className="p-6 sm:p-8 space-y-6">
        <section>
          <h2 className="text-xl sm:text-2xl mb-4">1. Datenschutz auf einen Blick</h2>
          <div className="text-base sm:text-lg space-y-4 text-muted-foreground">
            <div>
              <h3 className="font-semibold text-foreground mb-2">
                Allgemeine Hinweise
              </h3>
              <p>
                Die folgenden Hinweise geben einen einfachen Überblick darüber,
                was mit Ihren personenbezogenen Daten passiert, wenn Sie diese
                App nutzen. Personenbezogene Daten sind alle Daten, mit denen Sie
                persönlich identifiziert werden können.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl mb-4">2. Datenerfassung in dieser App</h2>
          <div className="text-base sm:text-lg space-y-4 text-muted-foreground">
            <div>
              <h3 className="font-semibold text-foreground mb-2">
                Wer ist verantwortlich für die Datenerfassung?
              </h3>
              <p>
                Die Datenverarbeitung in dieser App erfolgt durch den
                App-Betreiber. Dessen Kontaktdaten können Sie dem Impressum
                entnehmen.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">
                Wie erfassen wir Ihre Daten?
              </h3>
              <p>
                Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese
                mitteilen. Hierbei kann es sich z.B. um Daten handeln, die Sie
                bei der Registrierung eingeben.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">
                Wofür nutzen wir Ihre Daten?
              </h3>
              <p>
                Ein Teil der Daten wird erhoben, um eine fehlerfreie
                Bereitstellung der App zu gewährleisten. Andere Daten können zur
                Analyse Ihres Nutzerverhaltens verwendet werden.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl mb-4">3. Ihre Rechte</h2>
          <div className="text-base sm:text-lg space-y-4 text-muted-foreground">
            <p>
              Sie haben jederzeit das Recht, unentgeltlich Auskunft über Herkunft,
              Empfänger und Zweck Ihrer gespeicherten personenbezogenen Daten zu
              erhalten. Sie haben außerdem ein Recht, die Berichtigung oder
              Löschung dieser Daten zu verlangen.
            </p>
            <div className="space-y-2">
              <p className="font-semibold text-foreground">
                Ihre Rechte im Überblick:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Recht auf Auskunft</li>
                <li>Recht auf Berichtigung</li>
                <li>Recht auf Löschung</li>
                <li>Recht auf Einschränkung der Verarbeitung</li>
                <li>Recht auf Datenübertragbarkeit</li>
                <li>Widerspruchsrecht</li>
                <li>Beschwerderecht bei der Aufsichtsbehörde</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl mb-4">4. Hosting und Datenverarbeitung</h2>
          <div className="text-base sm:text-lg space-y-4 text-muted-foreground">
            <div>
              <h3 className="font-semibold text-foreground mb-2">Supabase</h3>
              <p>
                Wir hosten unsere App bei Supabase. Der Anbieter ist Supabase Inc.,
                970 Toa Payoh North #07-04, Singapore 318992.
              </p>
              <p className="mt-2">
                Supabase ist ein Dienst, der Cloud-Infrastruktur und
                Datenbank-Hosting bereitstellt. Wenn Sie unsere App nutzen, werden
                Ihre Daten auf den Servern von Supabase verarbeitet.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl mb-4">5. Gespeicherte Daten</h2>
          <div className="text-base sm:text-lg space-y-4 text-muted-foreground">
            <p>In dieser App werden folgende Daten verarbeitet und gespeichert:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Benutzerkonto-Informationen (E-Mail, Name, Unternehmen)</li>
              <li>Angebots- und Rechnungsdaten</li>
              <li>Kundendaten</li>
              <li>Leistungskataloge</li>
              <li>Einstellungen und Präferenzen</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl mb-4">6. Datensicherheit</h2>
          <div className="text-base sm:text-lg space-y-4 text-muted-foreground">
            <p>
              Wir verwenden innerhalb des Website-Besuchs das verbreitete
              SSL-Verfahren (Secure Socket Layer) in Verbindung mit der jeweils
              höchsten Verschlüsselungsstufe, die von Ihrem Browser unterstützt
              wird.
            </p>
            <p className="mt-4">
              Im Übrigen sichern wir unsere App und sonstigen Systeme durch
              technische und organisatorische Maßnahmen gegen Verlust,
              Zerstörung, Zugriff, Veränderung oder Verbreitung Ihrer Daten durch
              unbefugte Personen ab.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl mb-4">7. Löschung von Daten</h2>
          <div className="text-base sm:text-lg space-y-4 text-muted-foreground">
            <p>
              Wir löschen personenbezogene Daten grundsätzlich dann, wenn kein
              Erfordernis für eine weitere Speicherung besteht. Ein Erfordernis
              kann insbesondere dann bestehen, wenn die Daten noch benötigt
              werden, um vertragliche Leistungen zu erfüllen, Gewährleistungs-
              und ggf. Garantieansprüche prüfen und gewähren oder abwehren zu
              können.
            </p>
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
