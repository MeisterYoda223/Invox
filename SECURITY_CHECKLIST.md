# Security Checklist - Invox SaaS

## 🔒 Multi-Tenant Sicherheit

### ✅ Datenbank-Level

- [ ] **RLS aktiviert auf ALLEN Tabellen**
  ```sql
  SELECT tablename, rowsecurity 
  FROM pg_tables 
  WHERE schemaname = 'public' AND rowsecurity = false;
  -- Sollte LEER sein!
  ```

- [ ] **company_id in allen Business-Tabellen**
  - companies ✓ (ist die Company selbst)
  - user_profiles ✓
  - customers ✓
  - services ✓
  - quotes ✓
  - invoices ✓
  - activity_logs ✓
  - employee_invitations ✓

- [ ] **RLS Policies für jede Tabelle**
  - SELECT Policy (View)
  - INSERT Policy (Create)
  - UPDATE Policy (Update)
  - DELETE Policy (Delete)

- [ ] **Foreign Keys mit CASCADE**
  ```sql
  -- Beispiel:
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE
  ```

### ✅ Authentication

- [ ] **Service Role Key NIEMALS im Frontend**
  - ❌ Nicht in `/src/` Ordner
  - ❌ Nicht in Client-seitigem Code
  - ✅ Nur in Edge Functions
  - ✅ Nur in `/supabase/functions/`

- [ ] **Anon Key im Frontend**
  - ✅ RLS schützt die Daten
  - ✅ User Context durch Auth Token
  - ✅ In `/utils/supabase/info.tsx`

- [ ] **Email Confirmation aktiviert** (Production)
  - Supabase Dashboard → Authentication → Settings
  - "Enable email confirmations" = ON

- [ ] **Password Policy**
  - Minimum 8 Zeichen empfohlen
  - Passwort-Komplexität: Medium+

### ✅ Cross-Tenant Isolation

- [ ] **Test: User A sieht keine Daten von Company B**
  ```sql
  -- Als User A einloggen
  SELECT * FROM customers WHERE company_id = 'COMPANY_B_ID';
  -- MUSS LEER sein!
  ```

- [ ] **Test: User A kann keine Daten für Company B erstellen**
  ```sql
  -- Als User A einloggen
  INSERT INTO customers (company_id, ...) VALUES ('COMPANY_B_ID', ...);
  -- MUSS FEHLER werfen!
  ```

- [ ] **Test: Admin kann nur eigene Company verwalten**
  ```sql
  -- Als Admin von Company A
  UPDATE companies SET license_count = 100 WHERE id = 'COMPANY_B_ID';
  -- MUSS FEHLER werfen!
  ```

### ✅ Invitation Security

- [ ] **Token ist unique**
  ```sql
  CREATE UNIQUE INDEX ON employee_invitations(token);
  ```

- [ ] **Expiration Check**
  - Standard: 7 Tage Gültigkeit
  - Check: `expires_at > NOW()`

- [ ] **Email Matching erforderlich**
  - Bei Registrierung muss Email übereinstimmen

- [ ] **Single-Use Token**
  - Status wird auf 'accepted' gesetzt
  - Policy verhindert Wiederverwendung

### ✅ License System

- [ ] **User Limit erzwungen**
  ```typescript
  if (currentUsers >= company.license_count) {
    throw new Error('LICENSE_LIMIT_REACHED');
  }
  ```

- [ ] **License Status Check bei Login**
  ```typescript
  if (company.license_status !== 'active') {
    throw new Error('LICENSE_INACTIVE');
  }
  ```

- [ ] **Expiration Check**
  ```typescript
  if (company.license_valid_until < new Date()) {
    throw new Error('LICENSE_EXPIRED');
  }
  ```

- [ ] **Frontend UND Backend Prüfung**
  - Frontend: Button disabled
  - Backend: API wirft Fehler

---

## 🛡️ API Security

### ✅ Edge Functions

- [ ] **CORS konfiguriert**
  ```typescript
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, ...',
  }
  ```

- [ ] **Authentication in jeder Function**
  ```typescript
  const user = await authenticateUser(supabase, accessToken);
  if (!user) return Errors.unauthorized();
  ```

- [ ] **Admin-Check wo nötig**
  ```typescript
  if (!isAdmin(user)) return Errors.forbidden();
  ```

- [ ] **Input Validation**
  ```typescript
  if (!email || !email.includes('@')) {
    return Errors.validationError('Ungültige Email');
  }
  ```

- [ ] **Error Handling**
  ```typescript
  try {
    // ...
  } catch (error) {
    console.error('Error:', error);
    return Errors.internalError(error.message);
  }
  ```

### ✅ Response Format

- [ ] **Standardisierte Responses**
  ```typescript
  // Success
  { success: true, data: {...} }
  
  // Error
  { success: false, error: "ERROR_CODE", message: "..." }
  ```

- [ ] **Niemals sensitive Daten in Errors**
  - ❌ Keine Passwörter
  - ❌ Keine Tokens
  - ❌ Keine internen IDs

---

## 📊 Performance & Monitoring

### ✅ Datenbank-Indizes

- [ ] **company_id Indizes auf allen Business-Tabellen**
  ```sql
  CREATE INDEX idx_customers_company_id ON customers(company_id);
  CREATE INDEX idx_quotes_company_id ON quotes(company_id);
  -- etc.
  ```

- [ ] **Häufige Lookups indiziert**
  ```sql
  CREATE INDEX idx_employee_invitations_token ON employee_invitations(token);
  CREATE INDEX idx_user_profiles_email ON user_profiles(email);
  ```

- [ ] **created_at für Zeitreihen**
  ```sql
  CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);
  ```

### ✅ Activity Logging

- [ ] **Wichtige Aktionen geloggt**
  - User Login
  - User Logout
  - Company Settings geändert
  - User eingeladen
  - Quote erstellt/gelöscht
  - Invoice erstellt/gelöscht
  - Customer erstellt/gelöscht

- [ ] **Nur Admins sehen Logs**
  ```sql
  CREATE POLICY "Admins can view activity logs"
    ON activity_logs FOR SELECT
    USING (... AND role = 'admin');
  ```

- [ ] **Logs können NICHT gelöscht werden**
  ```sql
  -- Keine DELETE Policy für activity_logs!
  ```

---

## 🚀 Production Deployment

### ✅ Environment Variables

- [ ] **SUPABASE_URL** gesetzt
- [ ] **SUPABASE_ANON_KEY** gesetzt
- [ ] **SUPABASE_SERVICE_ROLE_KEY** sicher gespeichert
  - ❌ Nicht in Git
  - ❌ Nicht im Frontend
  - ✅ Nur in Edge Functions Environment

### ✅ Frontend

- [ ] **Production Build getestet**
  ```bash
  npm run build
  npm run preview
  ```

- [ ] **Error Boundaries implementiert**
  - Catch-all für React Fehler
  - User-freundliche Fehlermeldungen

- [ ] **Loading States überall**
  - Skeleton Screens
  - Spinner
  - Disabled Buttons während API Calls

- [ ] **HTTPS erzwungen**
  - Redirect HTTP → HTTPS
  - Secure Cookies

### ✅ Datenbank

- [ ] **Backups aktiviert**
  - Supabase Dashboard → Database → Backups
  - PITR aktiviert (Paid Plan)

- [ ] **Connection Pooling konfiguriert**
  - Standard: OK für <1000 connections
  - Bei hoher Last: Pgbouncer aktivieren

- [ ] **Performance Monitoring**
  ```sql
  -- Langsame Queries finden
  SELECT query, mean_exec_time, calls
  FROM pg_stat_statements
  ORDER BY mean_exec_time DESC
  LIMIT 10;
  ```

### ✅ Monitoring & Alerts

- [ ] **Error Tracking Setup** (z.B. Sentry)
  - Frontend Errors
  - Backend Errors
  - Edge Function Errors

- [ ] **Database Size Monitoring**
  ```sql
  SELECT 
    pg_size_pretty(pg_database_size('postgres')) as total_size;
  ```

- [ ] **Active Users Tracking**
  ```sql
  SELECT 
    COUNT(DISTINCT user_id) as active_users_today
  FROM activity_logs
  WHERE created_at > NOW() - INTERVAL '24 hours';
  ```

---

## 🔍 Testing Checklist

### ✅ Funktionale Tests

- [ ] **Neue Company Registration**
  - [ ] Company wird erstellt
  - [ ] Admin-Profil wird erstellt
  - [ ] License = active
  - [ ] Auto-Login funktioniert

- [ ] **Mitarbeiter Invitation**
  - [ ] Einladung wird erstellt
  - [ ] Token ist unique
  - [ ] Expires_at = +7 Tage
  - [ ] License Count wird geprüft

- [ ] **Mitarbeiter Registration**
  - [ ] Einladung wird gefunden
  - [ ] Profil mit company_id erstellt
  - [ ] Rolle = user
  - [ ] Einladung status = accepted

- [ ] **Login**
  - [ ] Auth funktioniert
  - [ ] Profile wird geladen
  - [ ] Company wird geladen
  - [ ] License wird geprüft

### ✅ Security Tests

- [ ] **Cross-Tenant Isolation**
  - [ ] User A sieht keine Daten von Company B
  - [ ] User A kann keine Daten für Company B erstellen

- [ ] **Permission Tests**
  - [ ] Mitarbeiter sieht keine Activity Logs
  - [ ] Mitarbeiter kann keine User einladen
  - [ ] Mitarbeiter kann Company Settings nicht ändern
  - [ ] Admin kann alles in seiner Company

- [ ] **License Enforcement**
  - [ ] Login blockiert bei inactive License
  - [ ] Login blockiert bei expired License
  - [ ] Invite blockiert bei erreichten Limit

### ✅ Performance Tests

- [ ] **Datenbank Performance**
  - [ ] Queries mit 1000+ Datensätzen testen
  - [ ] N+1 Queries vermieden
  - [ ] Indizes werden genutzt

- [ ] **Frontend Performance**
  - [ ] Lighthouse Score > 90
  - [ ] Lazy Loading für schwere Komponenten
  - [ ] Images optimiert

---

## 📋 Go-Live Checklist

### Vor dem Launch:

- [ ] Alle Migrations ausgeführt
- [ ] RLS auf allen Tabellen aktiv
- [ ] Security Tests durchgeführt
- [ ] Performance Tests durchgeführt
- [ ] Backups aktiviert
- [ ] Error Tracking Setup
- [ ] Email Confirmation aktiviert
- [ ] Production Environment Variables gesetzt
- [ ] HTTPS aktiviert
- [ ] Domain konfiguriert

### Nach dem Launch:

- [ ] Monitoring aktiv
- [ ] Activity Logs funktionieren
- [ ] Erste Test-Company erstellt
- [ ] Invitation Flow getestet
- [ ] Support-Kontakt verfügbar

---

## ⚠️ Häufige Security-Fehler vermeiden

### ❌ NICHT TUN:

1. **Service Role Key im Frontend verwenden**
   ```typescript
   // ❌ FALSCH
   const supabase = createClient(url, serviceRoleKey); // Im Frontend!
   ```

2. **RLS Policies vergessen**
   ```sql
   -- ❌ FALSCH
   CREATE TABLE customers (...);
   -- RLS nicht aktiviert!
   ```

3. **company_id in Query vergessen**
   ```typescript
   // ❌ FALSCH
   const { data } = await supabase
     .from('customers')
     .select('*'); // Alle Companies!
   ```

4. **Keine Input Validation**
   ```typescript
   // ❌ FALSCH
   await supabase.from('customers').insert({ 
     email: userInput // Nicht validiert!
   });
   ```

5. **Sensitive Daten in Logs**
   ```typescript
   // ❌ FALSCH
   console.log('User password:', password);
   ```

### ✅ RICHTIG:

1. **Anon Key + RLS im Frontend**
   ```typescript
   // ✅ RICHTIG
   const supabase = createClient(url, anonKey);
   // RLS schützt die Daten!
   ```

2. **RLS überall aktiviert**
   ```sql
   -- ✅ RICHTIG
   CREATE TABLE customers (...);
   ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
   CREATE POLICY ...
   ```

3. **company_id wird von RLS geprüft**
   ```typescript
   // ✅ RICHTIG
   const { data } = await supabase
     .from('customers')
     .select('*');
   // RLS filtert automatisch nach company_id!
   ```

4. **Input validieren**
   ```typescript
   // ✅ RICHTIG
   if (!email || !email.includes('@')) {
     throw new Error('Invalid email');
   }
   await supabase.from('customers').insert({ email });
   ```

5. **Keine sensitive Daten loggen**
   ```typescript
   // ✅ RICHTIG
   console.log('User login attempt:', { email }); // Nur Email, kein Passwort
   ```

---

## 🎯 Zusammenfassung

Diese Checkliste garantiert:
- ✅ **Multi-Tenant Isolation** durch RLS
- ✅ **Sichere Authentication** mit Supabase Auth
- ✅ **License Enforcement** auf allen Ebenen
- ✅ **Audit Trail** für Compliance
- ✅ **Production-Ready** Security
- ✅ **Best Practices** umgesetzt

**Bei Unsicherheit:** Lieber zu vorsichtig als zu locker!

**Regel:** Wenn RLS fehlt = UNSICHER! ❌
