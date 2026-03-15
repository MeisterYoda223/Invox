# Invox - Supabase Integration

## 🎉 Status: Login-Panel ist vollständig mit Supabase verknüpft!

Ihre Invox-App ist bereits vollständig für die Supabase-Authentifizierung vorbereitet. 

---

## 📚 Verfügbare Dokumentation

### 1. ⚡ [SCHNELLSTART.md](./SCHNELLSTART.md)
**Für**: Wenn Sie schnell loslegen wollen  
**Dauer**: 5 Minuten  
**Inhalt**:
- Supabase-Projekt erstellen
- API-Keys eintragen
- Datenbank-Tabelle erstellen
- App starten

### 2. 📖 [SUPABASE_SETUP_ANLEITUNG.md](./SUPABASE_SETUP_ANLEITUNG.md)
**Für**: Vollständige Schritt-für-Schritt-Anleitung  
**Dauer**: 15-20 Minuten  
**Inhalt**:
- Detaillierte Einrichtungsschritte
- Edge Functions deployen
- Authentifizierung konfigurieren
- Row Level Security (RLS)
- Fehlerbehebung
- Best Practices

### 3. 🔐 [AUTHENTICATION_GUIDE.md](./AUTHENTICATION_GUIDE.md)
**Für**: Verstehen wie Auth funktioniert  
**Inhalt**:
- Authentifizierungs-Flow
- Session-Management
- User-Metadata
- Firmendaten-Synchronisation
- Passwort-Reset
- Multi-Tenancy

### 4. 🔌 [LOGIN_SUPABASE_VERBINDUNG.md](./LOGIN_SUPABASE_VERBINDUNG.md)
**Für**: Technische Details der Verbindung  
**Inhalt**:
- Architektur-Diagramm
- Datei-Struktur erklärt
- API-Call-Beispiele
- Live-Tests
- Debugging

---

## 🚀 Quick Start

### Option A: Minimales Setup (5 Min)

```bash
# 1. Supabase-Projekt erstellen auf https://supabase.com
# 2. API-Keys in /utils/supabase/info.tsx eintragen
# 3. Datenbank-Tabelle erstellen (SQL in SCHNELLSTART.md)
# 4. App starten

npm install
npm run dev
```

### Option B: Vollständiges Setup (20 Min)

Folgen Sie der [vollständigen Anleitung](./SUPABASE_SETUP_ANLEITUNG.md):
- ✅ Supabase-Projekt einrichten
- ✅ Edge Functions deployen
- ✅ Row Level Security aktivieren
- ✅ E-Mail-Templates anpassen

---

## 📂 Wichtige Dateien

### Konfiguration

- **`/utils/supabase/info.tsx`** - API-Keys hier eintragen!
  ```typescript
  export const projectId = "IHRE-PROJECT-ID"
  export const publicAnonKey = "IHR-ANON-KEY"
  ```

### App-Code (bereits implementiert ✅)

- **`/src/lib/supabase.ts`** - Supabase Client & Helper
- **`/src/lib/AuthContext.tsx`** - Auth-Provider
- **`/src/app/components/auth/AuthScreen.tsx`** - Login/Registrierung UI
- **`/src/app/components/Layout.tsx`** - Auth-Check beim Laden

### Backend (Supabase)

- **`/supabase/functions/server/`** - Edge Functions
- **Datenbank**: Tabelle `kv_store_e5b0fe50` für Key-Value Speicherung

---

## 🔗 Wie ist alles verbunden?

```
USER INPUT (Login-Formular)
         ↓
AuthScreen.tsx (UI)
         ↓
useAuth() Hook
         ↓
AuthContext.tsx (State Management)
         ↓
authHelpers.signIn()
         ↓
supabase.ts (Supabase Client)
         ↓
SUPABASE API (Backend)
         ↓
Session & User zurück
         ↓
App wird freigeschaltet ✅
```

**Details**: Siehe [LOGIN_SUPABASE_VERBINDUNG.md](./LOGIN_SUPABASE_VERBINDUNG.md)

---

## ✅ Checkliste: Setup

- [ ] **Supabase-Projekt erstellt**
  - Gehe zu https://supabase.com
  - Erstelle neues Projekt
  - Region: Europe (Frankfurt)

- [ ] **API-Keys kopiert**
  - Project ID: `_______________`
  - anon public Key: ✅ kopiert

- [ ] **Keys in App eingetragen**
  - Datei: `/utils/supabase/info.tsx`
  - projectId: ✅ eingetragen
  - publicAnonKey: ✅ eingetragen

- [ ] **Datenbank-Tabelle erstellt**
  - SQL Editor geöffnet
  - Tabelle `kv_store_e5b0fe50` erstellt
  - SQL-Code aus [SCHNELLSTART.md](./SCHNELLSTART.md)

- [ ] **Auth konfiguriert**
  - Email Auth aktiviert
  - Email-Bestätigung: ☐ AUS (für Tests)
  - Site URL: http://localhost:5173

- [ ] **App getestet**
  - `npm install` ausgeführt
  - `npm run dev` gestartet
  - Login-Screen wird angezeigt
  - Test-Registrierung funktioniert
  - Test-Login funktioniert

---

## 🧪 Verbindung testen

### Methode 1: In-App Test

1. Starten Sie die App: `npm run dev`
2. Navigieren Sie zu **Hilfe** (in der Sidebar)
3. Scrollen Sie nach unten zum **Debugging-Bereich**
4. Klicken Sie auf **"Verbindung testen"**
5. Sehen Sie die Ergebnisse:
   - ✅ Supabase Client
   - ✅ API-Verbindung
   - ✅ Auth-Service

### Methode 2: Browser Console

```javascript
// F12 drücken → Console Tab

// 1. Auth-Status prüfen
const { data } = await supabase.auth.getSession();
console.log('Session:', data.session);

// 2. Test-Registrierung
const result = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'Test123456'
});
console.log('Result:', result);
```

### Methode 3: Supabase Dashboard

1. Öffnen Sie https://supabase.com/dashboard
2. Wählen Sie Ihr Projekt
3. Gehe zu **Authentication** → **Users**
4. Nach Registrierung: User sollte hier erscheinen ✅

---

## 🐛 Häufige Probleme

### "Failed to fetch" Fehler

**Ursache**: API-Keys nicht korrekt oder CORS-Problem

**Lösung**:
1. Prüfen Sie `/utils/supabase/info.tsx`
2. Project ID muss korrekt sein
3. anon public Key muss vollständig sein
4. Keine Leerzeichen in den Keys!

### "Email not confirmed"

**Ursache**: Email-Bestätigung ist aktiviert

**Lösung**:
- Supabase Dashboard → Authentication → Settings
- "Enable email confirmations" → ☐ AUS (für Entwicklung)

### Daten werden nicht gespeichert

**Ursache**: Tabelle `kv_store_e5b0fe50` fehlt

**Lösung**:
```sql
CREATE TABLE IF NOT EXISTS kv_store_e5b0fe50 (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);
```

**Mehr Lösungen**: [SUPABASE_SETUP_ANLEITUNG.md#8-fehlerbehebung](./SUPABASE_SETUP_ANLEITUNG.md#8-fehlerbehebung)

---

## 🔐 Sicherheit

### ✅ Das ist sicher:

- `publicAnonKey` im Frontend verwenden
- Row Level Security (RLS) für Datenbank-Tabellen
- User können nur ihre eigenen Daten sehen

### ⚠️ NIEMALS im Frontend:

- `service_role` Key (nur Backend!)
- Datenbank-Passwort
- Private API-Keys

### Best Practices:

1. **RLS aktivieren** für alle Tabellen in Produktion
2. **Email-Bestätigung** aktivieren in Produktion
3. **Starke Passwörter** erzwingen (min. 8 Zeichen)
4. **HTTPS** verwenden in Produktion
5. **Secrets** nur in Environment Variables

---

## 📊 Funktionsumfang

### ✅ Bereits implementiert:

- **Authentifizierung**
  - Login mit E-Mail & Passwort
  - Registrierung mit Name & Firma
  - Session-Management (automatisch)
  - Logout-Funktionalität
  - Auth-Status-Überwachung

- **Datenspeicherung**
  - Firmendaten in Supabase
  - User-Metadata (Name, Firma)
  - Key-Value Store für Settings
  - Automatisches Laden beim Login

- **UI/UX**
  - Professioneller Login-Screen
  - Loading-States
  - Fehlerbehandlung
  - Toast-Benachrichtigungen
  - Responsive Design (Mobile + Desktop)

### 🚧 Optional erweiterbar:

- Passwort-Reset per E-Mail
- Multi-Factor Authentication (2FA)
- OAuth (Google, GitHub, etc.)
- Magic Link Login
- Team-Verwaltung (Multi-Tenancy)

---

## 📈 Nächste Schritte

### Für Entwicklung:

1. ✅ Setup abschließen (siehe Checkliste oben)
2. ✅ Test-User erstellen und Login testen
3. ✅ Firmendaten in Einstellungen speichern
4. 🔄 Edge Functions deployen (optional, aber empfohlen)
5. 🔄 RLS Policies aktivieren (für bessere Sicherheit)

### Für Produktion:

1. Email-Bestätigung aktivieren
2. Custom Domain einrichten
3. Email-Templates anpassen (Corporate Design)
4. Monitoring einrichten
5. Backups konfigurieren
6. Rate Limiting aktivieren

---

## 🆘 Support

### Dokumentation:

- [Supabase Docs](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Edge Functions Docs](https://supabase.com/docs/guides/functions)

### Community:

- [Supabase Discord](https://discord.supabase.com)
- [Supabase GitHub](https://github.com/supabase/supabase)

### Invox-spezifisch:

- Alle Guides in diesem Projekt
- `/hilfe` Seite in der App
- Verbindungstest in der App

---

## 🎯 Zusammenfassung

**Was Sie haben:**
- ✅ Vollständig vorbereitete App
- ✅ Login/Registrierung UI
- ✅ Supabase Integration
- ✅ Session-Management
- ✅ Firmendaten-Speicherung

**Was Sie brauchen:**
- Supabase-Projekt (kostenlos!)
- 5 Minuten Zeit für Setup
- API-Keys eintragen
- Datenbank-Tabelle erstellen

**Das Ergebnis:**
- 🎉 Produktionsreife Authentifizierung
- 🎉 Sichere Datenspeicherung
- 🎉 Multi-User fähig
- 🎉 Skalierbar

---

## 🚀 Los geht's!

**Starten Sie hier**: [SCHNELLSTART.md](./SCHNELLSTART.md)

Bei Fragen: Lesen Sie die ausführliche [Setup-Anleitung](./SUPABASE_SETUP_ANLEITUNG.md) oder die [Verbindungs-Details](./LOGIN_SUPABASE_VERBINDUNG.md).

**Viel Erfolg mit Invox! 🎉**
