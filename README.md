# Angelo 18 — Midnight Elegance

Invito web statico mobile-first per i 18 anni di Angelo Caldarelli.

Live: <https://angelo18.ch/>

Fallback GitHub Pages: <https://valerielinc-ops.github.io/angelo-18/>

Teaser verticale cinematografico per WhatsApp (caduta del cristallo, reveal dell'invito e chiusura “STAY TUNED”): <https://angelo18.ch/assets/angelo-18-teaser.mp4>

## Sviluppo locale

Il sito non richiede una build. Avvialo con un server statico:

```bash
python3 -m http.server 4173
```

Poi apri `http://localhost:4173`.

## Dati modificabili

Data, orario e location sono raccolti nell’oggetto `EVENT` all’inizio di `script.js`. Questa variante `www` non include la sezione regalo. La musica usa il file MP3 fornito, avviato dal tap per essere compatibile con iPhone.

La richiesta navetta usa il backend statico FormSubmit e invia nome, cognome e numero mobile italiano a `valerielinc@gmail.com`. Nel form si inseriscono 10 cifre senza `+39`; il prefisso viene aggiunto automaticamente alla richiesta. Al primo invio è necessario confermare l’indirizzo dalla email di attivazione di FormSubmit.

## Pubblicazione

Il sito è pubblicato direttamente dal branch `main` tramite GitHub Pages.
