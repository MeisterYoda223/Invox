Erstelle eine vollständige Backend-Architektur, Datenbankstruktur und Integrationslogik für eine bestehende SaaS Web-App.

WICHTIG:
Das Design und die Hauptfunktionen der App existieren bereits.

Die App kann bereits:

- Aufträge erstellen
- Rechnungen erstellen
- Kunden verwalten

Es geht NICHT darum neue Features zu erfinden, sondern darum:

- Supabase Auth zu integrieren
- Benutzerrollen einzubauen
- ein Lizenzsystem zu integrieren
- Einladungen zu ermöglichen
- Activity Logging zu implementieren
- eine saubere Supabase Architektur zu erstellen

Die Lösung soll skalierbar und production ready sein.

------------------------------------------------

APP KONTEXT

Die App ist eine Unternehmenssoftware für kleine Firmen.

Unternehmen können:

- Aufträge erstellen
- Rechnungen erstellen
- Kunden verwalten

Alle Daten gehören immer zu genau einem Unternehmen.

Die App ist ein Multi-Tenant SaaS System.

------------------------------------------------

BENUTZERROLLEN

Es gibt genau zwei Rollen:

ADMIN (Firmenchef)
MITARBEITER

ADMIN darf:

- Unternehmenseinstellungen verwalten
- Mitarbeiter einladen
- Mitarbeiter entfernen
- Einladungen verwalten
- Lizenzinformationen sehen
- Activity Logs sehen
- eigenes Profil bearbeiten
- Unternehmensprofil bearbeiten

MITARBEITER darf:

- Aufträge erstellen
- Rechnungen erstellen
- eigenes Profil bearbeiten

MITARBEITER darf NICHT:

- Mitarbeiter verwalten
- Unternehmenseinstellungen ändern
- Activity Logs sehen
- Lizenzen sehen
- Einladungen sehen

------------------------------------------------

REGISTRIERUNG

Wenn sich ein neuer Benutzer registriert:

Schritt 1
Account erstellen über Supabase Auth:

- Email
- Passwort

Schritt 2
Grundlegende Unternehmensdaten erfassen:

Pflichtfelder:

- Firmenname

Weitere wichtige Unternehmensdaten können später in den bestehenden Einstellungen gepflegt werden.

Nach Registrierung:

- Ein neues Unternehmen wird erstellt
- Der Benutzer wird automatisch Admin
- Eine company_id wird erstellt
- Der Benutzer wird in company_members eingetragen

------------------------------------------------

EINLADUNGSSYSTEM

Admins können Mitarbeiter einladen.

Ablauf:

1 Admin gibt Email ein
2 System prüft ob noch freie Lizenzen vorhanden sind
3 Einladung wird erstellt
4 Einladungsemail wird versendet

Einladungen enthalten einen eindeutigen Token.

Beispiel Link:

/invite?token=abc123

Die invitations Tabelle enthält:

- id
- company_id
- email
- role
- token
- status
- expires_at
- created_at

Status Werte:

- pending
- accepted
- expired

Wenn ein eingeladener Benutzer den Link öffnet:

- Token wird geprüft
- Einladung darf nicht abgelaufen sein
- Email muss übereinstimmen

Nach Registrierung:

- Benutzer wird automatisch dem Unternehmen zugeordnet
- Rolle = Mitarbeiter
- Einladung wird auf accepted gesetzt

Der Mitarbeiter erstellt danach sein Profil:

- Name
- Passwort

------------------------------------------------

LIZENZSYSTEM

Das Lizenzsystem wird extern verwaltet und automatisch in der Datenbank aktualisiert.

Die App liest nur die Lizenzinformationen.

Lizenzfelder:

- license_count
- license_active
- license_expires_at

Beispiel:

Admin hat 4 Lizenzen.

Das bedeutet:

1 Admin
+ 3 Mitarbeiter

Regeln:

Die maximale Anzahl von company_members darf license_count nicht überschreiten.

Wenn keine Plätze frei sind:

- Invite Button deaktivieren
- Einladung über API ebenfalls blockieren

Diese Prüfung muss sowohl im Frontend als auch serverseitig erfolgen.

------------------------------------------------

LOGIN UND LIZENZPRÜFUNG

Supabase Auth übernimmt die Authentifizierung.

Nach erfolgreichem Login wird geprüft:

- license_active
- license_expires_at

Wenn keine gültige Lizenz vorhanden ist:

Der Zugriff auf die App wird blockiert und eine Seite angezeigt mit der Meldung:

"Keine aktive Lizenz vorhanden."

Diese Prüfung erfolgt über eine Supabase Edge Function oder beim Laden der App.

------------------------------------------------

ACTIVITY LOGGING

Jede wichtige Aktion wird gespeichert.

Beispiele:

- Auftrag erstellt
- Auftrag bearbeitet
- Auftrag gelöscht
- Rechnung erstellt
- Rechnung bearbeitet
- Rechnung gelöscht
- Login
- Benutzer eingeladen
- Benutzer entfernt
- Einstellungen geändert

Log Struktur:

- id
- company_id
- user_id
- action
- entity_type
- entity_id
- metadata JSON
- created_at

Activity Logs sind nur für Admin sichtbar.

Logging kann über Edge Functions oder Database Triggers umgesetzt werden.

------------------------------------------------

DATENBANK STRUKTUR (SUPABASE)

Tabellen:

companies
company_members
invitations
licenses
activity_logs

Users werden über Supabase Auth verwaltet.

company_members verbindet Benutzer mit Unternehmen.

------------------------------------------------

RELATIONEN

company_members

- user_id
- company_id
- role (admin | employee)
- created_at

Jeder Benutzer gehört genau zu einem Unternehmen.

Alle Business Daten enthalten:

company_id

Beispiele:

orders
invoices
customers

------------------------------------------------

ROW LEVEL SECURITY

Supabase Row Level Security muss aktiviert sein.

Grundregel:

Benutzer dürfen nur Daten sehen wenn:

company_id = ihre company_id

Mitarbeiter dürfen NICHT zugreifen auf:

- activity_logs
- invitations
- licenses

Admins dürfen alles innerhalb ihres Unternehmens verwalten.

------------------------------------------------

EINSTELLUNGSSEITEN

Admin Settings:

Bereiche:

- Unternehmensprofil
- Team / Mitarbeiter
- Einladungen
- Lizenzinformationen
- Activity Logs
- eigenes Profil

Mitarbeiter Settings:

- eigenes Profil
- Passwort ändern
- Avatar

------------------------------------------------

EDGE FUNCTIONS

Erstelle unter anderem folgende Supabase Edge Functions:

inviteUser
sendInvitationEmail
checkLicenseAccess
logActivity

Funktionen:

inviteUser
- prüft Lizenzlimit
- erstellt Einladung
- generiert Token
- ruft sendInvitationEmail auf

sendInvitationEmail
- sendet Einladungslink

checkLicenseAccess
- prüft license_active
- prüft license_expires_at

logActivity
- erstellt Activity Log Eintrag

Alle wichtigen Aktionen sollen automatisch logActivity aufrufen.

------------------------------------------------

OUTPUT

Erstelle:

1 vollständige Datenbankstruktur
2 SQL Tabellen
3 Indizes und Relationen
4 RLS Policies
5 Edge Function Struktur
6 API Flow
7 Einladungslogik
8 Lizenzprüfung
9 Auth Flow

------------------------------------------------

ZUSÄTZLICH

Erstelle eine vollständige Markdown Datei mit dem Namen:

SUPABASE_SETUP.md

Diese Dokumentation muss enthalten:

- Projektinitialisierung mit Supabase CLI
- Einrichtung von Authentication
- Erstellung der Tabellen
- Aktivierung von Row Level Security
- Deployment von Edge Functions
- Umgebungsvariablen
- Lizenzprüfung beim Login
- Activity Logging
- Einladungssystem
- Security Best Practices
- Produktionscheckliste

Die Markdown Dokumentation soll vollständig sein, sodass ein Entwickler das komplette System Schritt für Schritt einrichten kann.