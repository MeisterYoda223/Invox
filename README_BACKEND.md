# Invox - Production-Ready SaaS Backend

## 🎯 Übersicht

Invox ist eine **Multi-Tenant SaaS-Anwendung** für Handwerksbetriebe mit:
- ✅ Strikte Datenisolation durch Row Level Security (RLS)
- ✅ Rollenbasierte Zugriffskontrolle (Admin/User)
- ✅ Lizenz-Management System
- ✅ Team-Invitation Flow
- ✅ Activity Logging für Compliance
- ✅ Production-Ready Security

---

## 📚 Dokumentation

### Schnellstart
- **[Setup-Anleitung](/SETUP_ANLEITUNG.md)** - Deutsche Anleitung für Erstsetup
- **[Supabase Setup](/SUPABASE_SETUP.md)** - Vollständige Supabase-Konfiguration

### Architektur
- **[Architektur-Übersicht](/ARCHITECTURE.md)** - Systemarchitektur mit Diagrammen
- **[Security Checklist](/SECURITY_CHECKLIST.md)** - Sicherheits-Checkliste

### Datenbank
- **[Migrations README](/supabase/migrations/README.md)** - Datenbank-Migrations
- **[001_initial_schema.sql](/supabase/migrations/001_initial_schema.sql)** - Basis-Schema
- **[002_production_schema.sql](/supabase/migrations/002_production_schema.sql)** - Production-Schema

### Backend Code
- **[Shared Response](/supabase/functions/shared/response.ts)** - API Response Format
- **[Shared Auth](/supabase/functions/shared/auth.ts)** - Authentication Helpers
- **[Shared License](/supabase/functions/shared/license.ts)** - License Checks
- **[Shared Activity](/supabase/functions/shared/activity.ts)** - Activity Logging

---

## 🗂️ Projekt-Struktur

```
invox/
├── 📄 README_BACKEND.md          ← Sie sind hier
├── 📄 SETUP_ANLEITUNG.md         ← Setup-Guide (Deutsch)
├── 📄 SUPABASE_SETUP.md          ← Supabase-Konfiguration
├── 📄 ARCHITECTURE.md            ← Architektur-Dokumentation
├── 📄 SECURITY_CHECKLIST.md     ← Sicherheits-Checkliste
│
├── 📁 supabase/
│   ├── 📁 migrations/
│   │   ├── README.md             ← Migrations-Guide
│   │   ├── 001_initial_schema.sql
│   │   └── 002_production_schema.sql
│   │
│   └── 📁 functions/
│       ├── 📁 shared/            ← Wiederverwendbare Helpers
│       │   ├── response.ts       ← API Response Format
│       │   ├── auth.ts           ← Authentication
│       │   ├── license.ts        ← License Checks
│       │   └── activity.ts       ← Activity Logging
│       │
│       ├── 📁 check-license/     ← Edge Function
│       │   └── index.ts
│       └── 📁 invite-user/       ← Edge Function
│           └── index.ts
│
└── 📁 src/
    ├── 📁 lib/
    │   ├── AuthContext.tsx       ← React Auth Context
    │   └── supabase.ts           ← Supabase Client
    │
    └── 📁 app/
        └── pages/
            └── Settings.tsx      ← Rollenbasierte Settings
```

---

## 🚀 Quick Start

### 1. Supabase Setup

```bash
# 1. Erstellen Sie ein Supabase Projekt
https://app.supabase.com

# 2. Führen Sie Migrations aus
# → Gehen Sie zum SQL Editor
# → Kopieren Sie 001_initial_schema.sql
# → Führen Sie aus
# → Kopieren Sie 002_production_schema.sql
# → Führen Sie aus
```

### 2. Environment Setup

Erstellen Sie `/utils/supabase/info.tsx`:

```typescript
export const projectId = 'xxxxx'; // Ihre Supabase Project ID
export const publicAnonKey = 'eyJhbGc...'; // Ihr Anon Key
```

### 3. Verifizierung

```sql
-- Prüfen Sie ob alle Tabellen existieren
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Prüfen Sie RLS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### 4. Test-Company erstellen

```sql
-- Erstellen Sie eine Test-Company
INSERT INTO companies (company_name, owner, license_status)
VALUES ('Test GmbH', 'Test Admin', 'active')
RETURNING id;
```

### 5. App starten

```bash
npm install
npm run dev
```

Öffnen Sie `http://localhost:5173` und registrieren Sie sich!

---

## 🏗️ Architektur-Highlights

### Multi-Tenant Isolation

```
User A (Company X) ──► RLS Filter ──► Nur Daten von Company X
User B (Company Y) ──► RLS Filter ──► Nur Daten von Company Y
```

Jede Tabelle hat:
- ✅ `company_id` Foreign Key
- ✅ RLS aktiviert
- ✅ Policies für SELECT, INSERT, UPDATE, DELETE
- ✅ Indizes auf `company_id`

### Auth Flow

```
Registrierung (Neuer Admin)
  ↓
Company wird erstellt
  ↓
User-Profil als Admin
  ↓
Auto-Login
  ↓
Dashboard
```

```
Registrierung (Eingeladener Mitarbeiter)
  ↓
System findet Einladung per Email
  ↓
User-Profil mit company_id
  ↓
Einladung → Status: accepted
  ↓
Auto-Login
  ↓
Dashboard
```

### License Check

```
Login Attempt
  ↓
Auth OK?
  ↓
License Status = active?
  ↓
License nicht expired?
  ↓
User is_active?
  ↓
✅ Dashboard

❌ Bei jedem Schritt: Error Message
```

---

## 🔒 Security Features

### 1. Row Level Security (RLS)

**Alle Tabellen** haben RLS mit Policies:

```sql
-- Beispiel: customers
CREATE POLICY "Users can view customers in their company"
  ON customers FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles 
      WHERE id = auth.uid()
    )
  );
```

### 2. Service Role Key Schutz

- ❌ **NIE im Frontend** (`/src/`)
- ✅ **Nur in Edge Functions** (`/supabase/functions/`)
- ✅ Anon Key + RLS im Frontend

### 3. Input Validation

Alle Edge Functions validieren Input:

```typescript
if (!email || !email.includes('@')) {
  return Errors.validationError('Ungültige Email');
}
```

### 4. Standardisierte Error Responses

```typescript
// Success
{ success: true, data: {...} }

// Error
{ success: false, error: "LICENSE_LIMIT_REACHED" }
```

### 5. Activity Logging

Alle wichtigen Aktionen werden geloggt:
- User Login/Logout
- Company Settings Änderungen
- User Einladungen
- Quote/Invoice Erstellung/Löschung

**Nur Admins** können Logs sehen!

---

## 📊 Datenbank-Schema

### Core Tables

| Tabelle | Zweck | RLS |
|---------|-------|-----|
| `companies` | Firmendaten + Lizenzen | ✅ |
| `user_profiles` | User-Profile + Rollen | ✅ |
| `employee_invitations` | Team-Einladungen | ✅ |
| `activity_logs` | Audit Trail | ✅ |

### Business Tables (Multi-Tenant)

| Tabelle | Zweck | company_id | RLS |
|---------|-------|------------|-----|
| `customers` | Kundendaten | ✅ | ✅ |
| `services` | Leistungen | ✅ | ✅ |
| `quotes` | Angebote | ✅ | ✅ |
| `invoices` | Rechnungen | ✅ | ✅ |

### Indizes

Performance-Optimierungen auf:
- `company_id` (alle Business-Tabellen)
- `email` (user_profiles, invitations)
- `token` (invitations)
- `created_at` (Zeitreihen)
- `status` (Filter)

---

## 🎨 Frontend Integration

### AuthContext

```typescript
import { useAuth } from '../../lib/AuthContext';

function Component() {
  const { 
    user,           // Supabase User
    userProfile,    // User Profile mit Role
    company,        // Company Daten
    isAdmin,        // Boolean
    loading,        // Boolean
    signIn,         // Function
    signUp,         // Function
    signOut,        // Function
  } = useAuth();
  
  // ...
}
```

### Rollenbasierte UI

```typescript
{isAdmin && (
  <AdminOnlyComponent />
)}

{!isAdmin && (
  <UserComponent />
)}
```

### License Check

```typescript
const { company } = useAuth();

const canInvite = company.license_count > currentUsers;

<Button disabled={!canInvite}>
  Mitarbeiter einladen
</Button>
```

---

## 🧪 Testing

### RLS Tests

```sql
-- Test 1: Cross-Tenant Isolation
-- Als User von Company A einloggen
SELECT * FROM customers WHERE company_id = 'COMPANY_B_ID';
-- MUSS leer sein!

-- Test 2: User kann nicht für andere Company erstellen
INSERT INTO customers (company_id, ...) VALUES ('COMPANY_B_ID', ...);
-- MUSS FEHLER werfen!
```

### License Tests

```sql
-- Setze Limit
UPDATE companies SET license_count = 2 WHERE id = 'COMPANY_ID';

-- Lade 3. User ein
-- → Sollte ERROR: LICENSE_LIMIT_REACHED
```

### Permission Tests

```typescript
// Als Mitarbeiter einloggen
// → Activity Logs Tab sollte NICHT sichtbar sein
// → Einladungs-Button sollte NICHT sichtbar sein
```

---

## 📈 Performance

### Datenbank-Indizes

Alle wichtigen Felder sind indiziert:

```sql
-- company_id auf allen Tabellen
CREATE INDEX idx_customers_company_id ON customers(company_id);

-- Häufige Lookups
CREATE INDEX idx_employee_invitations_token ON employee_invitations(token);

-- Zeitreihen
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);
```

### Query-Optimierung

- ✅ N+1 Queries vermieden durch JOINs
- ✅ Pagination für große Listen
- ✅ Lazy Loading für Komponenten

---

## 🛠️ Wartung

### Cleanup Jobs

```sql
-- Abgelaufene Einladungen markieren
UPDATE employee_invitations
SET status = 'expired'
WHERE status = 'pending' AND expires_at < NOW();

-- Alte Activity Logs archivieren (optional)
DELETE FROM activity_logs 
WHERE created_at < NOW() - INTERVAL '1 year';
```

### Monitoring

```sql
-- Aktive User heute
SELECT COUNT(DISTINCT user_id) 
FROM activity_logs 
WHERE created_at > NOW() - INTERVAL '24 hours';

-- Datenbank-Größe
SELECT pg_size_pretty(pg_database_size('postgres'));

-- Company-Statistiken
SELECT 
  c.company_name,
  c.license_count,
  COUNT(u.id) as user_count
FROM companies c
LEFT JOIN user_profiles u ON u.company_id = c.id
GROUP BY c.id, c.company_name, c.license_count;
```

---

## 🚨 Troubleshooting

### Problem: "Row Level Security Policy Violation"

**Lösung:**
1. Prüfe ob User eingeloggt ist
2. Prüfe ob `company_id` gesetzt ist
3. Prüfe ob RLS Policies existieren

```sql
-- Policies prüfen
SELECT * FROM pg_policies WHERE tablename = 'customers';
```

### Problem: "License Limit Reached"

**Lösung:**
```sql
-- Aktuelles Limit prüfen
SELECT license_count, 
       (SELECT COUNT(*) FROM user_profiles WHERE company_id = c.id) as current
FROM companies c
WHERE id = 'COMPANY_ID';

-- Limit erhöhen
UPDATE companies SET license_count = 5 WHERE id = 'COMPANY_ID';
```

### Problem: "Invitation Not Found"

**Lösung:**
```sql
-- Einladung prüfen
SELECT * FROM employee_invitations 
WHERE email = 'user@example.com' 
  AND status = 'pending'
  AND expires_at > NOW();

-- Verlängern
UPDATE employee_invitations
SET expires_at = NOW() + INTERVAL '7 days'
WHERE id = 'INVITATION_ID';
```

---

## 📞 Support & Ressourcen

### Interne Dokumentation
- [Setup-Anleitung](/SETUP_ANLEITUNG.md)
- [Supabase Setup](/SUPABASE_SETUP.md)
- [Architektur](/ARCHITECTURE.md)
- [Security Checklist](/SECURITY_CHECKLIST.md)

### Supabase Docs
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Edge Functions](https://supabase.com/docs/guides/functions)
- [Database](https://supabase.com/docs/guides/database)

### Community
- [Supabase Discord](https://discord.supabase.com)
- [Supabase GitHub](https://github.com/supabase/supabase)

---

## ✅ Production Checklist

Vor dem Go-Live:

### Datenbank
- [ ] Migrations ausgeführt (001 + 002)
- [ ] RLS auf allen Tabellen
- [ ] Indizes erstellt
- [ ] Backups aktiviert

### Security
- [ ] Service Role Key sicher
- [ ] RLS Tests durchgeführt
- [ ] Cross-Tenant Tests OK
- [ ] Email Confirmation aktiviert

### Frontend
- [ ] Production Build
- [ ] Error Tracking (Sentry)
- [ ] Environment Variables
- [ ] HTTPS aktiviert

### Monitoring
- [ ] Activity Logs funktionieren
- [ ] Database Size Monitoring
- [ ] Performance Monitoring

---

## 🎉 Zusammenfassung

Dieses Backend bietet:
- ✅ **Enterprise-Grade Security** durch RLS
- ✅ **Multi-Tenant Architektur** production-ready
- ✅ **Standardisierte APIs** mit Error Handling
- ✅ **Audit Trail** für Compliance
- ✅ **Skalierbare Datenbank** mit Indizes
- ✅ **Best Practices** aus dem SaaS-Bereich

**Bereit für Production!** 🚀

---

**Version:** 2.0  
**Letzte Aktualisierung:** 2026-03-16  
**Status:** Production-Ready ✅
