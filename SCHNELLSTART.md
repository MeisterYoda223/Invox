# Invox - Schnellstart-Anleitung ⚡

Für die ausführliche Anleitung siehe: [SUPABASE_SETUP_ANLEITUNG.md](./SUPABASE_SETUP_ANLEITUNG.md)

## In 5 Minuten zur laufenden App

### 1. Supabase-Projekt erstellen (2 Min)

1. Gehe zu https://supabase.com und registriere dich
2. Erstelle ein neues Projekt: **Name**: `Invox`, **Region**: `Europe (Frankfurt)`
3. Warte bis das Projekt erstellt ist (1-2 Minuten)

### 2. API-Keys kopieren (1 Min)

1. Im Supabase Dashboard: **Settings ⚙️** → **API**
2. Kopiere:
   - **Project URL**: Die Project ID (z.B. `lwqitbvbvhvdvpntqdgw`)
   - **anon public** Key

### 3. Keys in App eintragen (30 Sek)

Öffne `/utils/supabase/info.tsx`:

```typescript
export const projectId = "DEINE-PROJECT-ID"
export const publicAnonKey = "DEIN-ANON-KEY"
```

### 4. Datenbank-Tabelle erstellen (1 Min)

1. Supabase Dashboard → **SQL Editor** → **New Query**
2. Kopiere und führe aus:

```sql
CREATE TABLE IF NOT EXISTS kv_store_e5b0fe50 (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 5. App starten (30 Sek)

```bash
npm install
npm run dev
```

Öffne http://localhost:5173 🎉

---

## Authentifizierung konfigurieren (Optional)

**Für Entwicklung** (empfohlen für den Anfang):

1. Supabase Dashboard → **Authentication** → **Settings**
2. **Enable email confirmations**: ☐ AUS (deaktiviert)

**Für Produktion** (später):

1. **Enable email confirmations**: ✅ AN
2. **Site URL**: Deine Domain eintragen

---

## Testen

1. Öffne die App - Du siehst den **Login-Screen**
2. Klicke auf **"Jetzt registrieren"**
3. Fülle das Formular aus:
   - Name: `Test User`
   - Firma: `Test GmbH`
   - E-Mail: `test@example.com`
   - Passwort: `Test123456`
4. Nach Registrierung → **Anmelden**
5. Du bist drin! 🚀

---

## Häufige Probleme

### "Failed to fetch"
- Prüfe ob `projectId` und `publicAnonKey` richtig sind
- Prüfe ob Tabelle `kv_store_e5b0fe50` erstellt wurde

### "Invalid API Key"
- Kopiere den **anon public** Key erneut
- Starte die App neu

### "Email not confirmed"
- Deaktiviere "Enable email confirmations" in Auth Settings
- ODER prüfe dein E-Mail-Postfach

---

## Nächste Schritte

✅ **Basis-Setup fertig!** Die App funktioniert jetzt.

**Optional für bessere Performance:**
- [Edge Functions deployen](./SUPABASE_SETUP_ANLEITUNG.md#4-edge-functions-deployen)
- [Row Level Security aktivieren](./SUPABASE_SETUP_ANLEITUNG.md#schritt-33-row-level-security-rls-aktivieren-optional-aber-empfohlen)

**Dokumentation:**
- 📖 [Vollständige Setup-Anleitung](./SUPABASE_SETUP_ANLEITUNG.md)
- 🔐 [Authentifizierung](./AUTHENTICATION_GUIDE.md)
- 🔌 [Supabase Integration](./SUPABASE_INTEGRATION.md)

---

## Support

Bei Problemen:
1. Lies die [Fehlerbehebung](./SUPABASE_SETUP_ANLEITUNG.md#8-fehlerbehebung)
2. Prüfe die Browser Console (F12)
3. Prüfe Supabase Dashboard → Logs

**Viel Erfolg! 🎉**
