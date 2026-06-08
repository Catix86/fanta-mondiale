# Fanta Mondiale

Web app mobile-first privata per pronostici sul Mondiale.

## Stack

- Angular 21
- Firebase Auth
- Cloud Firestore
- Firebase Cloud Functions
- Hosting Firebase
- SCSS mobile-only

## Regole gioco

- Registrazione con username e password.
- La squadra vincente del Mondiale è obbligatoria in registrazione.
- La squadra vincente non è modificabile dopo la registrazione.
- Pronostici modificabili fino a 5 minuti prima del calcio d'inizio.
- Risultato esatto: 10 punti.
- Solo esito 1/X/2: 3 punti.
- Vincente Mondiale corretta: 150 punti.
- Gioco privato con autoregistrazione: chi ha il link può iscriversi.
- Admin può inserire risultati ufficiali, ricalcolare punteggi e gestire utenti.

## Setup rapido

```bash
npm install
npm run start
```

## Setup Firebase

1. Crea un progetto Firebase.
2. Abilita Authentication con Email/Password.
3. Abilita Cloud Firestore.
4. Installa Firebase CLI:

```bash
npm install -g firebase-tools
firebase login
firebase use --add
```

5. Copia la configurazione Firebase in:

```ts
src/environments/environment.ts
```

6. Deploy rules, functions e hosting:

```bash
npm run build
firebase deploy
```

## Primo admin

Dopo aver creato il tuo utente, imposta manualmente il ruolo su Firestore:

```json
{
  "role": "admin"
}
```

Percorso:

```text
users/{uid}
```

## Import calendario

Il file seed iniziale è:

```text
scripts/world-cup-2026-seed.json
```

Puoi importarlo con uno script admin oppure copiarlo in Firestore nella collection `matches`.

Nota: il calendario incluso è un seed tecnico ridotto. Per produzione sostituirlo con il calendario ufficiale completo quando consolidato.
