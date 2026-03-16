# Database Migrations

## Übersicht

Diese Migrations erstellen die komplette Multi-Tenant SaaS-Datenbank für Invox.

## Migrations ausführen

### In Supabase Dashboard (empfohlen)

1. Gehen Sie zu **SQL Editor** in Ihrem Supabase-Projekt
2. Führen Sie die Migrations in der richtigen Reihenfolge aus:

#### 1. Initial Schema (001_initial_schema.sql)
```sql
-- Kopieren Sie den Inhalt von 001_initial_schema.sql
-- Fügen Sie ihn im SQL Editor ein
-- Klicken Sie "Run"
```

Erstellt:
- ✅ `companies` - Firmendaten mit Lizenz-System
- ✅ `user_profiles` - Benutzerprofile mit Rollen
- ✅ `employee_invitations` - Einladungssystem
- ✅ Basis RLS Policies

#### 2. Production Schema (002_production_schema.sql)
```sql
-- Kopieren Sie den Inhalt von 002_production_schema.sql
-- Fügen Sie ihn im SQL Editor ein
-- Klicken Sie "Run"
```

Erstellt:
- ✅ `activity_logs` - Audit Trail
- ✅ `customers` - Kundendaten (Multi-Tenant)
- ✅ `services` - Leistungen (Multi-Tenant)
- ✅ `quotes` - Angebote (Multi-Tenant)
- ✅ `invoices` - Rechnungen (Multi-Tenant)
- ✅ Performance-Indizes
- ✅ Erweiterte RLS Policies
- ✅ Helper Functions
- ✅ Triggers für `updated_at`

### Via Supabase CLI (alternativ)

```bash
# Projekt verbinden
supabase link --project-ref xxxxx

# Migrations ausführen
supabase db push
```

## Verifizierung

Nach Ausführung der Migrations prüfen Sie:

### 1. Tabellen existieren

```sql
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

Erwartete Tabellen:
- activity_logs
- companies
- customers
- employee_invitations
- invoices
- quotes
- services
- user_profiles

### 2. RLS ist aktiviert

```sql
SELECT 
  tablename,
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

Alle Tabellen sollten `rowsecurity = true` haben.

### 3. Indizes existieren

```sql
SELECT 
  tablename,
  indexname
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### 4. Functions existieren

```sql
SELECT 
  proname as function_name,
  pg_get_function_arguments(oid) as arguments
FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace
  AND proname IN (
    'get_user_company_id',
    'is_user_admin',
    'check_license_count',
    'log_activity',
    'update_updated_at_column'
  );
```

## Rollback

Falls Probleme auftreten:

### Einzelne Tabelle löschen

```sql
DROP TABLE IF EXISTS table_name CASCADE;
```

### Alle Tabellen löschen (VORSICHT!)

```sql
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS quotes CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS employee_invitations CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
```

Dann Migrations erneut ausführen.

## Datenbank-Schema

```
┌─────────────────┐
│   companies     │
│  (Firmen)       │
└────────┬────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐     1:1      ┌──────────────┐
│ user_profiles   │◄─────────────│  auth.users  │
│  (Benutzer)     │              │  (Supabase)  │
└─────────────────┘              └──────────────┘
         │
         │ company_id in allen Business-Tabellen
         │
         ├──────────►┌────────────────┐
         │           │   customers    │
         │           │   (Kunden)     │
         │           └────────────────┘
         │
         ├──────────►┌────────────────┐
         │           │    quotes      │
         │           │  (Angebote)    │
         │           └────────────────┘
         │
         ├──────────►┌────────────────┐
         │           │   invoices     │
         │           │  (Rechnungen)  │
         │           └────────────────┘
         │
         ├──────────►┌────────────────┐
         │           │   services     │
         │           │ (Leistungen)   │
         │           └────────────────┘
         │
         └──────────►┌────────────────┐
                     │ activity_logs  │
                     │  (Audit Trail) │
                     └────────────────┘
```

## Naming Conventions

- **Tabellen:** Plural, snake_case (z.B. `user_profiles`, `employee_invitations`)
- **Spalten:** snake_case (z.B. `company_id`, `created_at`)
- **IDs:** UUID mit `gen_random_uuid()`
- **Foreign Keys:** `_id` Suffix (z.B. `company_id`, `user_id`)
- **Timestamps:** `created_at`, `updated_at`

## RLS Policies Pattern

Jede Business-Tabelle folgt diesem Pattern:

```sql
-- SELECT: User sieht nur Daten seiner Company
CREATE POLICY "Users can view in their company"
  ON table_name FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

-- INSERT: User erstellt nur für seine Company
CREATE POLICY "Users can create in their company"
  ON table_name FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

-- UPDATE: User ändert nur Daten seiner Company
CREATE POLICY "Users can update in their company"
  ON table_name FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

-- DELETE: User löscht nur Daten seiner Company
CREATE POLICY "Users can delete in their company"
  ON table_name FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles 
      WHERE id = auth.uid()
    )
  );
```

## Helper Functions

### get_user_company_id()
Gibt die `company_id` des aktuell authentifizierten Users zurück.

```sql
SELECT get_user_company_id();
```

### is_user_admin()
Prüft ob der aktuelle User Admin ist.

```sql
SELECT is_user_admin();
```

### check_license_count(company_id)
Prüft ob noch User-Slots verfügbar sind.

```sql
SELECT check_license_count('company-id-hier');
-- true = Platz verfügbar
-- false = Limit erreicht
```

### log_activity(...)
Erstellt einen Activity Log Eintrag.

```sql
SELECT log_activity(
  'company-id',
  'user-id',
  'created',
  'customer',
  'customer-id',
  '{"customer_name": "Test GmbH"}'::jsonb
);
```

## Support

Für Fragen oder Probleme:
- Siehe `/SUPABASE_SETUP.md` für detaillierte Setup-Anleitung
- Siehe `/ARCHITECTURE.md` für Architektur-Details
- Supabase Docs: https://supabase.com/docs
