import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  HelpCircle,
  FileText,
  Receipt,
  Users,
  Briefcase,
  Mail,
  Phone,
  Video,
  BookOpen,
  Settings,
} from "lucide-react";
import { SupabaseConnectionTest } from "../components/debug/SupabaseConnectionTest";
import { useState } from "react";

const helpTopics = [
  {
    title: "Angebote erstellen",
    description: "Schritt-für-Schritt Anleitung zum Erstellen eines Angebots",
    icon: FileText,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    title: "Rechnungen erstellen",
    description: "So erstellen Sie eine Rechnung und exportieren als PDF",
    icon: Receipt,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    title: "Kunden verwalten",
    description: "Kundendaten anlegen, bearbeiten und organisieren",
    icon: Users,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    title: "Leistungen speichern",
    description: "Häufig verwendete Leistungen in der Bibliothek ablegen",
    icon: Briefcase,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
];

const contactOptions = [
  {
    title: "E-Mail Support",
    description: "support@invox.de",
    icon: Mail,
    action: "E-Mail schreiben",
  },
  {
    title: "Telefon Support",
    description: "+49 800 123 4567",
    icon: Phone,
    action: "Anrufen",
  },
  {
    title: "Video-Tutorials",
    description: "Schritt-für-Schritt Anleitungen",
    icon: Video,
    action: "Videos ansehen",
  },
  {
    title: "Dokumentation",
    description: "Vollständige Bedienungsanleitung",
    icon: BookOpen,
    action: "Öffnen",
  },
];

export function Help() {
  const [isConnectionTestVisible, setConnectionTestVisible] = useState(false);

  return (
    <div className="p-4 sm:p-6 lg:p-12 space-y-6 lg:space-y-8">
      <div>
        <h1 className="text-3xl sm:text-4xl mb-2">Hilfe & Support</h1>
        <p className="text-lg sm:text-xl text-muted-foreground">
          Wir helfen Ihnen bei der Nutzung von Invox
        </p>
      </div>

      {/* Welcome Card */}
      <Card className="p-6 sm:p-8 bg-primary/5 border-primary/20">
        <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
          <div className="p-3 sm:p-4 rounded-lg bg-primary/20 flex-shrink-0">
            <HelpCircle className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
          </div>
          <div className="flex-1 space-y-3 sm:space-y-4">
            <h2 className="text-xl sm:text-2xl">Willkommen bei Invox</h2>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Invox macht es einfach, professionelle Angebote und Rechnungen zu
              erstellen. Diese Hilfeseite unterstützt Sie bei den ersten Schritten
              und beantwortet häufige Fragen. Bei weiteren Fragen stehen wir Ihnen
              gerne zur Verfügung.
            </p>
          </div>
        </div>
      </Card>

      {/* Quick Start Guide */}
      <div>
        <h2 className="text-xl sm:text-2xl mb-4 sm:mb-6">Schnellstart-Anleitungen</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {helpTopics.map((topic) => {
            const Icon = topic.icon;
            return (
              <Card
                key={topic.title}
                className="p-5 sm:p-6 hover:bg-card/80 transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-4 sm:gap-6">
                  <div className={`p-3 sm:p-4 rounded-lg ${topic.bgColor} flex-shrink-0`}>
                    <Icon className={`w-6 h-6 sm:w-7 sm:h-7 ${topic.color}`} />
                  </div>
                  <div className="flex-1 space-y-2 sm:space-y-3">
                    <h3 className="text-lg sm:text-xl">{topic.title}</h3>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      {topic.description}
                    </p>
                    <Button variant="link" className="p-0 h-auto text-primary text-sm sm:text-base">
                      Mehr erfahren →
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* FAQ Placeholder */}
      <Card className="p-6 sm:p-8">
        <h2 className="text-xl sm:text-2xl mb-4 sm:mb-6">Häufig gestellte Fragen</h2>
        <div className="space-y-4 sm:space-y-6">
          <div className="space-y-2 sm:space-y-3">
            <h3 className="text-lg sm:text-xl">Wie kann ich meine Firmendaten ändern?</h3>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Gehen Sie zu Einstellungen → Firmendaten. Dort können Sie Ihre
              Firmeninformationen bearbeiten und Ihr Logo hochladen.
            </p>
          </div>
          <div className="h-px bg-border" />
          <div className="space-y-2 sm:space-y-3">
            <h3 className="text-lg sm:text-xl">Wie exportiere ich eine Rechnung als PDF?</h3>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Öffnen Sie die gewünschte Rechnung und klicken Sie auf den Button
              "PDF erstellen". Die Rechnung wird automatisch als PDF-Datei
              heruntergeladen.
            </p>
          </div>
          <div className="h-px bg-border" />
          <div className="space-y-2 sm:space-y-3">
            <h3 className="text-lg sm:text-xl">
              Kann ich ein Angebot in eine Rechnung umwandeln?
            </h3>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Ja! Gehen Sie zu Angebote, wählen Sie ein angenommenes Angebot aus und
              klicken Sie auf "In Rechnung umwandeln". Die Daten werden automatisch
              übernommen.
            </p>
          </div>
        </div>
      </Card>

      {/* Contact Options */}
      <div>
        <h2 className="text-xl sm:text-2xl mb-4 sm:mb-6">Support kontaktieren</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {contactOptions.map((option) => {
            const Icon = option.icon;
            return (
              <Card key={option.title} className="p-5 sm:p-6">
                <div className="flex items-start gap-4 sm:gap-6">
                  <div className="p-3 sm:p-4 rounded-lg bg-primary/10 flex-shrink-0">
                    <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                  </div>
                  <div className="flex-1 space-y-2 sm:space-y-3">
                    <h3 className="text-lg sm:text-xl">{option.title}</h3>
                    <p className="text-base sm:text-lg text-muted-foreground">
                      {option.description}
                    </p>
                    <Button variant="outline" size="lg" className="mt-2 h-12 text-sm sm:text-base w-full sm:w-auto">
                      {option.action}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Additional Resources */}
      <Card className="p-6 sm:p-8 bg-secondary/30">
        <div className="text-center space-y-3 sm:space-y-4">
          <h2 className="text-xl sm:text-2xl">Weitere Ressourcen</h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Besuchen Sie unser{" "}
            <span className="text-primary font-medium">Hilfezentrum</span> für
            detaillierte Anleitungen, Video-Tutorials und eine umfassende
            Dokumentation aller Funktionen.
          </p>
          <Button size="lg" className="mt-4 h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg w-full sm:w-auto">
            Zum Hilfezentrum
          </Button>
        </div>
      </Card>

      {/* Debugging Section */}
      <Card className="p-6 sm:p-8 bg-red-500/10 border-red-500/20">
        <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
          <div className="p-3 sm:p-4 rounded-lg bg-red-500/20 flex-shrink-0">
            <Settings className="w-8 h-8 sm:w-10 sm:h-10 text-red-500" />
          </div>
          <div className="flex-1 space-y-3 sm:space-y-4">
            <h2 className="text-xl sm:text-2xl">Debugging</h2>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Hier können Sie die Verbindung zu Supabase testen, um sicherzustellen,
              dass alles korrekt eingerichtet ist.
            </p>
            <Button
              variant="outline"
              size="lg"
              className="mt-2 h-12 text-sm sm:text-base w-full sm:w-auto"
              onClick={() => setConnectionTestVisible(!isConnectionTestVisible)}
            >
              {isConnectionTestVisible ? "Test ausblenden" : "Verbindung testen"}
            </Button>
          </div>
        </div>
        
        {isConnectionTestVisible && (
          <div className="mt-6">
            <SupabaseConnectionTest />
          </div>
        )}
      </Card>
    </div>
  );
}