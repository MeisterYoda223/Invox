# Invox Multi-User System - Änderungsübersicht

## Zusammenfassung

Ihr Invox-System wurde erfolgreich um ein vollständiges Multi-User-System mit Rollen-basierter Zugriffskontrolle erweitert.

## Hauptfunktionen

### ✅ Automatische Company-Erstellung bei Registrierung
- Neuer User registriert sich → Company wird erstellt
- Erster User wird automatisch **Administrator**
- Firmendaten werden zentral für alle User des Unternehmens gespeichert

### ✅ Rollen-basierte Zugriffskontrolle
- **Admin**: Volle Kontrolle über Firmendaten und Benutzerverwaltung
- **User**: Kann Firmendaten einsehen, aber nicht ändern; kann eigenes Profil bearbeiten

### ✅ Lizenz-Management
- Basic: 1 Benutzer
- Professional: 5 Benutzer  
- Enterprise: Unbegrenzt
- Automatische Prüfung beim Hinzufügen neuer Benutzer

### ✅ Vollständige Benutzerverwaltung
- Admins können Benutzer hinzufügen und entfernen
- Jeder User kann sein eigenes Profil (Name, Email, Passwort) verwalten
- User-Liste mit Rollen-Anzeige

## Geänderte/Neue Dateien

### Core System
| Datei | Änderung | Beschreibung |
|-------|----------|--------------|
| `/src/lib/AuthContext.tsx` | ✏️ Erweitert | Lädt jetzt UserProfile und Company-Daten, stellt `isAdmin` bereit |
| `/src/app/components/auth/AuthScreen.tsx` | ✏️ Erweitert | Erstellt bei Registrierung Company + Admin-User |
| `/src/app/pages/NewSettings.tsx` | ✨ Neu | Vollständig überarbeitete Settings mit Rollen-Management |
| `/src/app/routes.ts` | ✏️ Angepasst | Importiert jetzt NewSettings als Settings |

### Datenbank & Setup
| Datei | Typ | Beschreibung |
|-------|-----|--------------|
| `/DATENBANK_SCHEMA.md` | 📄 Dokumentation | Komplettes DB-Schema mit SQL für Supabase |
| `/MULTI_USER_SETUP.md` | 📄 Anleitung | Schritt-für-Schritt Setup-Anleitung |
| `/supabase/functions/create-company-on-signup/` | 🔧 Edge Function | Optional: Automatische Company-Erstellung als Trigger |

## Neue Features in Settings

Die Einstellungen-Seite hat jetzt folgende Tabs:

### Für Administratoren (5 Tabs)
1. **Firma** 🏢
   - Firmenname, Inhaber, Adresse
   - Telefon, Email, Website
   - Nur Admin kann ändern

2. **Dokumente** 📄
   - Nächste Angebots-/Rechnungsnummer
   - Zahlungsziel
   - Standard-Fußzeilen
   - Nur Admin kann ändern

3. **Steuer** 💰
   - USt-ID, Steuernummer
   - Standard-MwSt-Satz
   - Bankverbindung
   - Nur Admin kann ändern

4. **Benutzer** 👥
   - User-Liste mit Rollen
   - Neue Benutzer hinzufügen
   - Benutzer entfernen
   - Lizenzlimit-Anzeige
   - Nur Admin sichtbar

5. **Mein Profil** 👤
   - Name, Email ändern
   - Passwort ändern
   - Für alle User

### Für normale Benutzer (1 Tab)
1. **Mein Profil** 👤
   - Eigene Daten bearbeiten
   - Passwort ändern

## Datenbank-Struktur

### Neue Tabellen

#### `companies`
Speichert alle Unternehmensdaten:
- Firmendaten (Name, Adresse, Kontakt)
- Dokument-Einstellungen
- Steuerinformationen
- Lizenz-Informationen

#### `user_profiles`
Verknüpft Supabase Auth Users mit Companies:
- User → Company Zuordnung
- Rolle (admin/user)
- Persönliche Daten

### Row Level Security (RLS)
✅ Vollständig implementiert
- User sehen nur Daten ihres Unternehmens
- Admins können Company-Daten ändern
- User können nur eigenes Profil ändern

## AuthContext Erweiterungen

Der `useAuth()` Hook bietet jetzt:

```typescript
const {
  user,           // Supabase Auth User
  userProfile,    // { id, company_id, name, email, role, is_active }
  company,        // { id, company_name, owner, ... }
  isAdmin,        // boolean - true wenn role === 'admin'
  refreshProfile, // Funktion zum Neuladen der Profil-Daten
  // ... bestehende Funktionen
} = useAuth();
```

## Berechtigungen

| Aktion | Admin | User |
|--------|-------|------|
| Firmendaten ansehen | ✅ | ✅ |
| Firmendaten ändern | ✅ | ❌ |
| Dokument-Einstellungen ändern | ✅ | ❌ |
| Steuer-Einstellungen ändern | ✅ | ❌ |
| Benutzer hinzufügen | ✅ | ❌ |
| Benutzer entfernen | ✅ | ❌ |
| Eigenes Profil bearbeiten | ✅ | ✅ |
| Eigenes Passwort ändern | ✅ | ✅ |

## Migration von bestehendem System

### Wenn Sie bereits User haben:

**Option 1: Neu starten** (empfohlen für Testing)
1. Löschen Sie alle User in Supabase Auth
2. Registrieren Sie sich neu
3. Sie werden automatisch Admin

**Option 2: Bestehende User migrieren**
Siehe `/MULTI_USER_SETUP.md` für detaillierte SQL-Befehle

## Setup-Schritte

### 1. Datenbank einrichten ⚙️
```bash
# Öffnen Sie Supabase Dashboard → SQL Editor
# Kopieren Sie SQL aus /DATENBANK_SCHEMA.md
# Führen Sie das SQL aus
```

### 2. Testen 🧪
```bash
# 1. Registrieren Sie einen neuen User
# 2. Überprüfen Sie, dass Sie Admin sind (5 Tabs in Einstellungen)
# 3. Fügen Sie einen neuen Benutzer hinzu
# 4. Melden Sie sich als neuer User an
# 5. Überprüfen Sie, dass nur "Mein Profil" sichtbar ist
```

### 3. Lizenz anpassen (optional) 📝
```sql
UPDATE companies 
SET license_type = 'professional', 
    max_users = 5 
WHERE id = 'YOUR_COMPANY_ID';
```

## Workflow

### Neuer Benutzer registriert sich:
```
1. User füllt Registrierungsformular aus (Name, Firma, Email, PW)
2. Supabase Auth erstellt User
3. System erstellt Company-Eintrag
4. System erstellt User-Profile mit role='admin'
5. User wird automatisch angemeldet
6. User sieht alle 5 Settings-Tabs (= Admin)
```

### Admin fügt neuen Benutzer hinzu:
```
1. Admin geht zu Einstellungen → Benutzer
2. Klickt "Benutzer hinzufügen"
3. System prüft Lizenzlimit
4. Wenn OK: Erstellt User in Supabase Auth
5. Erstellt User-Profile mit role='user' und gleicher company_id
6. Neuer User kann sich anmelden
7. Neuer User sieht nur "Mein Profil" Tab
8. Neuer User kann Firmendaten sehen, aber nicht ändern
```

### User bearbeitet sein Profil:
```
1. User (Admin oder Benutzer) geht zu Mein Profil
2. Kann Name und Email ändern
3. Kann Passwort ändern (optional)
4. Änderungen werden in user_profiles und auth.users gespeichert
```

## Best Practices

### Sicherheit 🔒
- ✅ RLS ist aktiviert auf allen Tabellen
- ✅ Rollen werden serverseitig in Policies geprüft
- ✅ UI zeigt nur erlaubte Aktionen an
- ✅ Passwörter werden von Supabase Auth verwaltet

### Performance ⚡
- ✅ Indexes auf häufig abgefragten Spalten
- ✅ Daten werden im AuthContext gecacht
- ✅ refreshProfile() nur bei Änderungen aufrufen

### UX 🎨
- ✅ Klare Trennung zwischen Admin- und User-Ansicht
- ✅ Große, mobile-optimierte Buttons
- ✅ Tooltips und Hilfetext für Rollen
- ✅ Feedback bei Aktionen (Toast-Benachrichtigungen)

## Troubleshooting

### User sieht keine Company-Daten
→ Prüfen Sie, ob `company_id` in `user_profiles` gesetzt ist

### "Keine Berechtigung" beim Speichern
→ Prüfen Sie die `role` in `user_profiles` (sollte 'admin' sein)

### Lizenzlimit wird ignoriert
→ Prüfen Sie `max_users` in `companies` Tabelle

### Detaillierte Troubleshooting-Anleitung
Siehe `/MULTI_USER_SETUP.md` → Abschnitt "Troubleshooting"

## Weitere Dokumentation

- **Setup**: `/MULTI_USER_SETUP.md`
- **Datenbank-Schema**: `/DATENBANK_SCHEMA.md`
- **Auth-Guide**: `/AUTHENTICATION_GUIDE.md`
- **Supabase-Setup**: `/SUPABASE_SETUP_ANLEITUNG.md`

## Was kommt als Nächstes?

Mögliche Erweiterungen:
- 📧 Email-Einladungen für neue Benutzer
- 🔔 Benachrichtigungen für Admins bei neuen Usern
- 📊 User-Aktivitäts-Log
- 🎯 Erweiterte Rollen (z.B. "Manager", "Viewer")
- 📱 Push-Benachrichtigungen
- 🔄 Company-übergreifende Features (für Enterprise)

---

**Viel Erfolg mit Ihrem Multi-User Invox System! 🚀**

Bei Fragen schauen Sie in die Setup-Anleitung: `/MULTI_USER_SETUP.md`
