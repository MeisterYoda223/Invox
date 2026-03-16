# Multi-User System Setup Anleitung

## Übersicht
Ihr Invox-System wurde erfolgreich um ein vollständiges Multi-User-System erweitert! 

## Was wurde implementiert?

### 1. **Rollen-basierte Benutzerverw altung**
- **Administrator**: Kann Firmendaten ändern, Benutzer hinzufügen/entfernen, alle Einstellungen verwalten
- **Benutzer**: Kann Firmendaten einsehen, aber nicht ändern. Kann nur eigene Profildaten bearbeiten

### 2. **Automatische Company-Erstellung**
- Bei der Registrierung wird automatisch ein Unternehmen erstellt
- Der erste User wird automatisch zum Administrator
- Die Unternehmensdaten werden zentral gespeichert

### 3. **Benutzerverwaltung**
- Admins können neue Benutzer hinzufügen
- Lizenzlimits werden automatisch geprüft
- Benutzer können nur von Admins gelöscht werden
- Jeder User kann sein eigenes Profil bearbeiten

### 4. **Erweiterte Einstellungen-Seite**
Mit folgenden Tabs:
- **Firma** (nur Admin): Firmendaten bearbeiten
- **Dokumente** (nur Admin): Dokument-Einstellungen
- **Steuer** (nur Admin): Steuerinformationen
- **Benutzer** (nur Admin): Benutzerverwaltung
- **Mein Profil** (alle User): Eigene Daten bearbeiten

## Nächste Schritte

### Schritt 1: Datenbank-Tabellen erstellen

1. Öffnen Sie Ihr **Supabase Dashboard**: https://supabase.com/dashboard
2. Wählen Sie Ihr Projekt aus
3. Gehen Sie zu **SQL Editor** (im linken Menü)
4. Kopieren Sie das folgende SQL und führen Sie es aus:

```sql
-- Unternehmen-Tabelle
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  company_name TEXT NOT NULL,
  owner TEXT,
  street TEXT,
  zip TEXT,
  city TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  logo_url TEXT,
  license_type TEXT DEFAULT 'basic',
  max_users INTEGER DEFAULT 1,
  next_quote_number TEXT DEFAULT 'ANG-2026-001',
  next_invoice_number TEXT DEFAULT 'RE-2026-001',
  payment_terms INTEGER DEFAULT 14,
  quote_footer TEXT,
  invoice_footer TEXT,
  vat_id TEXT,
  tax_number TEXT,
  default_vat_rate DECIMAL DEFAULT 19,
  bank_name TEXT,
  iban TEXT,
  bic TEXT
);

CREATE INDEX idx_companies_created_at ON companies(created_at);

-- Benutzerprofile-Tabelle
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_user_profiles_company_id ON user_profiles(company_id);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);

-- RLS aktivieren
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Company Policies
CREATE POLICY "Users can view own company"
  ON companies FOR SELECT
  USING (
    id IN (
      SELECT company_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can update company"
  ON companies FOR UPDATE
  USING (
    id IN (
      SELECT company_id FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Anyone can create company"
  ON companies FOR INSERT
  WITH CHECK (true);

-- User Profile Policies
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can view company profiles"
  ON user_profiles FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Trigger für updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

5. Klicken Sie auf **Run** (oder drücken Sie Ctrl+Enter)
6. Überprüfen Sie, dass keine Fehler aufgetreten sind

### Schritt 2: Bestehende Benutzer migrieren (falls vorhanden)

Wenn Sie bereits Benutzer in Ihrer Datenbank haben, müssen Sie diese in das neue System migrieren.

**Option A: Neuer Start (empfohlen für Testing)**
- Löschen Sie alle bestehenden User in **Authentication > Users**
- Registrieren Sie sich neu - Sie werden automatisch Admin

**Option B: Manuelle Migration**
Führen Sie für jeden bestehenden User folgendes SQL aus:

```sql
-- Erstelle Company für User (ersetzen Sie die Werte)
INSERT INTO companies (company_name, owner, email, license_type, max_users)
VALUES ('Mein Unternehmen', 'Ihr Name', 'ihre@email.de', 'basic', 1)
RETURNING id;

-- Erstelle User Profile (ersetzen Sie user_id und company_id)
INSERT INTO user_profiles (id, company_id, name, email, role, is_active)
VALUES (
  'USER_ID_AUS_AUTH_USERS',  -- UUID des Users aus auth.users
  'COMPANY_ID_VON_OBEN',      -- UUID der Company von oben
  'Ihr Name',
  'ihre@email.de',
  'admin',                     -- 'admin' oder 'user'
  true
);
```

### Schritt 3: Testen

1. **Registrieren Sie einen neuen Account**
   - Gehen Sie zur Login-Seite
   - Klicken Sie auf "Registrieren"
   - Füllen Sie alle Felder aus (Name, Firmenname, Email, Passwort)
   - Nach erfolgreicher Registrierung werden Sie automatisch angemeldet

2. **Überprüfen Sie die Rolle**
   - Gehen Sie zu **Einstellungen**
   - Sie sollten alle 5 Tabs sehen (Firma, Dokumente, Steuer, Benutzer, Mein Profil)
   - Dies bedeutet, Sie sind Administrator

3. **Fügen Sie einen neuen Benutzer hinzu**
   - Gehen Sie zu **Einstellungen > Benutzer**
   - Klicken Sie auf "Benutzer hinzufügen"
   - Füllen Sie die Daten aus
   - Der neue Benutzer erhält die Rolle "Benutzer"

4. **Testen Sie die Berechtigungen**
   - Melden Sie sich als neuer Benutzer an
   - Gehen Sie zu **Einstellungen**
   - Sie sollten nur den Tab "Mein Profil" sehen
   - Versuchen Sie, Firmendaten zu ändern - dies sollte nicht möglich sein

## Lizenz-Typen

Das System unterstützt verschiedene Lizenz-Typen:

| Lizenz | Max. Benutzer | Beschreibung |
|--------|---------------|--------------|
| Basic | 1 | Einzelunternehmer |
| Professional | 5 | Kleine Teams |
| Enterprise | 999 | Große Teams |

Um die Lizenz zu ändern, führen Sie als Admin folgendes SQL aus:

```sql
UPDATE companies 
SET license_type = 'professional', 
    max_users = 5 
WHERE id = 'IHRE_COMPANY_ID';
```

## Sicherheitshinweise

### Row Level Security (RLS)
- Alle Tabellen sind mit RLS gesichert
- Benutzer können nur Daten ihres eigenen Unternehmens sehen
- Admins können Unternehmensdaten ändern, normale User nicht

### Rollen-Prüfung
- Die Rolle wird im AuthContext geladen und ist überall verfügbar
- `isAdmin` zeigt an, ob der aktuelle User Administrator ist
- UI-Elemente werden basierend auf der Rolle ein-/ausgeblendet

### Datenschutz
- Passwörter werden von Supabase Auth sicher verwaltet
- Benutzer können nur ihre eigenen Profildaten sehen und bearbeiten
- Email-Änderungen erfordern Bestätigung

## Troubleshooting

### "Keine Berechtigung" Fehler
- Überprüfen Sie, ob Sie als Admin angemeldet sind
- Prüfen Sie die RLS Policies in Supabase
- Stellen Sie sicher, dass Ihre Rolle korrekt in `user_profiles` gesetzt ist

### User kann keine Firmendaten sehen
- Überprüfen Sie, ob `company_id` in `user_profiles` korrekt gesetzt ist
- Prüfen Sie die RLS Policy "Users can view own company"

### Lizenzlimit wird nicht geprüft
- Stellen Sie sicher, dass `max_users` in der `companies` Tabelle korrekt gesetzt ist
- Der Wert sollte mindestens 1 sein

### User Profile wird nicht geladen
- Öffnen Sie die Browser-Konsole (F12)
- Suchen Sie nach Fehlern beim Laden
- Überprüfen Sie, ob der User einen Eintrag in `user_profiles` hat

## Weitere Informationen

Weitere Details zum Datenbank-Schema finden Sie in `/DATENBANK_SCHEMA.md`.

## Support

Bei Problemen:
1. Überprüfen Sie die Browser-Konsole auf Fehlermeldungen
2. Prüfen Sie die Supabase Logs in Ihrem Dashboard
3. Stellen Sie sicher, dass alle SQL-Befehle erfolgreich ausgeführt wurden
4. Überprüfen Sie die RLS Policies in Supabase

---

**Viel Erfolg mit Ihrem Multi-User Invox System! 🎉**
