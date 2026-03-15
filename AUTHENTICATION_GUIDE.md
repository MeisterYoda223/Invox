# Invox - Authentifizierungs-Guide

## Übersicht

Die Invox-App verwendet Supabase Auth für die Benutzerverwaltung. Die App ist nur nach erfolgreicher Anmeldung zugänglich.

## Authentifizierungsfluss

### 1. App-Start

Beim Start der App wird automatisch überprüft, ob ein Benutzer angemeldet ist:

- **Nicht angemeldet** → AuthScreen (Login/Registrierung) wird angezeigt
- **Angemeldet** → Normale App-Oberfläche wird geladen
- **Lädt** → Loading-Spinner wird angezeigt

### 2. Registrierung

Neue Benutzer können sich registrieren:

**Erforderliche Felder:**
- Name (z.B. "Max Mustermann")
- Firmenname (z.B. "Mustermann Elektro GmbH")
- E-Mail-Adresse
- Passwort (min. 6 Zeichen)
- Passwort-Bestätigung

**Prozess:**
1. Benutzer füllt Registrierungsformular aus
2. Daten werden an Supabase gesendet
3. Supabase erstellt Benutzer-Account
4. User-Metadata wird gespeichert (Name, Firma)
5. Benutzer wird zur Anmeldung weitergeleitet

**Code:**
```typescript
const { error } = await signUp(email, password, {
  name: "Max Mustermann",
  company: "Mustermann Elektro GmbH"
});
```

### 3. Anmeldung

Registrierte Benutzer melden sich an:

**Erforderliche Felder:**
- E-Mail-Adresse
- Passwort

**Prozess:**
1. Benutzer gibt Zugangsdaten ein
2. Supabase validiert Credentials
3. Session wird erstellt
4. User-Objekt wird im Context gespeichert
5. App-Oberfläche wird geladen
6. Firmendaten werden aus Supabase geladen

**Code:**
```typescript
const { error } = await signIn(email, password);
```

### 4. Abmeldung

Benutzer können sich jederzeit abmelden:

**Verfügbar über:**
- Desktop: Sidebar → "Abmelden"-Button
- Mobile: Hamburger-Menü → "Abmelden"-Button

**Prozess:**
1. Benutzer klickt auf "Abmelden"
2. Session wird beendet
3. User-Objekt wird aus Context entfernt
4. AuthScreen wird angezeigt

**Code:**
```typescript
const { error } = await signOut();
```

## Session-Management

### Automatische Session-Prüfung

Die App überwacht kontinuierlich den Auth-Status:

```typescript
// In AuthContext.tsx
supabase.auth.onAuthStateChange((event, session) => {
  setSession(session);
  setUser(session?.user ?? null);
});
```

**Events:**
- `SIGNED_IN` - Benutzer hat sich angemeldet
- `SIGNED_OUT` - Benutzer hat sich abgemeldet
- `TOKEN_REFRESHED` - Session wurde erneuert
- `USER_UPDATED` - Benutzerdaten wurden aktualisiert

### Session-Persistenz

Sessions werden automatisch gespeichert:
- **Browser**: localStorage
- **Mobile**: AsyncStorage (React Native)
- **Dauer**: Konfigurierbar (Standard: 7 Tage)

## User-Metadata

Beim Registrieren werden zusätzliche Daten gespeichert:

```typescript
{
  email: "user@example.com",
  user_metadata: {
    name: "Max Mustermann",
    company: "Mustermann Elektro GmbH"
  }
}
```

**Zugriff:**
```typescript
const { user } = useAuth();
console.log(user.email); // "user@example.com"
console.log(user.user_metadata.name); // "Max Mustermann"
console.log(user.user_metadata.company); // "Mustermann Elektro GmbH"
```

## Firmendaten-Synchronisation

Nach erfolgreicher Anmeldung werden Firmendaten automatisch aus Supabase geladen:

### Datenstruktur in Supabase

```typescript
// Key-Value Store
settings:company:{userId} = {
  companyName: "Mustermann Elektro GmbH",
  owner: "Max Mustermann",
  street: "Musterstraße 123",
  zip: "12345",
  city: "Musterstadt",
  phone: "+49 123 456789",
  email: "info@mustermann.de",
  website: "www.mustermann.de"
}

settings:documents:{userId} = {
  nextQuoteNumber: "ANG-2026-001",
  nextInvoiceNumber: "RE-2026-001",
  paymentTerms: "14",
  quoteFooter: "...",
  invoiceFooter: "..."
}

settings:tax:{userId} = {
  vatId: "DE123456789",
  taxNumber: "123/456/78901",
  defaultVatRate: "19",
  bankName: "Sparkasse",
  iban: "DE...",
  bic: "..."
}
```

### Automatisches Laden

```typescript
// In Settings.tsx
useEffect(() => {
  const loadSettings = async () => {
    const { data: companyData } = await dbHelpers.get(`settings:company:${user.id}`);
    if (companyData) {
      setCompanySettings(companyData);
    }
  };
  loadSettings();
}, [user]);
```

### Speichern

```typescript
const saveCompanySettings = async () => {
  await dbHelpers.set(`settings:company:${user.id}`, companySettings);
  toast.success("Firmendaten erfolgreich gespeichert");
};
```

## Protected Routes

Alle App-Routen sind automatisch geschützt:

```typescript
// In Layout.tsx
if (!user) {
  return <AuthScreen />;
}

return <div>{/* App Content */}</div>;
```

**Keine zusätzliche Konfiguration erforderlich!**

## UI-Komponenten

### AuthScreen
- **Pfad**: `/src/app/components/auth/AuthScreen.tsx`
- **Features**:
  - Login-Formular
  - Registrierungs-Formular
  - Toggle zwischen Login/Registrierung
  - Fehlerbehandlung mit Toast-Notifications
  - Loading-States
  - Responsive Design

### Layout mit Auth-Check
- **Pfad**: `/src/app/components/Layout.tsx`
- **Features**:
  - Loading-State während Auth-Prüfung
  - AuthScreen bei nicht angemeldetem Benutzer
  - Normale App bei angemeldetem Benutzer
  - Abmelde-Button in Sidebar und Mobile-Menü
  - User-Info-Anzeige

## Toast-Notifications

Die App verwendet Sonner für Benachrichtigungen:

```typescript
// Erfolg
toast.success("Erfolgreich angemeldet!");

// Fehler
toast.error("Anmeldung fehlgeschlagen", {
  description: "Bitte überprüfen Sie Ihre Zugangsdaten."
});

// Info
toast.info("E-Mail-Bestätigung erforderlich");
```

## Fehlerbehandlung

Alle Auth-Operationen haben Error-Handling:

```typescript
try {
  const { error } = await signIn(email, password);
  if (error) {
    toast.error("Anmeldung fehlgeschlagen", {
      description: error.message
    });
  }
} catch (error) {
  toast.error("Ein Fehler ist aufgetreten");
}
```

**Häufige Fehler:**
- `Invalid login credentials` - Falsche E-Mail oder Passwort
- `Email not confirmed` - E-Mail noch nicht bestätigt
- `User already registered` - E-Mail bereits registriert
- `Weak password` - Passwort zu schwach

## E-Mail-Bestätigung (Optional)

Supabase kann E-Mail-Bestätigung erzwingen:

**In Supabase Dashboard:**
1. Authentication → Settings
2. Email Auth → Enable email confirmation
3. Email Templates → Customize

**In der App:**
```typescript
// Nach Registrierung
if (!error && data.user?.email_confirmed_at === null) {
  toast.info("Bitte bestätigen Sie Ihre E-Mail-Adresse");
}
```

## Passwort zurücksetzen

Implementierung für Passwort-Reset:

```typescript
// Password-Reset-Link senden
const resetPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  
  if (!error) {
    toast.success("Reset-Link wurde gesendet");
  }
};

// Neues Passwort setzen
const updatePassword = async (newPassword: string) => {
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });
  
  if (!error) {
    toast.success("Passwort erfolgreich geändert");
  }
};
```

## Multi-Tenancy (Mehrere Firmen)

Für Multi-Tenant-Setup mit mehreren Benutzern pro Firma:

### 1. Firma-Tabelle erstellen

```sql
-- In Supabase SQL Editor
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE company_members (
  company_id UUID REFERENCES companies(id),
  user_id UUID REFERENCES auth.users(id),
  role TEXT DEFAULT 'member',
  PRIMARY KEY (company_id, user_id)
);
```

### 2. Row Level Security (RLS)

```sql
-- Nur eigene Firma-Daten sehen
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company"
  ON companies FOR SELECT
  USING (
    id IN (
      SELECT company_id 
      FROM company_members 
      WHERE user_id = auth.uid()
    )
  );
```

### 3. Firma-Kontext in App

```typescript
// Firma beim Login laden
const loadCompany = async () => {
  const { data } = await supabase
    .from('company_members')
    .select('company_id, companies(*)')
    .eq('user_id', user.id)
    .single();
  
  setCurrentCompany(data.companies);
};
```

## Best Practices

1. **Nie Passwörter im Klartext speichern** - Supabase hasht automatisch
2. **HTTPS verwenden** - In Produktion immer SSL
3. **Session-Timeout konfigurieren** - Standard: 1 Woche
4. **E-Mail-Bestätigung aktivieren** - Verhindert Fake-Accounts
5. **Starke Passwort-Regeln** - Min. 8 Zeichen, Sonderzeichen
6. **2FA aktivieren** - Für zusätzliche Sicherheit (optional)
7. **Rate-Limiting** - Supabase bietet eingebauten Schutz

## Debugging

### Auth-Status prüfen

```typescript
const { user, session, loading } = useAuth();
console.log('User:', user);
console.log('Session:', session);
console.log('Loading:', loading);
```

### Supabase Logs

Im Supabase Dashboard:
1. Authentication → Users → Activity
2. Logs → Auth Logs

### Browser DevTools

Session ist gespeichert in:
- LocalStorage → `sb-<project-ref>-auth-token`

## Sicherheitshinweise

⚠️ **WICHTIG:**

- **Niemals** `SUPABASE_SERVICE_ROLE_KEY` im Frontend verwenden
- **Immer** `publicAnonKey` für Client-Operationen
- **Row Level Security (RLS)** für alle Tabellen aktivieren
- **E-Mail-Bestätigung** in Produktion aktivieren
- **Rate-Limiting** für Login-Versuche konfigurieren
- **CORS** korrekt konfigurieren (nur eigene Domain)

## Support

Bei Auth-Problemen:
- Supabase Docs: https://supabase.com/docs/guides/auth
- Invox Hilfe: `/hilfe` in der App
- Supabase Dashboard: Auth Logs prüfen
