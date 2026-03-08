# Invox - Supabase Integration Guide

## Übersicht

Die Invox-App nutzt Supabase für Backend-Services wie Authentifizierung und Datenspeicherung. Die Integration unterstützt sowohl lokale als auch Multi-User-Szenarien.

## Architektur

Die App verwendet eine dreistufige Architektur:
- **Frontend**: React-App mit Supabase Client
- **Server**: Hono Web Server auf Supabase Edge Functions
- **Datenbank**: PostgreSQL mit Key-Value Store

## Verfügbare Funktionen

### 1. Authentifizierung

Die App bietet vollständige Auth-Funktionalität über Supabase Auth:

#### Sign Up (Registrierung)
```typescript
import { authHelpers } from '/src/lib/supabase';

const { error } = await authHelpers.signUp(
  'user@example.com',
  'password',
  { name: 'Max Mustermann', company: 'Mustermann Elektro GmbH' }
);
```

#### Sign In (Anmeldung)
```typescript
const { error } = await authHelpers.signIn('user@example.com', 'password');
```

#### Sign Out (Abmeldung)
```typescript
const { error } = await authHelpers.signOut();
```

#### Session Check
```typescript
const { session, error } = await authHelpers.getSession();
```

### 2. Datenverwaltung

Die App nutzt den Supabase KV-Store für flexible Datenspeicherung.

#### Daten speichern
```typescript
import { dbHelpers } from '/src/lib/supabase';

// Einzelner Eintrag
await dbHelpers.set('quote:001', {
  id: 'ANG-2026-001',
  customer: 'Müller GmbH',
  amount: 2450,
  status: 'Offen'
});

// Batch-Operation
await fetch(`${supabaseUrl}/functions/v1/make-server-e5b0fe50/data/batch/set`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${publicAnonKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    items: [
      { key: 'quote:001', value: {...} },
      { key: 'quote:002', value: {...} }
    ]
  })
});
```

#### Daten abrufen
```typescript
// Einzelner Eintrag
const { data, error } = await dbHelpers.get('quote:001');

// Alle Einträge mit Präfix
const { data, error } = await dbHelpers.getAll('quote:');

// Alle Daten (strukturiert)
const { data, error } = await dbHelpers.getAll();
// Gibt zurück: { quotes: [...], invoices: [...], customers: [...], ... }
```

#### Daten löschen
```typescript
// Einzelner Eintrag
await dbHelpers.delete('quote:001');

// Batch-Operation
await fetch(`${supabaseUrl}/functions/v1/make-server-e5b0fe50/data/batch/delete`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${publicAnonKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    keys: ['quote:001', 'quote:002']
  })
});
```

### 3. Datenstruktur

Die App verwendet folgende Präfixe für unterschiedliche Datentypen:

- `quote:` - Angebote
- `invoice:` - Rechnungen
- `customer:` - Kunden
- `service:` - Leistungen
- `settings:` - Einstellungen

**Beispiel**:
```typescript
// Angebot speichern
await dbHelpers.set('quote:ANG-2026-001', {
  id: 'ANG-2026-001',
  customerId: 'customer:001',
  title: 'Elektroinstallation Neubau',
  items: [
    { description: 'Elektroinstallation', quantity: 8, price: 65, unit: 'Stunde' }
  ],
  subtotal: 520,
  tax: 98.80,
  total: 618.80,
  date: '2026-03-07',
  status: 'Offen'
});

// Kunde speichern
await dbHelpers.set('customer:001', {
  id: 'customer:001',
  name: 'Müller GmbH',
  contact: 'Hans Müller',
  email: 'info@mueller-gmbh.de',
  phone: '+49 123 456789',
  address: 'Hauptstraße 12, 10115 Berlin'
});
```

## Backend-API Endpoints

Der Hono Server bietet folgende REST-Endpoints:

- `GET /make-server-e5b0fe50/health` - Health Check
- `GET /make-server-e5b0fe50/data` - Alle Daten abrufen (strukturiert)
- `GET /make-server-e5b0fe50/data?prefix=quote:` - Daten mit Präfix abrufen
- `GET /make-server-e5b0fe50/data/:key` - Einzelnen Eintrag abrufen
- `POST /make-server-e5b0fe50/data/:key` - Eintrag speichern/aktualisieren
- `DELETE /make-server-e5b0fe50/data/:key` - Eintrag löschen
- `POST /make-server-e5b0fe50/data/batch/set` - Mehrere Einträge speichern
- `POST /make-server-e5b0fe50/data/batch/delete` - Mehrere Einträge löschen

## React Context für Authentifizierung

Die App enthält einen `AuthContext` für einfache Auth-Verwaltung:

```typescript
import { useAuth } from '/src/lib/AuthContext';

function MyComponent() {
  const { user, session, loading, signIn, signOut } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <LoginForm onSubmit={signIn} />;
  }
  
  return (
    <div>
      <p>Angemeldet als: {user.email}</p>
      <button onClick={signOut}>Abmelden</button>
    </div>
  );
}
```

## Sicherheitshinweise

⚠️ **WICHTIG**: 
- Der `SUPABASE_SERVICE_ROLE_KEY` darf NIEMALS im Frontend verwendet werden
- Verwenden Sie im Frontend nur den `publicAnonKey`
- Authentifizierte Anfragen sollten den User-Access-Token verwenden
- Sensible Operationen sollten serverseitig validiert werden

## Multi-User Setup

Für mehrere Benutzer pro Unternehmen:

1. **Benutzer-Registrierung** mit Unternehmenszuordnung:
```typescript
await authHelpers.signUp('user@example.com', 'password', {
  name: 'Max Mustermann',
  company: 'Mustermann Elektro GmbH',
  companyId: 'company:001' // Eindeutige Unternehmens-ID
});
```

2. **Row Level Security (RLS)** konfigurieren:
   - In Supabase Dashboard → Authentication → Policies
   - Regel erstellen: Benutzer sehen nur Daten ihres Unternehmens
   - Filter: `company_id = auth.jwt() -> 'company_id'`

3. **Daten mit Unternehmens-ID speichern**:
```typescript
await dbHelpers.set('quote:001', {
  ...quoteData,
  companyId: user.user_metadata.companyId
});
```

## Lokaler Modus

Für Single-User ohne Server-Verbindung können Sie localStorage nutzen:

```typescript
// Einfacher lokaler Speicher als Fallback
const localStore = {
  set: (key: string, value: any) => {
    localStorage.setItem(key, JSON.stringify(value));
  },
  get: (key: string) => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  },
  delete: (key: string) => {
    localStorage.removeItem(key);
  }
};
```

## Erweiterte Features

### Auth0 Integration (Zukünftig)

Die Architektur ist vorbereitet für Auth0:

1. Supabase unterstützt Custom OAuth Providers
2. Konfiguration in Supabase Dashboard → Authentication → Providers
3. Code-Anpassung minimal (gleiche Auth-Helper Functions)

### MySQL Migration (Optional)

Falls MySQL statt PostgreSQL benötigt wird:
- Supabase bietet PostgreSQL nativ
- Für MySQL: Separate Backend-API erforderlich
- Empfehlung: Bei PostgreSQL bleiben für bessere Integration

## Best Practices

1. **Fehlerbehandlung**: Immer `error` aus API-Antworten prüfen
2. **Logging**: Console-Logs für Debugging nutzen
3. **Caching**: Häufig genutzte Daten lokal zwischenspeichern
4. **Validation**: Eingaben vor dem Speichern validieren
5. **Backups**: Regelmäßige Exporte der wichtigen Daten

## Support

Bei Fragen zur Supabase-Integration:
- Supabase Dokumentation: https://supabase.com/docs
- Invox Hilfebereich: `/hilfe`

## Rechtliches

Siehe auch:
- `/impressum` - Impressum
- `/datenschutz` - Datenschutzerklärung (DSGVO-konform)
- `/nutzungsbedingungen` - Allgemeine Geschäftsbedingungen
