# Invox Multi-User Datenbank-Schema

## Übersicht
Dieses Dokument beschreibt das Datenbank-Schema für das Multi-User-System von Invox.

## Supabase Tabellen

### 1. companies (Unternehmen)
```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Firmendaten
  company_name TEXT NOT NULL,
  owner TEXT,
  street TEXT,
  zip TEXT,
  city TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  
  -- Logo (optional)
  logo_url TEXT,
  
  -- Lizenz-Informationen
  license_type TEXT DEFAULT 'basic', -- 'basic', 'professional', 'enterprise'
  max_users INTEGER DEFAULT 1, -- Maximale Anzahl User
  
  -- Dokument-Einstellungen
  next_quote_number TEXT DEFAULT 'ANG-2026-001',
  next_invoice_number TEXT DEFAULT 'RE-2026-001',
  payment_terms INTEGER DEFAULT 14,
  quote_footer TEXT,
  invoice_footer TEXT,
  
  -- Steuerinformationen
  vat_id TEXT,
  tax_number TEXT,
  default_vat_rate DECIMAL DEFAULT 19,
  bank_name TEXT,
  iban TEXT,
  bic TEXT
);

-- Index für schnelle Suche
CREATE INDEX idx_companies_created_at ON companies(created_at);
```

### 2. user_profiles (Benutzerprofile)
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Zuordnung zum Unternehmen
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Persönliche Daten
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  
  -- Rolle im Unternehmen
  role TEXT DEFAULT 'user', -- 'admin' oder 'user'
  
  -- Status
  is_active BOOLEAN DEFAULT true
);

-- Indexes
CREATE INDEX idx_user_profiles_company_id ON user_profiles(company_id);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);

-- RLS (Row Level Security) Policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- User können ihr eigenes Profil sehen und bearbeiten
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- User können Profile im gleichen Unternehmen sehen
CREATE POLICY "Users can view company profiles"
  ON user_profiles FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Nur Admins können neue User hinzufügen
CREATE POLICY "Admins can insert users"
  ON user_profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
      AND company_id = user_profiles.company_id
    )
  );
```

### 3. companies RLS Policies
```sql
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- User können ihr Unternehmen sehen
CREATE POLICY "Users can view own company"
  ON companies FOR SELECT
  USING (
    id IN (
      SELECT company_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Nur Admins können Unternehmensdaten ändern
CREATE POLICY "Admins can update company"
  ON companies FOR UPDATE
  USING (
    id IN (
      SELECT company_id FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Neue Unternehmen können erstellt werden (bei Registrierung)
CREATE POLICY "Anyone can create company"
  ON companies FOR INSERT
  WITH CHECK (true);
```

## Edge Functions Anpassungen

Die bestehende `kv_store` Tabelle kann für zusätzliche App-Daten verwendet werden (Angebote, Rechnungen, Kunden, etc.), aber die User- und Company-Daten sollten in den strukturierten Tabellen oben gespeichert werden.

## Datenbank-Setup SQL

Führen Sie folgendes SQL in Ihrer Supabase SQL Editor aus:

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

## Migrations-Workflow

1. Kopieren Sie das obige SQL
2. Öffnen Sie Ihren Supabase Dashboard → SQL Editor
3. Fügen Sie das SQL ein und führen Sie es aus
4. Bestätigen Sie, dass die Tabellen erstellt wurden

## Lizenz-Typen

- **Basic**: 1 User (Einzelunternehmer)
- **Professional**: 5 Users
- **Enterprise**: Unbegrenzte Users

Die Lizenzprüfung erfolgt beim Hinzufügen neuer Benutzer in der Anwendung.
