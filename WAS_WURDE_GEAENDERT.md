# Was wurde geändert? - Übersicht für Entwickler

## 🎯 Ziel erreicht!

Ihr Invox-System verfügt jetzt über ein vollständiges **Multi-User-System mit Rollen-basierter Zugriffskontrolle**.

---

## 📋 Geänderte Dateien

### ✏️ Modifiziert

| Datei | Was wurde geändert |
|-------|-------------------|
| `/src/lib/AuthContext.tsx` | ✨ Erweitert um `userProfile`, `company`, `isAdmin`, `refreshProfile()` |
| `/src/app/components/auth/AuthScreen.tsx` | ✨ Erstellt jetzt bei Registrierung Company + Admin User Profile |
| `/src/app/routes.ts` | 🔧 Import geändert: `Settings` kommt jetzt von `NewSettings.tsx` |

### ✨ Neu erstellt

| Datei | Zweck |
|-------|-------|
| `/src/app/pages/NewSettings.tsx` | 🆕 Vollständig neue Settings-Seite mit Multi-User Features |
| `/DATENBANK_SCHEMA.md` | 📄 Komplettes SQL für Supabase Datenbank-Setup |
| `/MULTI_USER_SETUP.md` | 📖 Detaillierte Schritt-für-Schritt Anleitung |
| `/README_MULTI_USER.md` | 📖 Vollständige Feature-Dokumentation |
| `/SCHNELLSTART_MULTI_USER.md` | 🚀 Quick-Start in 3 Schritten |
| `/SYSTEM_ARCHITEKTUR.md` | 🏗️ System-Architektur mit Diagrammen |
| `/WAS_WURDE_GEAENDERT.md` | 📝 Diese Datei |
| `/supabase/functions/create-company-on-signup/index.ts` | 🔧 Optional: Edge Function für Company-Erstellung |

### 🗑️ Gelöscht

| Datei | Grund |
|-------|-------|
| `/src/app/pages/Settings.tsx` | Ersetzt durch `NewSettings.tsx` |

---

## 🔍 Was ist jetzt anders?

### Vorher (Altes System)
```typescript
// Alte AuthContext
const { user, session, signIn, signOut } = useAuth();

// Alte Settings
- Firmendaten wurden pro User gespeichert (user.id)
- Keine Rollen
- Keine Benutzerverwaltung
- Jeder User hatte eigene Firma
```

### Nachher (Neues System)
```typescript
// Neue AuthContext
const { 
  user,          // Supabase Auth User
  userProfile,   // { id, company_id, name, email, role, is_active }
  company,       // { id, company_name, owner, ... alle Firmendaten }
  isAdmin,       // true wenn role === 'admin'
  refreshProfile // Funktion zum Neuladen
} = useAuth();

// Neue Settings
- Firmendaten zentral in companies-Tabelle (company_id)
- Rollen: 'admin' und 'user'
- Vollständige Benutzerverwaltung
- Mehrere User pro Firma
- Lizenz-Management
```

---

## 🗄️ Datenbank-Änderungen

### Neue Tabellen

#### `companies`
Speichert alle Unternehmensdaten zentral:
```sql
- id (UUID, Primary Key)
- company_name, owner, street, zip, city, phone, email, website
- license_type, max_users
- next_quote_number, next_invoice_number, payment_terms
- quote_footer, invoice_footer
- vat_id, tax_number, default_vat_rate
- bank_name, iban, bic
```

#### `user_profiles`
Verknüpft Auth-User mit Companies:
```sql
- id (UUID, Foreign Key → auth.users.id)
- company_id (Foreign Key → companies.id)
- name, email
- role ('admin' | 'user')
- is_active (boolean)
```

### Row Level Security (RLS)
Alle Tabellen sind mit RLS gesichert:
- ✅ User sehen nur Daten ihrer Company
- ✅ Nur Admins können Company-Daten ändern
- ✅ User können nur ihr eigenes Profil ändern

---

## 🎨 UI-Änderungen

### Settings-Seite

**Admin sieht 5 Tabs:**
1. **Firma** - Firmendaten bearbeiten
2. **Dokumente** - Dokument-Einstellungen
3. **Steuer** - Steuerinformationen  
4. **Benutzer** - User hinzufügen/entfernen
5. **Mein Profil** - Eigene Daten

**Normaler User sieht 1 Tab:**
1. **Mein Profil** - Eigene Daten

### Neue Features

#### Benutzerverwaltung (nur Admin)
- ➕ Neue User hinzufügen
- 👥 Liste aller User der Company
- 🗑️ User entfernen (außer sich selbst)
- 📊 Lizenzlimit-Anzeige
- 🛡️ Rollen-Badges (Admin/User)

#### Profilverwaltung (alle User)
- ✏️ Name ändern
- 📧 Email ändern
- 🔒 Passwort ändern
- 💾 Alles in einem Formular

---

## 🔐 Sicherheits-Features

### Frontend (React)
```typescript
// UI wird basierend auf Rolle angepasst
{isAdmin && <AdminOnlyTab />}

// Speicher-Funktionen prüfen Rolle
if (!isAdmin) {
  toast.error("Keine Berechtigung");
  return;
}
```

### Backend (Supabase)
```sql
-- RLS Policy: Nur Admins können Companies updaten
CREATE POLICY "Admins can update company"
  ON companies FOR UPDATE
  USING (
    id IN (
      SELECT company_id FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### Mehrschichtige Sicherheit
1. **UI-Layer**: Tabs/Buttons werden ausgeblendet
2. **Logic-Layer**: Funktionen prüfen `isAdmin`
3. **RLS-Layer**: Datenbank prüft Berechtigungen
4. **Constraint-Layer**: Foreign Keys + Cascades

---

## 🔄 Workflow-Änderungen

### Registrierung - NEU
```
1. User füllt Formular aus (Name, Firma, Email, PW)
2. signUp() erstellt Auth-User
3. Company wird erstellt
4. User Profile wird erstellt mit role='admin'
5. User wird automatisch angemeldet
6. AuthContext lädt Company + Profile
7. User ist Admin! ✅
```

### User hinzufügen - NEU
```
1. Admin geht zu Settings → Benutzer
2. Klickt "Benutzer hinzufügen"
3. System prüft Lizenzlimit
4. Wenn OK: Auth-User wird erstellt
5. User Profile mit role='user' wird erstellt
6. Neuer User kann sich anmelden
7. User sieht nur "Mein Profil" ✅
```

### Firmendaten ändern
```
VORHER:
- Jeder User konnte eigene Firmendaten ändern
- Gespeichert unter: settings:company:{user.id}

NACHHER:
- Nur Admin kann Firmendaten ändern
- Gespeichert in: companies-Tabelle
- Alle User der Company sehen gleiche Daten
```

---

## 🧪 Testing-Checkliste

### ✅ Schritt 1: Datenbank Setup
- [ ] SQL in Supabase ausgeführt
- [ ] Tabellen `companies` und `user_profiles` existieren
- [ ] RLS Policies sind aktiv

### ✅ Schritt 2: Registrierung
- [ ] Neuer User kann sich registrieren
- [ ] Company wird automatisch erstellt
- [ ] User Profile mit role='admin' wird erstellt
- [ ] User wird automatisch angemeldet

### ✅ Schritt 3: Admin-Rechte
- [ ] Admin sieht 5 Tabs in Settings
- [ ] Admin kann Firmendaten ändern
- [ ] Admin kann User hinzufügen
- [ ] Admin sieht User-Liste

### ✅ Schritt 4: User hinzufügen
- [ ] Admin kann User hinzufügen (wenn Lizenz erlaubt)
- [ ] Lizenzlimit wird geprüft
- [ ] Neuer User erhält role='user'
- [ ] Neuer User kann sich anmelden

### ✅ Schritt 5: User-Rechte
- [ ] Normaler User sieht nur "Mein Profil" Tab
- [ ] User kann Firmendaten sehen
- [ ] User kann Firmendaten NICHT ändern
- [ ] User kann eigenes Profil bearbeiten

---

## 🐛 Bekannte Limitierungen

### 1. Keine Email-Bestätigung
- User werden sofort aktiv
- Keine Email-Verifizierung
- **Lösung**: Supabase Email-Templates konfigurieren

### 2. Keine Einladungs-Links
- Admin muss Passwort für neuen User setzen
- User kann Passwort später ändern
- **Verbesserung**: Einladungs-Emails mit Token

### 3. Kein User-Audit-Log
- Keine History wer was geändert hat
- **Verbesserung**: Audit-Log Tabelle

### 4. Keine Bulk-Operations
- User können nur einzeln hinzugefügt/entfernt werden
- **Verbesserung**: CSV-Import/Export

---

## 📊 Migrations-Pfad

### Falls Sie bereits User haben:

#### Option A: Neu starten (empfohlen für Testing)
1. Löschen Sie alle User in Supabase Auth
2. Löschen Sie alte `kv_store` Einträge (optional)
3. Registrieren Sie sich neu
4. Fertig! ✅

#### Option B: Bestehende User migrieren
Siehe `/MULTI_USER_SETUP.md` → "Schritt 2: Bestehende Benutzer migrieren"

---

## 🚀 Nächste Schritte

### Sofort:
1. ✅ Datenbank-Tabellen erstellen (siehe `/DATENBANK_SCHEMA.md`)
2. ✅ Ersten Admin-Account erstellen
3. ✅ System testen

### Später (optional):
- 📧 Email-Einladungen implementieren
- 🔔 Benachrichtigungen für Admins
- 📊 User-Aktivitäts-Dashboard
- 🎯 Erweiterte Rollen (Manager, Viewer, etc.)
- 📱 Push-Benachrichtigungen

---

## 🆘 Support

### Bei Problemen:
1. 📖 Lesen Sie `/SCHNELLSTART_MULTI_USER.md`
2. 🔍 Prüfen Sie die Browser-Konsole (F12)
3. 📊 Prüfen Sie Supabase Logs
4. 📋 Vergleichen Sie mit `/SYSTEM_ARCHITEKTUR.md`

### Häufige Fehler:
- **"Keine Berechtigung"**: Sie sind nicht als Admin angemeldet
- **"Lizenzlimit erreicht"**: `max_users` in DB erhöhen
- **User sieht keine Company-Daten**: `company_id` in `user_profiles` prüfen
- **Profil lädt nicht**: Browser-Konsole prüfen, DB-Tabellen prüfen

---

## 📚 Dokumentation

Alle Dateien im Projekt-Root:
- 🚀 `/SCHNELLSTART_MULTI_USER.md` - Quick Start in 3 Schritten
- 📖 `/MULTI_USER_SETUP.md` - Detaillierte Anleitung
- 📝 `/README_MULTI_USER.md` - Feature-Übersicht
- 🗄️ `/DATENBANK_SCHEMA.md` - Komplettes SQL-Schema
- 🏗️ `/SYSTEM_ARCHITEKTUR.md` - System-Diagramme
- 📋 `/WAS_WURDE_GEAENDERT.md` - Diese Datei

---

**Viel Erfolg mit Ihrem Multi-User Invox System! 🎉**

Bei Fragen: Schauen Sie in die Dokumentation oder prüfen Sie die Code-Kommentare.
