# Invox Multi-User System - Architektur

## System-Übersicht

```
┌─────────────────────────────────────────────────────────────────┐
│                         INVOX APP                               │
│                                                                 │
│  ┌──────────────┐                                               │
│  │   Browser    │                                               │
│  │  (React App) │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────────────────────────────────────────────┐       │
│  │           AuthContext                                │       │
│  │  - user (Auth User)                                  │       │
│  │  - userProfile (Name, Email, Role, Company)          │       │
│  │  - company (Firmendaten)                             │       │
│  │  - isAdmin (boolean)                                 │       │
│  └──────────────┬───────────────────────────────────────┘       │
│                 │                                               │
│                 ▼                                               │
│  ┌──────────────────────────────────────────────────────┐       │
│  │              Routing                                 │       │
│  │  /einstellungen → Settings Component                 │       │
│  └──────────────┬───────────────────────────────────────┘       │
│                 │                                               │
│                 ▼                                               │
│  ┌──────────────────────────────────────────────────────┐       │
│  │           Settings Page                              │       │
│  │                                                      │       │
│  │  IF isAdmin:                                         │       │
│  │    - [Firma]     - Company-Daten ändern              │       │
│  │    - [Dokumente] - Dokument-Settings ändern          │       │
│  │    - [Steuer]    - Steuer-Settings ändern            │       │
│  │    - [Benutzer]  - User hinzufügen/entfernen         │       │
│  │    - [Profil]    - Eigene Daten ändern               │       │
│  │                                                      │       │
│  │  IF !isAdmin:                                        │       │
│  │    - [Profil]    - Nur eigene Daten ändern           │       │
│  └──────────────┬───────────────────────────────────────┘       │
│                 │                                               │
└─────────────────┼───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SUPABASE                                   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐       │
│  │         Auth System (auth.users)                     │       │
│  │  - id (UUID)                                         │       │
│  │  - email                                             │       │
│  │  - encrypted_password                                │       │
│  │  - user_metadata {name, company}                     │       │
│  └──────────────┬───────────────────────────────────────┘       │
│                 │                                               │
│                 ▼                                               │
│  ┌──────────────────────────────────────────────────────┐       │
│  │         Table: user_profiles                         │       │
│  │  - id (→ auth.users.id)                              │       │
│  │  - company_id (→ companies.id)                       │       │
│  │  - name                                              │       │
│  │  - email                                             │       │
│  │  - role ('admin' | 'user')                           │       │
│  │  - is_active                                         │       │
│  └──────────────┬───────────────────────────────────────┘       │
│                 │                                               │
│                 ▼                                               │
│  ┌──────────────────────────────────────────────────────┐       │
│  │         Table: companies                             │       │
│  │  - id (UUID)                                         │       │
│  │  - company_name                                      │       │
│  │  - owner, street, city, zip, phone, email            │       │
│  │  - license_type, max_users                           │       │
│  │  - next_quote_number, next_invoice_number            │       │
│  │  - payment_terms                                     │       │
│  │  - vat_id, tax_number, default_vat_rate              │       │
│  │  - bank_name, iban, bic                              │       │
│  └──────────────────────────────────────────────────────┘       │
│                                                                 │
│  ┌─────────────────────────────────────────────────────┐        │
│  │         Row Level Security (RLS)                    │        │
│  │  User sieht nur eigene Company                      │        │
│  │  Admin kann Company ändern                          │        │
│  │  User sieht nur eigenes Profil                      │        │
│  │  User sieht alle Profile der eigenen Company        │        │
│  └─────────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

## Datenfluss

### 1. Registrierung (Neuer Admin)

```
User füllt Formular aus
    ↓
signUp() in AuthScreen
    ↓
Supabase Auth erstellt User
    ↓
Company wird erstellt (companies table)
    ↓
User Profile wird erstellt (user_profiles table)
    - role: 'admin'
    - company_id: neue Company ID
    ↓
Automatischer Login
    ↓
AuthContext lädt:
    - user (von Auth)
    - userProfile (von user_profiles)
    - company (von companies)
    ↓
isAdmin = true
    ↓
User sieht alle 5 Settings-Tabs
```

### 2. Admin fügt User hinzu

```
Admin klickt "Benutzer hinzufügen"
    ↓
Lizenzlimit-Prüfung
    ↓
Wenn OK: signUp() in Supabase Auth
    ↓
User Profile wird erstellt
    - role: 'user'
    - company_id: gleiche wie Admin
    ↓
User kann sich anmelden
    ↓
AuthContext lädt Daten
    ↓
isAdmin = false
    ↓
User sieht nur "Mein Profil" Tab
```

### 3. User bearbeitet Firmendaten (Admin only)

```
Admin ändert Firmendaten im Form
    ↓
Klick auf "Speichern"
    ↓
saveCompanySettings()
    ↓
Prüfung: isAdmin?
    ↓
Wenn JA:
    UPDATE companies SET ... WHERE id = company.id
    ↓
RLS Policy prüft:
    - Ist User Admin der Company?
    ↓
Wenn JA: Update erfolgreich
    ↓
refreshProfile() lädt neue Daten
    ↓
Toast: "Erfolgreich gespeichert"
```

### 4. User bearbeitet eigenes Profil

```
User ändert Name/Email/Passwort
    ↓
Klick auf "Profil speichern"
    ↓
saveProfileSettings()
    ↓
UPDATE user_profiles SET name=..., email=...
UPDATE auth.users SET email=... (optional)
UPDATE auth.users SET password=... (optional)
    ↓
RLS Policy prüft:
    - Ist es das eigene Profil?
    ↓
Wenn JA: Update erfolgreich
    ↓
Toast: "Profil aktualisiert"
```

## Komponenten-Hierarchie

```
App.tsx
  ├─ AuthProvider (AuthContext)
  │   └─ Stellt bereit:
  │       - user
  │       - userProfile
  │       - company
  │       - isAdmin
  │       - signIn, signUp, signOut
  │       - refreshProfile
  │
  └─ RouterProvider
      └─ Layout
          └─ Routes
              ├─ / → Dashboard
              ├─ /angebote → Quotes
              ├─ /rechnungen → Invoices
              ├─ /kunden → Customers
              ├─ /leistungen → Services
              └─ /einstellungen → Settings ⭐
                  │
                  ├─ IF isAdmin:
                  │   ├─ Tab: Firma
                  │   ├─ Tab: Dokumente
                  │   ├─ Tab: Steuer
                  │   ├─ Tab: Benutzer
                  │   │   ├─ User-Liste
                  │   │   ├─ Add User Dialog
                  │   │   └─ Delete User Dialog
                  │   └─ Tab: Mein Profil
                  │
                  └─ IF !isAdmin:
                      └─ Tab: Mein Profil
```

## Sicherheits-Layer

```
┌─────────────────────────────────────────────────────────┐
│                  Frontend (React)                       │
│                                                         │
│  1. UI Layer                                            │
│     - Tabs basierend auf isAdmin ein/ausblenden         │
│     - "Speichern" Buttons nur für Admin                 │
│                                                         │
│  2. Logic Layer                                         │
│     - saveCompanySettings() prüft isAdmin               │
│     - addNewUser() prüft isAdmin + Lizenzlimit          │
│                                                         │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│              Supabase (Backend)                         │
│                                                         │
│  3. RLS Policies (Row Level Security)                   │
│     - companies: Nur Admins können UPDATE               │
│     - user_profiles: Nur eigenes Profil UPDATE          │
│     - user_profiles: Alle der Company können SELECT     │
│                                                         │
│  4. Database Constraints                                │
│     - FOREIGN KEY company_id → companies(id)            │
│     - FOREIGN KEY id → auth.users(id)                   │
│     - CASCADE DELETE bei User-Löschung                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Rollen-Matrix

| Feature | Admin | User | Gast |
|---------|-------|------|------|
| **Ansehen** |
| Firmendaten | ✅ | ✅ | ❌ |
| User-Liste | ✅ | ✅ | ❌ |
| Eigenes Profil | ✅ | ✅ | ❌ |
| **Bearbeiten** |
| Firmendaten | ✅ | ❌ | ❌ |
| Dokument-Settings | ✅ | ❌ | ❌ |
| Steuer-Settings | ✅ | ❌ | ❌ |
| Eigenes Profil | ✅ | ✅ | ❌ |
| Eigenes Passwort | ✅ | ✅ | ❌ |
| **Verwaltung** |
| User hinzufügen | ✅ | ❌ | ❌ |
| User entfernen | ✅ | ❌ | ❌ |
| Andere Profile bearbeiten | ❌ | ❌ | ❌ |

## Lizenz-System

```
Company
  ├─ license_type: 'basic' | 'professional' | 'enterprise'
  └─ max_users: 1 | 5 | 999

Beim User hinzufügen:
  IF (current_user_count >= max_users) THEN
    ❌ Error: "Lizenzlimit erreicht"
  ELSE
    ✅ User erstellen
  END IF
```

## State Management

```
AuthContext (Global)
  ├─ session (Supabase Session)
  ├─ user (Auth User)
  ├─ userProfile (User Profile mit Rolle)
  ├─ company (Company-Daten)
  └─ isAdmin (computed: userProfile.role === 'admin')

Settings Component (Local)
  ├─ companySettings (Formular-State)
  ├─ documentSettings (Formular-State)
  ├─ taxSettings (Formular-State)
  ├─ profileSettings (Formular-State)
  ├─ companyUsers (User-Liste)
  └─ loading, saving (UI-State)
```

## Daten-Synchronisation

```
Initial Load:
  AuthContext lädt:
    user → userProfile → company
    
Bei Änderungen:
  1. User speichert in DB
  2. refreshProfile() wird aufgerufen
  3. AuthContext lädt neu:
     userProfile + company
  4. UI aktualisiert sich automatisch (React State)

Bei Login/Logout:
  onAuthStateChange Listener:
    → Lädt userProfile + company
    → Setzt isAdmin
```

## API-Endpoints (Supabase)

```
Auth:
  POST /auth/v1/signup
  POST /auth/v1/token?grant_type=password
  POST /auth/v1/logout

Database (via Supabase Client):
  SELECT * FROM companies WHERE ...
  SELECT * FROM user_profiles WHERE ...
  UPDATE companies SET ...
  UPDATE user_profiles SET ...
  INSERT INTO user_profiles ...
  DELETE FROM user_profiles ...

Alle Requests werden durch RLS gefiltert!
```

## Performance-Optimierungen

1. **Caching im AuthContext**
   - User, UserProfile, Company werden gecacht
   - Nur bei refreshProfile() neu geladen

2. **Conditional Rendering**
   - Tabs werden nur gerendert wenn isAdmin
   - Vermeidet unnötige Component-Mounts

3. **Database Indexes**
   - `idx_companies_created_at`
   - `idx_user_profiles_company_id`
   - `idx_user_profiles_role`
   
4. **Lazy Loading**
   - User-Liste wird nur geladen wenn isAdmin
   - Settings werden nur beim Tab-Wechsel geladen

---

Diese Architektur bietet:
- ✅ Skalierbarkeit (Multi-Tenant ready)
- ✅ Sicherheit (RLS auf allen Ebenen)
- ✅ Performance (Caching + Indexes)
- ✅ Wartbarkeit (Klare Trennung der Concerns)
