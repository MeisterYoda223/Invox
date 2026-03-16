# 🚀 Schnellstart: Multi-User System

## In 3 Schritten zum Multi-User Invox

### Schritt 1: Datenbank einrichten (5 Minuten)

1. **Öffnen Sie Ihr Supabase Dashboard**
   - Gehen Sie zu: https://supabase.com/dashboard
   - Wählen Sie Ihr Projekt aus

2. **Öffnen Sie den SQL Editor**
   - Klicken Sie links auf "SQL Editor"
   - Klicken Sie auf "+ New query"

3. **Kopieren und Ausführen Sie das SQL**
   - Öffnen Sie die Datei `/DATENBANK_SCHEMA.md`
   - Kopieren Sie den gesamten SQL-Code (ab "-- Unternehmen-Tabelle")
   - Fügen Sie ihn in den SQL Editor ein
   - Klicken Sie auf "Run" oder drücken Sie Ctrl+Enter

4. **Überprüfen Sie die Tabellen**
   - Gehen Sie zu "Table Editor"
   - Sie sollten sehen:
     - ✅ `companies`
     - ✅ `user_profiles`

---

### Schritt 2: Ersten Admin-Account erstellen (2 Minuten)

1. **Registrieren Sie sich**
   - Starten Sie Ihre Invox-App
   - Klicken Sie auf "Registrieren"
   
2. **Füllen Sie das Formular aus**
   - **Name**: Ihr vollständiger Name
   - **Firmenname**: Name Ihres Unternehmens
   - **E-Mail**: Ihre Email-Adresse
   - **Passwort**: Mindestens 6 Zeichen
   - **Passwort bestätigen**: Gleiches Passwort

3. **Registrierung abschließen**
   - Klicken Sie auf "Registrieren"
   - Sie werden automatisch angemeldet
   - Sie sind jetzt **Administrator** Ihres Unternehmens! 🎉

---

### Schritt 3: System testen (3 Minuten)

1. **Überprüfen Sie Ihre Admin-Rechte**
   - Gehen Sie zu "Einstellungen"
   - Sie sollten **5 Tabs** sehen:
     - Firma
     - Dokumente
     - Steuer
     - Benutzer
     - Mein Profil

2. **Firmendaten eingeben**
   - Klicken Sie auf Tab "Firma"
   - Füllen Sie Ihre Firmendaten aus
   - Klicken Sie auf "Speichern"

3. **Neuen Benutzer hinzufügen** (optional)
   - Klicken Sie auf Tab "Benutzer"
   - Klicken Sie "Benutzer hinzufügen"
   - Geben Sie Name, Email und Passwort ein
   - Klicken Sie "Hinzufügen"
   
4. **Als neuer Benutzer anmelden** (optional)
   - Melden Sie sich ab
   - Melden Sie sich mit dem neuen User an
   - Gehen Sie zu "Einstellungen"
   - Sie sollten nur **1 Tab** sehen: "Mein Profil"
   - Der User kann Firmendaten sehen, aber nicht ändern! ✅

---

## ✅ Fertig!

Ihr Multi-User System ist jetzt einsatzbereit!

## Wichtige Informationen

### Als Administrator können Sie:
- ✅ Alle Firmendaten bearbeiten
- ✅ Neue Benutzer hinzufügen
- ✅ Benutzer entfernen
- ✅ Alle Einstellungen verwalten
- ✅ Ihr eigenes Profil bearbeiten

### Als normaler Benutzer können Sie:
- ✅ Firmendaten einsehen (aber nicht ändern)
- ✅ Ihr eigenes Profil bearbeiten
- ✅ Ihr Passwort ändern
- ❌ Keine Firmendaten ändern
- ❌ Keine Benutzer verwalten

### Lizenz-Limits
Standardmäßig ist Ihre Lizenz auf **1 Benutzer** (Basic) limitiert.

Um mehr Benutzer hinzuzufügen, führen Sie als Admin folgendes SQL in Supabase aus:

```sql
-- Für Professional (5 Benutzer)
UPDATE companies 
SET license_type = 'professional', 
    max_users = 5 
WHERE id = (
  SELECT company_id FROM user_profiles WHERE id = auth.uid()
);

-- Für Enterprise (unbegrenzt)
UPDATE companies 
SET license_type = 'enterprise', 
    max_users = 999 
WHERE id = (
  SELECT company_id FROM user_profiles WHERE id = auth.uid()
);
```

---

## Häufige Probleme

### ❌ "Keine Berechtigung" beim Speichern
**Lösung**: Sie sind nicht als Admin angemeldet. Nur Administratoren können Firmendaten ändern.

### ❌ "Lizenzlimit erreicht"
**Lösung**: Erhöhen Sie `max_users` in der `companies` Tabelle (siehe SQL oben).

### ❌ User sieht keine Firmendaten
**Lösung**: Überprüfen Sie, ob der User einen Eintrag in der `user_profiles` Tabelle hat und die `company_id` korrekt ist.

### ❌ Einstellungen werden nicht geladen
**Lösung**: 
1. Öffnen Sie die Browser-Konsole (F12)
2. Suchen Sie nach Fehlermeldungen
3. Stellen Sie sicher, dass die Datenbank-Tabellen korrekt erstellt wurden

---

## Weiterführende Dokumentation

- **Detaillierte Setup-Anleitung**: `/MULTI_USER_SETUP.md`
- **Vollständige Änderungsübersicht**: `/README_MULTI_USER.md`
- **Datenbank-Schema**: `/DATENBANK_SCHEMA.md`

---

## Support

Bei weiteren Fragen:
1. Schauen Sie in die detaillierte Anleitung: `/MULTI_USER_SETUP.md`
2. Überprüfen Sie die Troubleshooting-Sektion
3. Prüfen Sie die Browser-Konsole auf Fehler
4. Prüfen Sie die Supabase Logs

---

**Viel Erfolg! 🎉**
