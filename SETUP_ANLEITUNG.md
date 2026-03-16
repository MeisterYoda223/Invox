# Invox - Setup-Anleitung

## 🎯 Übersicht

Invox verwendet ein Lizenz- und Einladungssystem:

1. **Neue Admins** erstellen bei der Registrierung automatisch ein Unternehmen
2. **Admins** können Mitarbeiter per E-Mail einladen
3. **Mitarbeiter** registrieren sich und werden automatisch dem Unternehmen zugeordnet
4. **Login** ist nur für lizenzierte und aktive Benutzer möglich

## 📊 Datenbank-Setup

### Schritt 1: SQL-Schema ausführen

1. Gehen Sie in Supabase zum **SQL Editor**
2. Öffnen Sie `/supabase/migrations/001_initial_schema.sql`
3. Kopieren Sie den gesamten Inhalt
4. Fügen Sie ihn im SQL Editor ein
5. Klicken Sie auf **Run**

Das Schema erstellt:
- ✅ `companies` - Unternehmensdaten mit Lizenzen
- ✅ `user_profiles` - Benutzerprofile mit Rollen
- ✅ `employee_invitations` - Mitarbeiter-Einladungen
- ✅ `customers` - Kundendaten
- ✅ `services` - Leistungen/Services
- ✅ Alle RLS (Row Level Security) Policies

### Schritt 2: RLS aktivieren

Die RLS Policies sind bereits im Schema enthalten und werden automatisch aktiviert.

## 🔐 Authentifizierungs-Flow

### Für neue Admins (Firmen-Gründer):

1. **Registrierung** auf der Auth-Seite:
   - Name eingeben
   - **Firmennamen eingeben** (wichtig!)
   - E-Mail und Passwort
2. **System erstellt automatisch**:
   - Neues Unternehmen mit aktivem Status
   - User-Profil als Administrator
3. **Sofortiger Login** und Zugriff auf Dashboard

### Für Mitarbeiter (Eingeladen):

1. **Admin lädt Mitarbeiter ein**:
   - Geht zu **Einstellungen** → **Benutzerverwaltung**-Tab
   - Klickt auf "Einladen"
   - Gibt E-Mail-Adresse ein
   - Wählt Rolle (Admin/Mitarbeiter)
   - Einladung wird in Datenbank gespeichert
2. **Mitarbeiter registriert sich**:
   - Mit der **gleichen E-Mail-Adresse**, die eingeladen wurde
   - Name und Passwort eingeben
   - System erkennt automatisch die Einladung
   - Profil wird erstellt und Company zugeordnet
   - Einladung wird als "akzeptiert" markiert
3. **Sofortiger Zugriff** auf das Unternehmen

### Für bestehende User (Login):

1. **E-Mail und Passwort eingeben**
2. System prüft:
   - ✅ User-Profil existiert?
   - ✅ Profil ist aktiv?
   - ✅ Company hat gültige Lizenz?
3. Wenn nicht → Fehlermeldung mit Hinweis
4. Wenn ja → Dashboard

## 🔑 Lizenz-System

### Lizenz-Status:
- `active` - Aktive Lizenz (Standard für neue Companies)
- `expired` - Abgelaufene Lizenz
- `cancelled` - Gekündigte Lizenz

**KEINE Trial-Lizenzen** - Alle neuen Companies starten mit `active` Status.

### Lizenz-Typen:
- `starter` - Bis zu 3 Benutzer (Standard)
- `professional` - Bis zu 10 Benutzer
- `enterprise` - Unbegrenzt Benutzer

### Automatische Checks:
- ✅ Login nur mit aktiver Lizenz
- ✅ Mitarbeiter-Limit basierend auf Lizenz-Typ
- ✅ Deaktivierte User können sich nicht einloggen
- ✅ Einladungen werden blockiert wenn Limit erreicht

## 👥 Rollen-System

### Admin:
- ✅ Voller Zugriff auf alle Funktionen
- ✅ Kann Firmendaten bearbeiten
- ✅ Kann Mitarbeiter einladen/verwalten
- ✅ Kann andere Admins ernennen
- ✅ Kann Rechnungen/Angebote erstellen
- ✅ Sieht 3 Tabs in Einstellungen: Profil, Firmendaten, Benutzer

### User (Mitarbeiter):
- ✅ Kann Rechnungen/Angebote erstellen
- ✅ Kann Kunden verwalten
- ✅ Kann Leistungen verwalten
- ✅ Kann eigene Profildaten ändern
- ❌ Kann KEINE Firmendaten bearbeiten
- ❌ Kann KEINE Benutzer verwalten
- ❌ Sieht nur 1 Tab in Einstellungen: Profil

## 🎨 User Interface

### Settings-Seite (rollenbasiert):

**Für Mitarbeiter (role: user):**
```
Tabs: [ Mein Profil ]
- Name ändern
- E-Mail anzeigen (nicht änderbar)
- Rolle anzeigen
```

**Für Admins (role: admin):**
```
Tabs: [ Mein Profil | Firmendaten | Benutzerverwaltung ]

Firmendaten-Tab:
- Alle Firmendaten bearbeiten
- Adresse, Kontakt, Steuerdaten, Bankdaten

Benutzerverwaltung-Tab:
- Aktive Benutzer anzeigen
- Mitarbeiter einladen
- Benutzer deaktivieren/aktivieren
- Offene Einladungen verwalten
```

## 🚀 Registrierungs-Flow

### Neue Company erstellen:
```
1. Klick auf "Registrieren"
2. Eingabe:
   - Name: "Max Mustermann"
   - Firmenname: "Mustermann Elektro GmbH"  ← WICHTIG!
   - E-Mail: "max@mustermann.de"
   - Passwort: "******"
3. System erstellt:
   - Company: "Mustermann Elektro GmbH" (active)
   - User-Profile: Max Mustermann (admin)
4. Automatischer Login
```

### Als Mitarbeiter beitreten:
```
1. Admin sendet Einladung an "maria@mustermann.de"
2. Maria registriert sich:
   - Name: "Maria Muster"
   - Firmenname: [wird ignoriert]
   - E-Mail: "maria@mustermann.de"  ← Muss übereinstimmen!
   - Passwort: "******"
3. System erkennt Einladung und erstellt:
   - User-Profile: Maria Muster (user, company_id von Admin)
4. Automatischer Login in Company von Admin
```

## 📝 Wichtige Hinweise

### RLS Policies:
- Alle Tabellen haben Row Level Security aktiviert
- Users können nur Daten ihrer eigenen Company sehen
- Admins können Firmendaten und Benutzer ihrer Company verwalten
- Mitarbeiter können nur ihre eigenen Profildaten ändern

### Einladungs-System:
- Einladungen sind **7 Tage** gültig
- Pro E-Mail kann nur **eine aktive Einladung** existieren
- Einladungen können von Admins gelöscht werden
- Nach Akzeptierung wird Status auf "accepted" gesetzt
- Bei Registrierung prüft System automatisch auf Einladung per E-Mail

### Lizenz-Verwaltung:
- **Keine Trial-Lizenzen** - alle Companies starten mit `active`
- Default: 3 Benutzer (Starter-Lizenz)
- Einladungen werden blockiert wenn Limit erreicht
- Lizenz-Status kann manuell geändert werden

### Company-Erstellung:
- Erfolgt **automatisch bei Registrierung**
- Firmenname ist **Pflichtfeld** (außer bei Einladung)
- User wird automatisch als **Admin** gesetzt
- Keine separate Setup-Seite mehr

## 🛠️ Unterschiede zur alten Version

### ❌ Entfernt:
- AdminSetup-Seite (`/admin-setup`)
- Trial-Lizenzen (`license_status: 'trial'`)
- Manuelle Company-Erstellung nach Registrierung

### ✅ Neu:
- Company-Erstellung direkt bei Registrierung
- Einladungs-basierter Beitritt für Mitarbeiter
- Rollenbasiertes UI in Settings
- Separate Settings-Komponente (`/src/app/pages/Settings.tsx`)
- Alle neuen Companies haben `license_status: 'active'`

## 🔍 Debugging

### Wenn Login nicht funktioniert:
1. Prüfen Sie Browser-Konsole auf Fehler
2. Prüfen Sie ob User-Profil existiert:
   ```sql
   SELECT * FROM user_profiles WHERE email = 'user@example.com';
   ```
3. Prüfen Sie ob Company existiert:
   ```sql
   SELECT * FROM companies WHERE id = 'company-id';
   ```
4. Prüfen Sie Lizenz-Status:
   ```sql
   SELECT license_status FROM companies WHERE id = 'company-id';
   ```

### Wenn Einladung nicht funktioniert:
1. Prüfen Sie ob Einladung existiert:
   ```sql
   SELECT * FROM employee_invitations 
   WHERE email = 'user@example.com' 
   AND status = 'pending';
   ```
2. Prüfen Sie Ablaufdatum (`expires_at`)
3. Prüfen Sie ob E-Mail-Adresse exakt übereinstimmt (lowercase!)

## 📧 Support

Bei Fragen oder Problemen:
1. Prüfen Sie die Browser-Konsole auf Fehler
2. Prüfen Sie Supabase Auth Logs
3. Prüfen Sie RLS Policies in Supabase

## ✅ Checkliste nach Setup

- [ ] SQL-Schema in Supabase ausgeführt
- [ ] Neue Company per Registrierung erstellt
- [ ] Als Admin angemeldet
- [ ] Einstellungen → Firmendaten ausgefüllt
- [ ] Testweise Mitarbeiter eingeladen
- [ ] Mitarbeiter hat sich registriert
- [ ] Mitarbeiter kann sich einloggen
