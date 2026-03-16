# Invox - SaaS Architektur Dokumentation

## 🏗️ Systemübersicht

Invox ist eine Multi-Tenant SaaS-Anwendung für Handwerksbetriebe mit strikter Datenisolation durch Row Level Security (RLS).

### Technologie-Stack
- **Frontend:** React + TypeScript + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Edge Functions)
- **Auth:** Supabase Auth
- **Storage:** Supabase PostgreSQL
- **API:** Supabase Edge Functions (Deno)

---

## 📊 Multi-Tenant Datenstruktur

```
┌─────────────────────────────────────────────────────────────┐
│                     MULTI-TENANT ISOLATION                  │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐
│   Supabase Auth  │  ← Zentrale Authentifizierung
│   (auth.users)   │
└────────┬─────────┘
         │
         │ 1:1
         ▼
┌──────────────────┐     1:N      ┌──────────────────┐
│  user_profiles   │◄─────────────│    companies     │
│  - id            │              │  - id            │
│  - company_id ───┼──────────────┤  - license_type  │
│  - role          │              │  - license_count │
│  - is_active     │              │  - max_users     │
└────────┬─────────┘              └──────────────────┘
         │                                  │
         │                                  │
         │              company_id in ALLEN Business-Tabellen
         │                                  │
         ▼                                  ▼
┌─────────────────────────────────────────────────────┐
│              BUSINESS DATA (Multi-Tenant)           │
├─────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐│
│  │  customers  │  │   quotes    │  │  invoices   ││
│  │- company_id │  │- company_id │  │- company_id ││
│  └─────────────┘  └─────────────┘  └─────────────┘│
│                                                     │
│  ┌─────────────┐  ┌──────────────┐                │
│  │  services   │  │ activity_logs│                │
│  │- company_id │  │- company_id  │                │
│  └─────────────┘  └──────────────┘                │
└─────────────────────────────────────────────────────┘

ROW LEVEL SECURITY (RLS):
━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Jede Tabelle hat RLS aktiviert
✅ Users sehen nur Daten ihrer company_id
✅ Strikte Isolation zwischen Companies
✅ Keine Cross-Tenant Zugriffe möglich
```

---

## 🔐 Authentication Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    REGISTRATION FLOW                         │
└──────────────────────────────────────────────────────────────┘

Neuer Admin (Firmengründer):
────────────────────────────

┌─────────┐     1. SignUp       ┌──────────────┐
│ Browser │────────────────────►│ Supabase Auth│
└─────────┘   Email+Password    └──────┬───────┘
     │                                  │
     │                                  │ 2. Create User
     │                                  ▼
     │                         ┌──────────────┐
     │                         │  auth.users  │
     │                         └──────┬───────┘
     │                                │
     │                                │ 3. Trigger
     │                                ▼
     │                         ┌──────────────────┐
     │                         │  AuthContext.tsx │
     │                         │  loadUserProfile()│
     │                         └──────┬───────────┘
     │                                │
     │                                │ 4. Prüfe: Profil existiert?
     │                                │    NEU → Prüfe Einladung
     │                                │    NEIN → Erstelle Company
     │                                ▼
     │                         ┌──────────────────┐
     │                         │ createCompany()  │
     │                         │ + Admin Profile  │
     │                         └──────┬───────────┘
     │                                │
     │                                │ 5. Company + Profile erstellt
     │                                ▼
     │◄───────────────────────────────┤
     │     6. Auto-Login              │
     │     Dashboard                  │


Eingeladener Mitarbeiter:
─────────────────────────

┌─────────┐                    ┌──────────────────┐
│  Admin  │─────────────────►  │ employee_invit.  │
└─────────┘ 1. Invite Email    │ - token          │
                                │ - email          │
                                │ - company_id     │
                                └──────────────────┘
                                         │
                                         │ 2. Mitarbeiter registriert
                                         ▼
                                ┌──────────────────┐
                                │  Supabase Auth   │
                                └──────┬───────────┘
                                       │
                                       │ 3. Trigger
                                       ▼
                                ┌──────────────────┐
                                │ loadUserProfile()│
                                │ checkInvitation()│
                                └──────┬───────────┘
                                       │
                                       │ 4. Einladung gefunden!
                                       │    → Profil mit company_id
                                       ▼
                                ┌──────────────────┐
                                │  user_profiles   │
                                │  - company_id ✓  │
                                │  - role: user    │
                                └──────────────────┘
                                       │
                                       │ 5. Auto-Login
                                       ▼
                                ┌──────────────────┐
                                │    Dashboard     │
                                └──────────────────┘
```

---

## 👥 Invitation Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    INVITATION SYSTEM                         │
└──────────────────────────────────────────────────────────────┘

ADMIN sendet Einladung:
───────────────────────

┌─────────┐                           ┌──────────────────┐
│  Admin  │─────1. Invite Email────►  │  Edge Function   │
└─────────┘   (Settings → Users)      │  (optional)      │
                                       └────────┬─────────┘
                                                │
                                                │ 2. Prüfe License
                                                ▼
                                       ┌──────────────────┐
                                       │ check_license    │
                                       │ current < limit? │
                                       └────────┬─────────┘
                                                │
                                                │ ✓ OK
                                                ▼
                                       ┌──────────────────┐
                                       │employee_invit.   │
                                       │  INSERT          │
                                       │ - token (unique) │
                                       │ - expires_at     │
                                       │ - status:pending │
                                       └────────┬─────────┘
                                                │
                                                │ 3. Email senden
                                                │    (optional)
                                                ▼
                                       ┌──────────────────┐
                                       │ /invite?token=xxx│
                                       └──────────────────┘


MITARBEITER akzeptiert:
───────────────────────

┌─────────────┐         1. Click Link        ┌──────────────────┐
│ Mitarbeiter │──────────────────────────────►│ AuthScreen.tsx   │
└─────────────┘   /invite?token=xxx          └────────┬─────────┘
                                                       │
                                                       │ 2. SignUp
                                                       ▼
                                              ┌──────────────────┐
                                              │  Supabase Auth   │
                                              │  createUser()    │
                                              └────────┬─────────┘
                                                       │
                                                       │ 3. Trigger
                                                       ▼
                                              ┌──────────────────┐
                                              │ loadUserProfile()│
                                              └────────┬─────────┘
                                                       │
                                                       │ 4. checkInvitation()
                                                       │    - email match
                                                       │    - not expired
                                                       ▼
                                              ┌──────────────────┐
                                              │  MATCH FOUND ✓   │
                                              └────────┬─────────┘
                                                       │
                                                       │ 5. Create Profile
                                                       ▼
                                              ┌──────────────────┐
                                              │  user_profiles   │
                                              │  INSERT          │
                                              │ - company_id ✓   │
                                              │ - role: user     │
                                              └────────┬─────────┘
                                                       │
                                                       │ 6. Update Invitation
                                                       ▼
                                              ┌──────────────────┐
                                              │employee_invit.   │
                                              │ UPDATE           │
                                              │ status: accepted │
                                              │ accepted_at: NOW │
                                              └────────┬─────────┘
                                                       │
                                                       │ 7. Auto-Login
                                                       ▼
                                              ┌──────────────────┐
                                              │    Dashboard     │
                                              └──────────────────┘
```

---

## 🔑 License Check Flow

```
┌──────────────────────────────────────────────────────────────┐
│                     LICENSE SYSTEM                           │
└──────────────────────────────────────────────────────────────┘

LOGIN:
──────

┌─────────┐      1. Login         ┌──────────────────┐
│  User   │──────────────────────►│  Supabase Auth   │
└─────────┘   Email + Password    └────────┬─────────┘
                                            │
                                            │ 2. Verify
                                            ▼
                                   ┌──────────────────┐
                                   │   auth.users     │
                                   └────────┬─────────┘
                                            │
                                            │ 3. Load Profile
                                            ▼
                                   ┌──────────────────┐
                                   │  user_profiles   │
                                   │ + company info   │
                                   └────────┬─────────┘
                                            │
                                            │ 4. Check License
                                            ▼
                                   ┌──────────────────┐
                    ┌──────────────│  companies       │
                    │              │ - license_status │
                    │              │ - license_valid_ │
                    │              │   until          │
                    │              └────────┬─────────┘
                    │                       │
                    │                       │ 5. Prüfung
                    ▼                       ▼
          ┌─────────────────┐    ┌──────────────────┐
          │  ❌ BLOCKED      │    │  ✅ ALLOWED      │
          │                 │    │                  │
          │ IF:             │    │ IF:              │
          │ • inactive      │    │ • active         │
          │ • expired       │    │ • not expired    │
          │ • cancelled     │    │ • user is_active │
          └─────────────────┘    └────────┬─────────┘
                 │                        │
                 ▼                        ▼
          ┌─────────────────┐    ┌──────────────────┐
          │ Error Message   │    │   Dashboard      │
          │ "Keine aktive   │    │                  │
          │  Lizenz"        │    │  + Activity Log  │
          └─────────────────┘    └──────────────────┘


INVITE:
───────

┌─────────┐      1. Invite User    ┌──────────────────┐
│  Admin  │───────────────────────►│   Frontend       │
└─────────┘                         └────────┬─────────┘
                                             │
                                             │ 2. Check License
                                             ▼
                                    ┌──────────────────┐
                                    │   companies      │
                                    │ - license_count  │
                                    └────────┬─────────┘
                                             │
                                             │ 3. Count Users
                                             ▼
                                    ┌──────────────────┐
                    ┌───────────────│  user_profiles   │
                    │               │  COUNT(active)   │
                    │               └────────┬─────────┘
                    │                        │
                    │                        │ 4. Compare
                    ▼                        ▼
          ┌─────────────────┐     ┌──────────────────┐
          │  ❌ LIMIT        │     │  ✅ AVAILABLE    │
          │  REACHED        │     │                  │
          │                 │     │ current_users <  │
          │ current >= max  │     │ license_count    │
          └─────────────────┘     └────────┬─────────┘
                 │                         │
                 ▼                         ▼
          ┌─────────────────┐     ┌──────────────────┐
          │ Button disabled │     │ Create Invitation│
          │ Error Toast     │     │                  │
          └─────────────────┘     └──────────────────┘
```

---

## 🛡️ Row Level Security (RLS)

### Grundprinzip
Jede Tabelle hat aktivierte RLS mit Policies die sicherstellen:
- **Users sehen nur Daten ihrer Company** (`company_id` Matching)
- **Admins haben erweiterte Rechte** innerhalb ihrer Company
- **Keine Cross-Tenant Zugriffe möglich**

### RLS Policy Pattern

```sql
-- BEISPIEL: customers Tabelle

-- SELECT: User sieht nur Kunden seiner Company
CREATE POLICY "Users can view customers in their company"
  ON customers FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

-- INSERT: User kann nur für seine Company erstellen
CREATE POLICY "Users can create customers in their company"
  ON customers FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

-- UPDATE: User kann nur eigene Company-Daten ändern
CREATE POLICY "Users can update customers in their company"
  ON customers FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

-- DELETE: User kann nur eigene Company-Daten löschen
CREATE POLICY "Users can delete customers in their company"
  ON customers FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles 
      WHERE id = auth.uid()
    )
  );
```

### Admin-only Policies

```sql
-- BEISPIEL: activity_logs (nur für Admins)

CREATE POLICY "Admins can view activity logs in their company"
  ON activity_logs FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

---

## 🎯 API Response Format

Alle Edge Functions und API-Calls nutzen ein standardisiertes Format:

### Success Response
```typescript
{
  success: true,
  data: {
    // Response data hier
  }
}
```

### Error Response
```typescript
{
  success: false,
  error: "ERROR_CODE",
  message: "Human-readable error message (optional)"
}
```

### Error Codes
```typescript
// Auth
UNAUTHORIZED
FORBIDDEN
INVALID_TOKEN

// License
LICENSE_INACTIVE
LICENSE_EXPIRED
LICENSE_LIMIT_REACHED

// Invitation
INVITATION_NOT_FOUND
INVITATION_EXPIRED
INVITATION_ALREADY_USED
EMAIL_MISMATCH

// General
VALIDATION_ERROR
DATABASE_ERROR
NOT_FOUND
ALREADY_EXISTS
INTERNAL_ERROR
```

---

## 📁 Datenbank-Struktur

### Core Tables

```
companies (Unternehmen)
├── id (uuid, PK)
├── company_name
├── license_type (starter|professional|enterprise)
├── license_status (active|expired|cancelled)
├── license_count (max users)
└── ... (address, tax, banking, settings)

user_profiles (Benutzer)
├── id (uuid, PK, FK → auth.users)
├── company_id (uuid, FK → companies)
├── role (admin|user)
├── is_active (boolean)
└── ... (name, email, avatar)

employee_invitations (Einladungen)
├── id (uuid, PK)
├── company_id (uuid, FK → companies)
├── email
├── token (unique)
├── status (pending|accepted|expired)
└── expires_at

activity_logs (Audit Trail)
├── id (uuid, PK)
├── company_id (uuid, FK → companies)
├── user_id (uuid, FK → user_profiles)
├── action (created|updated|deleted|...)
├── entity_type (quote|invoice|customer|...)
├── entity_id (uuid)
└── metadata (jsonb)
```

### Business Tables (Multi-Tenant)

Alle Business-Tabellen haben:
- ✅ `company_id` (uuid, FK → companies)
- ✅ RLS Policies aktiviert
- ✅ Indizes auf `company_id`
- ✅ `created_at` und `updated_at` Timestamps

```
customers
quotes
invoices
services
```

---

## 🚀 Performance-Optimierungen

### Datenbank-Indizes

```sql
-- Company-basierte Queries
CREATE INDEX idx_customers_company_id ON customers(company_id);
CREATE INDEX idx_quotes_company_id ON quotes(company_id);
CREATE INDEX idx_invoices_company_id ON invoices(company_id);

-- Häufige Lookups
CREATE INDEX idx_employee_invitations_token ON employee_invitations(token);
CREATE INDEX idx_employee_invitations_email ON employee_invitations(email);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);

-- Zeitbasierte Queries
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX idx_quotes_created_at ON quotes(created_at DESC);
CREATE INDEX idx_invoices_invoice_date ON invoices(invoice_date DESC);

-- Status-Filter
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_user_profiles_is_active ON user_profiles(is_active);

-- Unique Constraints
CREATE UNIQUE INDEX idx_customers_company_customer_number 
  ON customers(company_id, customer_number);

CREATE UNIQUE INDEX idx_employee_invitations_unique_pending 
  ON employee_invitations(company_id, email, status) 
  WHERE status = 'pending';
```

---

## 🔒 Security Best Practices

### 1. **Strikte Datenisolation**
- ✅ RLS auf allen Tabellen aktiviert
- ✅ `company_id` in allen Business-Tabellen
- ✅ Policies prüfen immer `company_id` Match
- ✅ Keine direkte ID-basierte Queries ohne Company-Check

### 2. **Service Role Key Schutz**
- ❌ NIE im Frontend verwenden
- ✅ Nur in Edge Functions
- ✅ Nur für System-Operations (User-Erstellung, etc.)

### 3. **Anon Key für Frontend**
- ✅ RLS schützt Daten
- ✅ User-Context durch Auth Token
- ✅ Policies erzwingen Berechtigungen

### 4. **Invitation Token Sicherheit**
- ✅ Unique Token-Generation
- ✅ Expiration Check (7 Tage)
- ✅ Single-use (Status Update)
- ✅ Email-Matching erforderlich

### 5. **Audit Trail**
- ✅ Activity Logs für wichtige Aktionen
- ✅ IP-Adresse und User-Agent speichern
- ✅ Nur Admins sehen Logs
- ✅ Logs können nicht gelöscht werden (nur INSERT Policy)

---

## 📦 Deployment Checkliste

### Datenbank
- [ ] Migrations ausgeführt (001 + 002)
- [ ] RLS auf allen Tabellen aktiviert
- [ ] Indizes erstellt
- [ ] Helper Functions deployed
- [ ] Triggers aktiviert

### Authentication
- [ ] Email-Confirmation konfiguriert (oder deaktiviert für Demo)
- [ ] Password-Policy festgelegt
- [ ] Email-Templates angepasst

### Edge Functions
- [ ] Environment Variables gesetzt
- [ ] CORS konfiguriert
- [ ] Error Handling implementiert
- [ ] Activity Logging integriert

### Frontend
- [ ] Supabase URL + Anon Key konfiguriert
- [ ] AuthContext integriert
- [ ] License Checks implementiert
- [ ] RLS-kompatible Queries

### Security
- [ ] Service Role Key sicher gespeichert
- [ ] RLS Policies getestet
- [ ] Cross-Tenant Tests durchgeführt
- [ ] Admin/User Permission Tests

---

## 🎓 Entwickler-Guidelines

### 1. **Neue Business-Tabelle hinzufügen**

```sql
-- TEMPLATE für neue Multi-Tenant Tabelle

CREATE TABLE my_new_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Your fields here
  name TEXT NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index
CREATE INDEX idx_my_new_table_company_id ON my_new_table(company_id);
CREATE INDEX idx_my_new_table_created_at ON my_new_table(created_at DESC);

-- RLS aktivieren
ALTER TABLE my_new_table ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view in their company"
  ON my_new_table FOR SELECT
  USING (company_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create in their company"
  ON my_new_table FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update in their company"
  ON my_new_table FOR UPDATE
  USING (company_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete in their company"
  ON my_new_table FOR DELETE
  USING (company_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid()));

-- Trigger für updated_at
CREATE TRIGGER update_my_new_table_updated_at 
  BEFORE UPDATE ON my_new_table
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2. **Activity Logging integrieren**

```typescript
import { logActivity } from '/supabase/functions/shared/activity.ts';

// Nach erfolgreichem CREATE
await logActivity(supabase, {
  companyId: user.company_id,
  userId: user.id,
  action: 'created',
  entityType: 'quote',
  entityId: newQuote.id,
  metadata: { quote_number: newQuote.quote_number },
  ipAddress: getIpAddress(request),
  userAgent: getUserAgent(request),
});
```

### 3. **License Check vor Invitation**

```typescript
import { checkLicense } from '/supabase/functions/shared/license.ts';

const licenseInfo = await checkLicense(supabase, user.company_id);

if (!licenseInfo.can_invite) {
  return Errors.licenseLimitReached(
    `Limit erreicht: ${licenseInfo.current_users}/${licenseInfo.license_count} Benutzer`
  );
}
```

---

## 📞 Support & Debugging

### Häufige Fehler

**1. "Row Level Security Policy Violation"**
- ✅ Prüfe ob RLS aktiviert ist
- ✅ Prüfe ob Policies existieren
- ✅ Prüfe ob User authentifiziert ist
- ✅ Prüfe ob `company_id` korrekt gesetzt ist

**2. "License Limit Reached"**
- ✅ Prüfe `license_count` in `companies`
- ✅ Zähle aktive User in `user_profiles`
- ✅ Prüfe `license_status` = 'active'

**3. "Invitation Not Found"**
- ✅ Prüfe Token in URL
- ✅ Prüfe `expires_at` Datum
- ✅ Prüfe `status` = 'pending'
- ✅ Prüfe Email-Match

### Debugging-Queries

```sql
-- User's Company Info
SELECT u.*, c.* 
FROM user_profiles u
JOIN companies c ON c.id = u.company_id
WHERE u.id = auth.uid();

-- Lizenz-Status prüfen
SELECT 
  company_name,
  license_status,
  license_count,
  (SELECT COUNT(*) FROM user_profiles WHERE company_id = c.id AND is_active = true) as current_users
FROM companies c
WHERE id = 'company-id-hier';

-- Activity Logs für Company
SELECT * FROM activity_logs
WHERE company_id = 'company-id-hier'
ORDER BY created_at DESC
LIMIT 50;
```

---

## 🎉 Zusammenfassung

Diese Architektur bietet:
- ✅ **Multi-Tenant Sicherheit** durch RLS
- ✅ **Skalierbare Datenbank** mit Indizes
- ✅ **Standardisierte API** Responses
- ✅ **Audit Trail** für Compliance
- ✅ **License Management** System
- ✅ **Invitation Flow** für Teamwork
- ✅ **Production-Ready** Best Practices
