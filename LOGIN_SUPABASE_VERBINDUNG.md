# Login-Panel ↔ Supabase Verbindung

## ✅ Status: VOLLSTÄNDIG VERBUNDEN

Das Login-Panel ist bereits vollständig mit Supabase verknüpft und funktionsbereit!

---

## 🔄 Verbindungs-Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    INVOX APP ARCHITEKTUR                        │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│  AuthScreen.tsx  │ ◄── Login/Registrierungs-UI
│  (Login-Panel)   │
└────────┬─────────┘
         │
         │ useAuth()
         ▼
┌──────────────────┐
│ AuthContext.tsx  │ ◄── Globaler Auth-State
│  (Auth-Provider) │
└────────┬─────────┘
         │
         │ signIn(), signUp(), signOut()
         ▼
┌──────────────────┐
│  supabase.ts     │ ◄── Supabase Client & Helper
│  (authHelpers)   │
└────────┬─────────┘
         │
         │ API Calls
         ▼
┌──────────────────┐
│ /utils/supabase/ │ ◄── Konfiguration
│    info.tsx      │     • projectId
│                  │     • publicAnonKey
└────────┬─────────┘
         │
         │ HTTPS API Calls
         ▼
┌──────────────────┐
│     SUPABASE     │ ◄── Backend
│   Auth Service   │     • Benutzer-Verwaltung
│                  │     • Session-Management
│                  │     • Email Auth
└──────────────────┘
```

---

## 📂 Datei-Struktur

### 1. `/src/app/components/auth/AuthScreen.tsx`
**Rolle**: Login/Registrierungs-UI

**Was es macht**:
- Zeigt Login-Formular
- Zeigt Registrierungs-Formular
- Sammelt Benutzereingaben (E-Mail, Passwort, Name, Firma)
- Ruft `useAuth()` Hook auf

**Supabase-Verbindung**:
```typescript
import { useAuth } from "../../../lib/AuthContext";

const { signIn, signUp } = useAuth();

// Bei Login
const { error } = await signIn(email, password);

// Bei Registrierung
const { error } = await signUp(email, password, {
  name: formData.name,
  company: formData.company,
});
```

---

### 2. `/src/lib/AuthContext.tsx`
**Rolle**: Globaler Authentifizierungs-Provider

**Was es macht**:
- Verwaltet Auth-State (user, session, loading)
- Stellt Auth-Funktionen bereit (signIn, signUp, signOut)
- Überwacht Auth-Status-Änderungen
- Speichert Session automatisch

**Supabase-Verbindung**:
```typescript
import { supabase, authHelpers } from './supabase';

// Session initialisieren
const { session } = await authHelpers.getSession();

// Auth-Änderungen überwachen
supabase.auth.onAuthStateChange((_event, session) => {
  setSession(session);
  setUser(session?.user ?? null);
});

// Login
const signIn = async (email: string, password: string) => {
  const { error } = await authHelpers.signIn(email, password);
  return { error };
};
```

---

### 3. `/src/lib/supabase.ts`
**Rolle**: Supabase Client & Helper-Funktionen

**Was es macht**:
- Erstellt Supabase Client
- Stellt `authHelpers` bereit (signIn, signUp, signOut)
- Stellt `dbHelpers` bereit (für Datenspeicherung)

**Supabase-Verbindung**:
```typescript
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

// Supabase Client erstellen
const supabaseUrl = `https://${projectId}.supabase.co`;
export const supabase = createClient(supabaseUrl, publicAnonKey);

// Auth Helper
export const authHelpers = {
  signUp: async (email: string, password: string, userData) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: userData },
    });
    return { data, error };
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },
};
```

---

### 4. `/utils/supabase/info.tsx`
**Rolle**: Supabase Konfiguration (API-Keys)

**Was es macht**:
- Speichert Project ID
- Speichert Public Anon Key
- Wird von `supabase.ts` importiert

**Aktueller Inhalt**:
```typescript
export const projectId = "lwqitbvbvhvdvpntqdgw"
export const publicAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

✅ **Diese Keys sind bereits konfiguriert!**

---

## 🔐 Authentifizierungs-Flow

### Registrierung (Sign Up)

```
Benutzer füllt Formular aus:
  - Name: "Max Mustermann"
  - Firma: "Mustermann Elektro GmbH"
  - E-Mail: "max@mustermann.de"
  - Passwort: "Sicher123!"

         ↓

AuthScreen.tsx
  handleSubmit() → signUp(email, password, { name, company })

         ↓

AuthContext.tsx
  signUp() → authHelpers.signUp(email, password, userData)

         ↓

supabase.ts
  authHelpers.signUp() → supabase.auth.signUp({...})

         ↓

SUPABASE API
  POST https://lwqitbvbvhvdvpntqdgw.supabase.co/auth/v1/signup
  Body: { email, password, data: { name, company } }

         ↓

SUPABASE erstellt Benutzer:
  - User ID: "abc123..."
  - Email: "max@mustermann.de"
  - user_metadata: { name: "Max Mustermann", company: "..." }

         ↓

Response zurück an App:
  - { data: { user, session }, error: null }

         ↓

AuthContext aktualisiert State:
  - setUser(data.user)
  - setSession(data.session)

         ↓

Layout.tsx prüft:
  - if (!user) → AuthScreen
  - if (user) → App-Inhalt ✅

         ↓

Benutzer ist eingeloggt! 🎉
```

---

### Anmeldung (Sign In)

```
Benutzer gibt Zugangsdaten ein:
  - E-Mail: "max@mustermann.de"
  - Passwort: "Sicher123!"

         ↓

AuthScreen.tsx
  handleSubmit() → signIn(email, password)

         ↓

AuthContext.tsx
  signIn() → authHelpers.signIn(email, password)

         ↓

supabase.ts
  authHelpers.signIn() → supabase.auth.signInWithPassword({...})

         ↓

SUPABASE API
  POST https://lwqitbvbvhvdvpntqdgw.supabase.co/auth/v1/token?grant_type=password
  Body: { email, password }

         ↓

SUPABASE validiert Credentials:
  ✓ E-Mail existiert?
  ✓ Passwort korrekt?

         ↓

SUPABASE erstellt Session:
  - Access Token (JWT)
  - Refresh Token
  - Expires At

         ↓

Response zurück an App:
  - { data: { user, session }, error: null }

         ↓

AuthContext aktualisiert State:
  - setUser(data.user)
  - setSession(data.session)
  - Session wird in localStorage gespeichert

         ↓

Layout.tsx prüft:
  - if (user) → App-Inhalt ✅

         ↓

Benutzer ist eingeloggt! 🎉
```

---

## 📡 API-Calls

### Registrierung

**Request**:
```http
POST https://lwqitbvbvhvdvpntqdgw.supabase.co/auth/v1/signup
Content-Type: application/json
apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "email": "max@mustermann.de",
  "password": "Sicher123!",
  "data": {
    "name": "Max Mustermann",
    "company": "Mustermann Elektro GmbH"
  }
}
```

**Response** (Erfolg):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "v1.MRjcvub...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "max@mustermann.de",
    "user_metadata": {
      "name": "Max Mustermann",
      "company": "Mustermann Elektro GmbH"
    },
    "created_at": "2026-03-15T10:30:00.000Z"
  }
}
```

---

### Anmeldung

**Request**:
```http
POST https://lwqitbvbvhvdvpntqdgw.supabase.co/auth/v1/token?grant_type=password
Content-Type: application/json
apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "email": "max@mustermann.de",
  "password": "Sicher123!"
}
```

**Response** (Erfolg):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "v1.MRjcvub...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "max@mustermann.de",
    "user_metadata": {
      "name": "Max Mustermann",
      "company": "Mustermann Elektro GmbH"
    }
  }
}
```

---

## 🧪 Live-Test

### So testen Sie die Verbindung:

1. **App starten**:
   ```bash
   npm run dev
   ```

2. **Browser öffnen**: http://localhost:5173

3. **Sie sehen**: AuthScreen (Login-Panel) ✅

4. **Browser Console öffnen** (F12):
   ```javascript
   // Supabase Client ist verfügbar
   console.log(window.supabase)
   ```

5. **Registrierung testen**:
   - Klick auf "Jetzt registrieren"
   - Formular ausfüllen
   - Klick auf "Registrieren"
   - **Browser Network Tab prüfen**:
     - Sie sehen: `POST .../auth/v1/signup` ✅

6. **Supabase Dashboard prüfen**:
   - https://supabase.com/dashboard
   - Authentication → Users
   - **Sie sehen**: Ihr Test-User ✅

---

## 🔍 Debugging

### Verbindung testen

**In Browser Console** (F12):

```javascript
// 1. Supabase Client prüfen
import { supabase } from './src/lib/supabase.ts';
console.log(supabase);
// ✅ Sollte Supabase Client Objekt zeigen

// 2. Auth-Status prüfen
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);
// ✅ Sollte null sein (wenn nicht eingeloggt)

// 3. Test-Registrierung
const { data, error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'Test123456',
  options: {
    data: {
      name: 'Test User',
      company: 'Test GmbH'
    }
  }
});
console.log('SignUp:', data, error);
// ✅ Sollte User-Objekt zurückgeben
```

---

## ⚠️ Wichtige Hinweise

### 1. API-Keys sind bereits konfiguriert

Die Datei `/utils/supabase/info.tsx` enthält:
- ✅ `projectId`: `lwqitbvbvhvdvpntqdgw`
- ✅ `publicAnonKey`: Vollständiger Key vorhanden

**Das bedeutet**: Die Verbindung zu Ihrem Supabase-Projekt ist bereits hergestellt!

### 2. Tabelle in Datenbank muss existieren

Für Firmendaten-Speicherung benötigen Sie die `kv_store_e5b0fe50` Tabelle.

**Erstellen in Supabase Dashboard**:
```sql
CREATE TABLE IF NOT EXISTS kv_store_e5b0fe50 (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. Email-Bestätigung

**Standardmäßig**: Supabase sendet Bestätigungs-E-Mails

**Für Entwicklung deaktivieren**:
1. Supabase Dashboard → Authentication → Settings
2. "Enable email confirmations" → ☐ AUS

**Für Produktion**: Lassen Sie es AN (sicherer!)

---

## 🎯 Zusammenfassung

### Was ist bereits verbunden?

- ✅ **AuthScreen.tsx** → nutzt `useAuth()` Hook
- ✅ **AuthContext.tsx** → stellt Auth-Funktionen bereit
- ✅ **supabase.ts** → ruft Supabase API auf
- ✅ **info.tsx** → enthält API-Keys
- ✅ **Layout.tsx** → zeigt AuthScreen wenn nicht eingeloggt

### Was müssen Sie noch tun?

1. **Datenbank-Tabelle erstellen** (siehe SCHNELLSTART.md)
2. **Email-Bestätigung konfigurieren** (optional)
3. **App testen** mit Registrierung/Login

### Bereit zum Testen!

```bash
npm run dev
```

Öffnen Sie http://localhost:5173 - Sie sehen das Login-Panel, das bereits vollständig mit Supabase verbunden ist! 🎉

---

## 📚 Weitere Dokumentation

- [SCHNELLSTART.md](./SCHNELLSTART.md) - 5-Minuten-Setup
- [SUPABASE_SETUP_ANLEITUNG.md](./SUPABASE_SETUP_ANLEITUNG.md) - Vollständige Anleitung
- [AUTHENTICATION_GUIDE.md](./AUTHENTICATION_GUIDE.md) - Auth-Details
