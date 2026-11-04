# Familytree

Next.js mit PostgreSQL und Prisma 7.

## Lokal starten

Die Umgebungsvariable `DATABASE_URL` in `.env` auf eine PostgreSQL-Datenbank setzen, dann:

```sh
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

`npm run dev` generiert über `predev` automatisch den Prisma-Client aus dem aktuellen Schema. Dabei werden keine Migrationen ausgeführt und keine Datenbankdaten geändert. Nach Schemaänderungen einen bereits laufenden Entwicklungsserver neu starten.

## Registrierung und Anmeldung

- `/register`: E-Mail-Adresse, Passwort ohne Längen- oder Zeichenvorgaben, Passwortbestätigung. Anschließend direkt angemeldet, ohne E-Mail-Verifizierung.
- `/login`: Anmeldung per E-Mail-Adresse und Passwort.
- Nach dem Login führt die App direkt zu `/persons`. `/dashboard` leitet dorthin weiter.
- E-Mail-Adressen werden getrimmt und kleingeschrieben. Passwörter werden unverändert mit scrypt und individuellem Salt gehasht.
- Zufällige Sitzungstokens werden nur als SHA-256-Hash in der Datenbank gespeichert. HttpOnly-/SameSite-Cookies, in Produktion zusätzlich Secure und __Host-Präfix; Produktion erfordert HTTPS.
- Sitzungen enden nach sieben Tagen und werden beim Logout serverseitig gelöscht.
- Registrierung und Login teilen ein Datenbanklimit von zehn Versuchen pro E-Mail-Adresse und 15-Minuten-Zeitfenster.
- Bestehende Benutzer ohne Passwort können sich nicht per Passwort anmelden. Passwortzurücksetzung ist noch nicht implementiert.

## Personenverwaltung

- `/persons`: geschützte Tabelle mit Vorname(n), Nachname(n), Geburtsname und Geschlecht. Die Navigation enthält ausschließlich „Personen“.
- `/persons/new`: Person anlegen. Alle vier Felder sind optional; leere Angaben werden als `null` gespeichert.
- `/persons/[id]/edit`: Person des aktuellen Stammbaums bearbeiten.
- `/persons/[id]/delete`: Person des aktuellen Stammbaums nach ausdrücklicher Bestätigung endgültig löschen.
- Jede Person gehört über das erforderliche `familyTreeId` genau einem Stammbaum. Alle Lese- und Schreibabfragen prüfen serverseitig die Mitgliedschaft und filtern nach diesem Stammbaum. Fremde Personen-IDs liefern keine Daten und lassen sich nicht verändern.
- Erfolgsmeldungen erscheinen nach dem Speichern oder Löschen in der Übersicht; Formularfehler werden direkt am Formular angezeigt.
- Das zuvor eingefügte Stammbaumschema war noch nicht migriert. Die Migration `20261104160000_person_management` legt dessen Tabellen einschließlich der Nutzerzuordnung an. Flexible Datumsangaben werden unter PostgreSQL als JSON gespeichert, da PostgreSQL die ursprünglichen Prisma-Komposittypen nicht unterstützt. Beziehungen und Ereignisse haben in diesem Schritt keine Oberfläche.
- Die vorhandene Sitzungsverwaltung in `src/lib/session.ts` bleibt bestehen; die installierten Auth.js-Pakete werden bislang nicht für die Anmeldung verwendet.

## Stammbaum-Arbeitsbereiche und Rollen

Das Schema enthält `FamilyTree` mit Name, Zeitstempeln und einem erforderlichen `ownerId` sowie `FamilyTreeMembership` mit eindeutigem Schlüssel `(familyTreeId, userId)` und genau einer Rolle `OWNER`, `ADMIN` oder `MEMBER`. Die Owner-ID bezeichnet die eine verantwortliche Person, keine zusätzliche Admin-Rolle. Eine Owner-Mitgliedschaft wird beim Anlegen atomar mit dem Stammbaum erstellt. Nur der Owner kann die Ownership an ein bestehendes Mitglied übertragen; der bisherige Owner wird dabei Admin. Die Änderung der Owner-ID und beider Mitgliedschaften erfolgt gemeinsam in einer serialisierbaren Transaktion. Admins können ausschließlich Admins und Members hinzufügen beziehungsweise zwischen diesen Rollen wechseln. Members verwalten keine Mitgliedschaften. Alle drei Rollen haben dieselben CRUD-Rechte für Familiendaten.

Ohne Mitgliedschaft führt `/persons` nach `/family-tree/new`. Dort lässt sich der erste Stammbaum anlegen. Bei mehreren Mitgliedschaften verwendet die Anwendung zunächst die älteste Mitgliedschaft (bei gleichem Zeitpunkt entscheidet die Stammbaum-ID). Eine Wechseloberfläche ist nicht implementiert. Alle Datenfunktionen nehmen dennoch eine explizite Stammbaum-ID entgegen und prüfen diese anhand der angemeldeten Person. Formulare binden ihren ursprünglichen Kontext an die Serveraktion; die ID allein verleiht keine Zugriffsrechte.

Owner und Admins finden unter der Personenübersicht den aufklappbaren Bereich „Mitglieder verwalten“. Mitglieder werden über die E-Mail-Adresse eines bereits registrierten Kontos hinzugefügt. Der Owner kann dort die Ownership mit ausdrücklicher Bestätigung übertragen. Es werden keine Einladungs-E-Mails versendet.

Auch Ereignisse, Ereignisteilnahmen, Eltern-Kind-Verknüpfungen und Partnerschaften tragen einen erforderlichen Stammbaum-Schlüssel. Zusammengesetzte Fremdschlüssel auf `(familyTreeId, id)` stellen sicher, dass beide Enden einer Beziehung beziehungsweise Ereignis und teilnehmende Person demselben Stammbaum angehören. Bestehende Personen werden weder abgeglichen noch zusammengeführt. Es gibt weiterhin keine Ereignis-/Beziehungsseiten oder entsprechenden API-Routen. Künftige Zugriffe müssen wie die Personenverwaltung über `withFamilyTree` laufen, ihre Abfragen zusätzlich nach `familyTreeId` filtern und dürfen diesen Schlüssel nicht durch ein Bearbeitungsformular verändern.

## Noch ausstehende datenerhaltende Migration

Für diese Erweiterung wurde ausschließlich das Schema und Anwendungscode geändert. Es wurde keine Migration erstellt oder angewendet und kein Seed ausgeführt. Der neue Code benötigt die von dir angewendete Migration und einen aktuellen Prisma-Client. Der Client wird bei `npm run dev` automatisch generiert; diese Generierung ersetzt keine Datenbankmigration. Einen bereits laufenden Entwicklungsserver nach Schemaänderungen neu starten.

Da `Person.userId` durch das erforderliche `Person.familyTreeId` ersetzt wird, reicht das unveränderte Anwenden einer automatisch erzeugten Migration bei vorhandenen Daten nicht aus. Die Zuordnung muss in deiner späteren Migration vor dem Entfernen des alten Schlüssels stattfinden:

1. Sichere die Datenbank. Erstelle die Migration zunächst nur als Entwurf. Bewahre die bisherigen `Person.userId`-Werte bis zum Ende der Zuordnung auf; verwende keinen Reset und kein Löschen/Neuanlegen bestehender Tabellen.
2. Lege die neuen Stammbaum- und Mitgliedschaftstabellen an. Füge die neuen `familyTreeId`-Spalten auf bestehenden Tabellen für die Übergangsphase zunächst nullable hinzu.
3. Erstelle eine explizite Zuordnung von bisherigen Benutzern beziehungsweise Personengruppen zu neuen Stammbäumen. Ohne bisherige nutzerübergreifende Verknüpfungen bietet sich pro bisherigem Benutzer ein Stammbaum mit einer OWNER-Mitgliedschaft an. Übernimm dessen Personen anhand des bisherigen `userId`; Namen, Personen-IDs und andere Felder bleiben erhalten.
4. Prüfe vor der Zuordnung bestehende Eltern-Kind-Verknüpfungen, Partnerschaften und Ereignisteilnahmen auf Verbindungen zwischen bisherigen Benutzern. Wenn diese existieren, ordne die zusammengehörigen Datensätze einem gemeinsamen Stammbaum zu und ergänze die erforderlichen Mitgliedschaften mit genau einem ausdrücklich bestimmten Owner. Nicht blind nach bisherigen Benutzergrenzen aufteilen: Das würde vorhandene Verknüpfungen ungültig machen. Verwaiste Ereignisse ohne Teilnehmer benötigen ebenfalls eine ausdrücklich festgelegte Stammbaum-Zuordnung. Bei unklaren Zuordnungen die Migration abbrechen, statt Daten zu löschen oder willkürlich zuzuweisen.
5. Fülle `familyTreeId` auf Ereignissen und Beziehungen passend zu deren Personen. Fülle auch Ereignisteilnahmen mit demselben Schlüssel. Prüfe, dass keine Nullwerte oder stammbaumübergreifenden Verknüpfungen zurückbleiben und dass jeder Stammbaum genau eine OWNER-Mitgliedschaft besitzt, deren Benutzer mit `FamilyTree.ownerId` übereinstimmt.
6. Setze erst anschließend die neuen Spalten auf NOT NULL und lege die zusammengesetzten Unique- und Fremdschlüssel an. Entferne danach die alte Person-User-Fremdschlüsselbeziehung, deren Index und `Person.userId`. Die Personen- und sonstigen Datensätze selbst bleiben bestehen.
7. Für eine Absicherung der Rollen-Invariante auch gegen direktes SQL kannst du in deiner manuellen Migration zusätzlich einen partiellen eindeutigen Index für OWNER-Mitgliedschaften je Stammbaum und einen verzögert geprüften Constraint-Trigger für die Übereinstimmung mit `ownerId` vorsehen. Das Prisma-Schema allein drückt die rollenabhängige, tabellenübergreifende Invariante nicht vollständig aus. Die Anwendungsfunktionen sichern sie bereits durch atomare Erstellung und serialisierbare Rollen-/Ownership-Transaktionen ab. Direkte Rollenänderungen außerhalb dieser Funktionen müssen dieselben Regeln einhalten.
8. Generiere nach dem Anwenden deiner Migration den Prisma-Client mit `npm run db:generate` neu und starte den Entwicklungsserver neu.

## Prüfen

```sh
npm run lint
npm test
npm run build
```
