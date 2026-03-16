# Supabase Setup - Invox SaaS

## 📋 Übersicht

Diese Anleitung führt Sie Schritt für Schritt durch das komplette Setup der Invox Multi-Tenant SaaS-Architektur mit Supabase.

**Voraussetzungen:**
- Supabase Account (https://supabase.com)
- Git installiert
- Node.js 18+ installiert
- Grundkenntnisse in SQL und TypeScript

---

## 🚀 1. Supabase Projekt erstellen

### 1.1 Neues Projekt anlegen

1. Gehen Sie zu https://app.supabase.com
2. Klicken Sie auf **"New Project"**
3. Geben Sie an:
   - **Name:** invox-production
   - **Database Password:** Generieren Sie ein sicheres Passwort (speichern!)
   - **Region:** Wählen Sie die Region nächstgelegen zu Ihren Nutzern
4. Klicken Sie auf **"Create New Project"**
5. Warten Sie ~2 Minuten bis Projekt initialisiert ist

### 1.2 Projekt-Credentials notieren

Navigieren Sie zu **Settings → API**

Notieren Sie:
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (GEHEIM!)
```

⚠️ **WICHTIG:** Service Role Key NIE im Frontend verwenden!

---

## 🗄️ 2. Datenbank Setup

### 2.1 SQL Editor öffnen

1. Gehen Sie in Ihrem Supabase-Projekt zu **SQL Editor**
2. Klicken Sie auf **"New Query"**

### 2.2 Initial Schema ausführen (Migration 001)

1. Öffnen Sie `/supabase/migrations/001_initial_schema.sql`
2. Kopieren Sie den gesamten Inhalt
3. Fügen Sie ihn in den SQL Editor ein
4. Klicken Sie auf **"Run"** (oder `Ctrl+Enter`)

✅ Das erstellt:
- `companies` Tabelle
- `user_profiles` Tabelle
- `employee_invitations` Tabelle
- Basis RLS Policies

### 2.3 Production Schema ausführen (Migration 002)

1. Öffnen Sie `/supabase/migrations/002_production_schema.sql`
2. Kopieren Sie den gesamten Inhalt
3. Fügen Sie ihn in den SQL Editor ein
4. Klicken Sie auf **"Run"**

✅ Das erstellt:
- `activity_logs` Tabelle
- `customers` Tabelle
- `services` Tabelle
- `quotes` Tabelle
- `invoices` Tabelle
- Alle Indizes
- Erweiterte RLS Policies
- Helper Functions
- Triggers für `updated_at`

### 2.4 Verifizieren

Prüfen Sie im **Table Editor** ob alle Tabellen vorhanden sind:
- ✅ companies
- ✅ user_profiles
- ✅ employee_invitations
- ✅ activity_logs
- ✅ customers
- ✅ services
- ✅ quotes
- ✅ invoices

---

## 🔐 3. Authentication Setup

### 3.1 Email-Bestätigung konfigurieren

1. Gehen Sie zu **Authentication → Settings**
2. Unter **Email Auth Settings:**
   - **Enable email confirmations:** 
     - ❌ AUS für Development/Demo
     - ✅ AN für Production
   - **Enable email change confirmations:** ✅ AN

### 3.2 Password Policy

1. Bleiben Sie in **Authentication → Settings**
2. Unter **Password Settings:**
   - **Minimum password length:** 6 (oder höher für Production)
   - **Password strength:** Medium empfohlen

### 3.3 Email Templates anpassen

1. Gehen Sie zu **Authentication → Email Templates**
2. Passen Sie folgende Templates an:

**Confirm Signup:**
```html
<h2>Willkommen bei Invox!</h2>
<p>Klicken Sie auf den Link um Ihre E-Mail zu bestätigen:</p>
<p><a href="{{ .ConfirmationURL }}">E-Mail bestätigen</a></p>
```

**Invite User:**
```html
<h2>Sie wurden zu Invox eingeladen!</h2>
<p>{{ .InvitedByEmail }} hat Sie eingeladen dem Team beizutreten.</p>
<p><a href="{{ .ConfirmationURL }}">Einladung annehmen</a></p>
```

**Reset Password:**
```html
<h2>Passwort zurücksetzen</h2>
<p>Klicken Sie hier um Ihr Passwort zurückzusetzen:</p>
<p><a href="{{ .ConfirmationURL }}">Passwort zurücksetzen</a></p>
```

### 3.4 Site URL konfigurieren

1. Gehen Sie zu **Authentication → URL Configuration**
2. Fügen Sie hinzu:
   - **Site URL:** `https://ihre-domain.de` (Production)
   - **Redirect URLs:** 
     - `http://localhost:5173` (Development)
     - `https://ihre-domain.de` (Production)

---

## 🔒 4. Row Level Security (RLS) Verifizierung

### 4.1 RLS Status prüfen

Führen Sie im SQL Editor aus:

```sql
SELECT 
  tablename,
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

✅ Alle Tabellen sollten `rowsecurity = true` haben

### 4.2 Policies prüfen

```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

✅ Sie sollten mehrere Policies pro Tabelle sehen

### 4.3 Manuelle RLS Tests

**Test 1: User kann nur eigene Company sehen**

```sql
-- Als User A einloggen (Auth Token setzen)
-- Dann testen:
SELECT * FROM companies;
-- Sollte nur die eigene Company zurückgeben

SELECT * FROM customers;
-- Sollte nur Kunden der eigenen Company zurückgeben
```

**Test 2: Cross-Tenant Isolation**

```sql
-- Versuche auf andere Company zuzugreifen (sollte FAIL)
SELECT * FROM customers WHERE company_id = 'andere-company-id';
-- Sollte leer sein (RLS blockiert)
```

---

## 🛠️ 5. Edge Functions Setup (Optional)

> **Hinweis:** Edge Functions sind optional. Die aktuelle Implementierung nutzt Supabase Client-seitig mit RLS.

Wenn Sie Edge Functions nutzen möchten:

### 5.1 Supabase CLI installieren

```bash
npm install -g supabase
```

### 5.2 Mit Projekt verbinden

```bash
supabase login
supabase link --project-ref xxxxx
```

### 5.3 Functions deployen

```bash
supabase functions deploy check-license
supabase functions deploy invite-user
supabase functions deploy log-activity
```

### 5.4 Environment Variables setzen

```bash
supabase secrets set SMTP_HOST=smtp.gmail.com
supabase secrets set SMTP_USER=ihre-email@gmail.com
supabase secrets set SMTP_PASSWORD=ihr-app-passwort
```

---

## 📊 6. Initiale Daten Setup (Development)

### 6.1 Test-Company erstellen

```sql
INSERT INTO companies (
  company_name,
  owner,
  license_type,
  license_status,
  license_count,
  email
) VALUES (
  'Mustermann Elektro GmbH',
  'Max Mustermann',
  'starter',
  'active',
  3,
  'max@mustermann.de'
) RETURNING id;
```

Notieren Sie die zurückgegebene `id` → `COMPANY_ID`

### 6.2 Admin-User über Auth erstellen

1. Gehen Sie zu **Authentication → Users**
2. Klicken Sie auf **"Add User"**
3. Geben Sie an:
   - Email: `max@mustermann.de`
   - Password: `test123456`
   - Auto Confirm User: ✅
4. Klicken Sie auf **"Create User"**
5. Notieren Sie die User-ID → `USER_ID`

### 6.3 User Profile erstellen

```sql
INSERT INTO user_profiles (
  id,
  company_id,
  name,
  email,
  role,
  is_active
) VALUES (
  'USER_ID', -- Aus Schritt 6.2
  'COMPANY_ID', -- Aus Schritt 6.1
  'Max Mustermann',
  'max@mustermann.de',
  'admin',
  true
);
```

### 6.4 Test-Einladung erstellen

```sql
INSERT INTO employee_invitations (
  company_id,
  invited_by,
  email,
  role,
  token,
  expires_at
) VALUES (
  'COMPANY_ID',
  'USER_ID',
  'maria@mustermann.de',
  'user',
  'test-invitation-token-12345',
  NOW() + INTERVAL '7 days'
);
```

---

## 🎯 7. Frontend Integration

### 7.1 Environment Variables setzen

Erstellen Sie `/utils/supabase/info.tsx`:

```typescript
export const projectId = 'xxxxx'; // Aus Supabase URL
export const publicAnonKey = 'eyJhbGc...'; // Anon Key
```

### 7.2 Supabase Client konfigurieren

Die Datei `/src/lib/supabase.ts` sollte enthalten:

```typescript
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '/utils/supabase/info';

const supabaseUrl = `https://${projectId}.supabase.co`;

export const supabase = createClient(supabaseUrl, publicAnonKey);
```

### 7.3 AuthContext prüfen

Stellen Sie sicher dass `/src/lib/AuthContext.tsx`:
- ✅ Supabase Client nutzt
- ✅ User Profile lädt
- ✅ Company-Daten lädt
- ✅ Einladungen prüft
- ✅ License-Status prüft

---

## 📝 8. Lizenz-System Setup

### 8.1 License Count Management

Lizenzen werden in der `companies` Tabelle verwaltet:

```sql
-- Lizenz-Upgrade durchführen
UPDATE companies 
SET 
  license_type = 'professional',
  license_count = 10
WHERE id = 'COMPANY_ID';
```

### 8.2 License Status Management

```sql
-- Lizenz deaktivieren
UPDATE companies 
SET license_status = 'expired'
WHERE id = 'COMPANY_ID';

-- Lizenz reaktivieren
UPDATE companies 
SET license_status = 'active'
WHERE id = 'COMPANY_ID';
```

### 8.3 License Check Function testen

```sql
SELECT check_license_count('COMPANY_ID');
-- true = Platz verfügbar
-- false = Limit erreicht
```

---

## 🎨 9. Activity Logging Setup

### 9.1 Activity Log Function testen

```sql
SELECT log_activity(
  'COMPANY_ID',
  'USER_ID',
  'created',
  'customer',
  NULL,
  '{"customer_name": "Test GmbH"}'::jsonb
);
```

### 9.2 Activity Logs abfragen

```sql
-- Letzte 50 Activities
SELECT 
  al.*,
  up.name as user_name,
  up.email as user_email
FROM activity_logs al
LEFT JOIN user_profiles up ON up.id = al.user_id
WHERE al.company_id = 'COMPANY_ID'
ORDER BY al.created_at DESC
LIMIT 50;
```

### 9.3 Activity Logs in Frontend

Der Admin kann Activity Logs sehen unter:
**Einstellungen → Activity Logs** (Admin-only)

---

## 🧪 10. Testing & Verifizierung

### 10.1 Auth Flow testen

**Test 1: Neue Company-Registrierung**
1. Öffnen Sie App
2. Klicken Sie "Registrieren"
3. Geben Sie ein:
   - Name: "Anna Schmidt"
   - Firmenname: "Schmidt Sanitär GmbH"
   - Email: "anna@schmidt.de"
   - Passwort: "test123456"
4. ✅ Company sollte erstellt werden
5. ✅ User sollte als Admin eingeloggt sein
6. ✅ Dashboard sollte laden

**Test 2: Mitarbeiter-Einladung**
1. Login als Admin
2. Gehe zu Einstellungen → Benutzerverwaltung
3. Klicke "Einladen"
4. Email: "thomas@schmidt.de", Rolle: Mitarbeiter
5. ✅ Einladung sollte in DB sein
6. ✅ Status: pending

**Test 3: Einladung annehmen**
1. Logout
2. Registrieren mit "thomas@schmidt.de"
3. ✅ System sollte Einladung erkennen
4. ✅ Profil sollte mit Company verknüpft werden
5. ✅ Rolle: user
6. ✅ Einladung Status: accepted

### 10.2 RLS testen

**Test: Cross-Tenant Isolation**

```sql
-- Erstelle 2 Companies
INSERT INTO companies (company_name, owner, license_status) 
VALUES 
  ('Company A', 'Owner A', 'active'),
  ('Company B', 'Owner B', 'active')
RETURNING id;

-- Erstelle User für beide
-- ...

-- Als User A einloggen
-- Versuche Daten von Company B zu lesen
SELECT * FROM customers WHERE company_id = 'COMPANY_B_ID';
-- Sollte LEER sein (RLS blockiert)
```

### 10.3 License Limits testen

**Test: User-Limit**

```sql
-- Setze Limit auf 2
UPDATE companies SET license_count = 2 WHERE id = 'COMPANY_ID';

-- Lade 2 User ein → sollte funktionieren
-- Lade 3. User ein → sollte FEHLER geben
```

**Test: License Expired**

```sql
-- Deaktiviere Lizenz
UPDATE companies SET license_status = 'expired' WHERE id = 'COMPANY_ID';

-- Versuche einzuloggen
-- → Sollte blockiert werden mit Fehlermeldung
```

---

## 🔧 11. Wartung & Monitoring

### 11.1 Datenbank-Größe überwachen

```sql
SELECT 
  pg_size_pretty(pg_total_relation_size('companies')) as companies_size,
  pg_size_pretty(pg_total_relation_size('user_profiles')) as users_size,
  pg_size_pretty(pg_total_relation_size('activity_logs')) as logs_size,
  pg_size_pretty(pg_total_relation_size('customers')) as customers_size,
  pg_size_pretty(pg_total_relation_size('invoices')) as invoices_size;
```

### 11.2 Alte Activity Logs archivieren

```sql
-- Lösche Logs älter als 1 Jahr (optional)
DELETE FROM activity_logs 
WHERE created_at < NOW() - INTERVAL '1 year';
```

### 11.3 Abgelaufene Einladungen cleanup

```sql
-- Markiere abgelaufene Einladungen
UPDATE employee_invitations
SET status = 'expired'
WHERE status = 'pending' 
  AND expires_at < NOW();
```

### 11.4 Performance Monitoring

```sql
-- Langsame Queries identifizieren
SELECT 
  query,
  mean_exec_time,
  calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

---

## 🚨 12. Troubleshooting

### Problem: "Row Level Security Policy Violation"

**Ursache:** User hat keinen Zugriff auf Daten

**Lösung:**
1. Prüfe ob User authentifiziert ist
2. Prüfe ob `company_id` korrekt gesetzt ist
3. Prüfe ob RLS Policies existieren:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'TABELLE';
   ```

### Problem: "License Limit Reached"

**Ursache:** Mehr User als license_count erlaubt

**Lösung:**
```sql
-- Prüfe aktuelle Limits
SELECT 
  c.company_name,
  c.license_count,
  COUNT(u.id) as current_users
FROM companies c
LEFT JOIN user_profiles u ON u.company_id = c.id AND u.is_active = true
WHERE c.id = 'COMPANY_ID'
GROUP BY c.id, c.company_name, c.license_count;

-- Erhöhe Limit
UPDATE companies 
SET license_count = 5
WHERE id = 'COMPANY_ID';
```

### Problem: "Invitation Not Found"

**Ursache:** Einladung abgelaufen oder Email stimmt nicht überein

**Lösung:**
```sql
-- Prüfe Einladung
SELECT * FROM employee_invitations 
WHERE email = 'user@example.com'
ORDER BY created_at DESC;

-- Verlängere Einladung
UPDATE employee_invitations
SET expires_at = NOW() + INTERVAL '7 days'
WHERE id = 'INVITATION_ID';
```

### Problem: Login funktioniert nicht

**Checkliste:**
- [ ] User existiert in `auth.users`?
- [ ] User Profile existiert in `user_profiles`?
- [ ] `is_active = true`?
- [ ] Company hat `license_status = 'active'`?
- [ ] License nicht abgelaufen?

```sql
-- Debug User
SELECT 
  u.email,
  up.name,
  up.role,
  up.is_active,
  c.company_name,
  c.license_status,
  c.license_valid_until
FROM auth.users u
LEFT JOIN user_profiles up ON up.id = u.id
LEFT JOIN companies c ON c.id = up.company_id
WHERE u.email = 'user@example.com';
```

---

## 📦 13. Backup & Disaster Recovery

### 13.1 Automatische Backups aktivieren

1. Gehen Sie zu **Database → Backups**
2. Aktivieren Sie **Point-in-Time Recovery (PITR)**
   - Nur in Paid Plans verfügbar
   - Retention: 7 Tage empfohlen

### 13.2 Manuelle Backups

**Export gesamte Datenbank:**

1. Gehen Sie zu **Database → Backups**
2. Klicken Sie **"Create backup"**
3. Warten Sie bis fertig
4. Download über **"Download"** Button

**Alternativ via CLI:**

```bash
# Exportieren
supabase db dump -f backup.sql

# Importieren
supabase db reset --linked
psql -h db.xxxxx.supabase.co -U postgres -f backup.sql
```

### 13.3 Disaster Recovery Plan

1. **Letzte Backup-Zeit notieren**
2. **Migration-Files sichern** (`/supabase/migrations/`)
3. **Environment Variables sichern**
4. **Wiederherstellungs-Prozess testen** (Staging-Umgebung)

---

## 🎉 14. Production Checklist

Vor dem Go-Live prüfen:

### Datenbank
- [ ] Alle Migrations ausgeführt
- [ ] RLS auf allen Tabellen aktiv
- [ ] Indizes erstellt
- [ ] Backup-System konfiguriert
- [ ] Performance getestet (>1000 Datensätze)

### Authentication
- [ ] Email-Confirmation aktiviert (Production)
- [ ] Password Policy konfiguriert
- [ ] Email Templates angepasst
- [ ] Site URL + Redirect URLs gesetzt

### Security
- [ ] Service Role Key NICHT im Frontend
- [ ] RLS Policies getestet
- [ ] Cross-Tenant Tests durchgeführt
- [ ] Admin/User Permissions verifiziert
- [ ] HTTPS erzwungen

### Edge Functions (Optional)
- [ ] Alle Functions deployed
- [ ] Environment Variables gesetzt
- [ ] Error Handling implementiert
- [ ] Rate Limiting konfiguriert

### Monitoring
- [ ] Supabase Metrics aktiviert
- [ ] Error Tracking Setup (Sentry etc.)
- [ ] Activity Logs funktionieren
- [ ] Database Size Monitoring

### Frontend
- [ ] Production Build getestet
- [ ] Environment Variables gesetzt
- [ ] Error Boundaries implementiert
- [ ] Loading States überall
- [ ] Responsive Design geprüft

---

## 📞 Support & Ressourcen

### Supabase Dokumentation
- Docs: https://supabase.com/docs
- RLS Guide: https://supabase.com/docs/guides/auth/row-level-security
- Realtime: https://supabase.com/docs/guides/realtime

### Community
- Discord: https://discord.supabase.com
- GitHub: https://github.com/supabase/supabase
- Forum: https://github.com/orgs/supabase/discussions

### Invox-spezifisch
- Architecture: `/ARCHITECTURE.md`
- Setup Guide: `/SETUP_ANLEITUNG.md`
- Migrations: `/supabase/migrations/`

---

## ✅ Zusammenfassung

Sie haben nun:
- ✅ Vollständige Multi-Tenant Datenbank mit RLS
- ✅ Authentication mit Supabase Auth
- ✅ License Management System
- ✅ Invitation Flow für Teams
- ✅ Activity Logging für Compliance
- ✅ Production-ready Security
- ✅ Skalierbare Architektur

**Nächste Schritte:**
1. Testen Sie alle Flows (Registration, Invitation, Login)
2. Erstellen Sie Test-Daten
3. Führen Sie Security-Tests durch
4. Deployen Sie ins Production!

Viel Erfolg! 🚀
