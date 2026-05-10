# 🌱 Eco-Tracker 2030

Applicazione web che mostra la **qualità dell'aria in tempo reale** di qualsiasi città del mondo, collegando i dati scientifici agli obiettivi dell'**Agenda 2030 dell'ONU**.

---

## Scopo del progetto

L'inquinamento atmosferico è invisibile, ma i dati per misurarlo esistono e sono pubblici. Eco-Tracker li rende leggibili a tutti: scrivi il nome di una città, e l'app ti mostra i livelli di ogni inquinante, un giudizio sulla qualità dell'aria, e una spiegazione di cosa significano quei numeri per la tua salute e per il pianeta.

Il progetto è pensato come strumento di **cittadinanza digitale attiva**: non solo mostrare dati, ma educare a leggerli criticamente e collegarli a obiettivi globali concreti (Goal 3, 11 e 13 dell'Agenda 2030).

---

## Struttura del progetto

```
eco-tracker/
│
├── client/                        # Frontend (tutto ciò che vede l'utente)
│   ├── pages/
│   │   └── index.html             # La pagina HTML unica dell'applicazione
│   ├── styles/
│   │   └── style.css              # Stili grafici (colori, layout, animazioni)
│   └── scripts/
│       └── main.js                # Logica JavaScript: cerca la città,
│                                  # riceve i dati, aggiorna la pagina
│
├── server/                        # Backend (il "cervello" nascosto)
│   ├── server.js                  # Avvia il server, definisce le rotte
│   ├── routes/
│   │   ├── report.js              # Gestisce GET /api/report/:citta
│   │   └── goals.js               # Gestisce GET /api/obiettivi
│   └── services/
│       └── airQuality.js          # Chiama le API esterne e trasforma i dati
│
├── .env                           # API key (file privato, NON su GitHub)
├── .gitignore                     # Dice a Git di ignorare node_modules e .env
└── package.json                   # Dipendenze e comandi del progetto
```

### Perché questa divisione client/server?

Il **frontend** (client) è ciò che gira nel browser dell'utente: HTML, CSS e JavaScript. Non può tenere segreti — chiunque può vedere il suo codice.

Il **backend** (server) gira sul nostro computer/server: può tenere al sicuro la API key e fare operazioni che il browser non può fare, come chiamare servizi esterni senza esporre credenziali.

---

## API esterne usate (servizi che il backend interroga)

Il backend chiama due endpoint di **OpenWeatherMap** — un servizio professionale scelto per la sua documentazione pubblica, i dati aggiornati ogni ora e l'affidabilità industriale.

Una sola API key (quella del tuo account OpenWeatherMap) dà accesso a entrambi i servizi.

### 1. Geocoding API
Converte il nome di una città in coordinate geografiche (latitudine e longitudine), perché le API meteo lavorano con coordinate, non con nomi.

```
GET https://api.openweathermap.org/geo/1.0/direct?q=Roma&limit=1&appid=TUA_KEY
```

Risposta: `{ lat: 41.89, lon: 12.51, country: "IT", name: "Roma" }`

### 2. Air Pollution API
Restituisce i livelli di tutti gli inquinanti atmosferici per una coppia di coordinate.

```
GET https://api.openweathermap.org/data/2.5/air_pollution?lat=41.89&lon=12.51&appid=TUA_KEY
```

Risposta: AQI (indice 1-5) + concentrazioni di CO, NO₂, O₃, SO₂, PM₂.₅, PM₁₀, NH₃ in μg/m³.

---

## API REST fornite dal backend (endpoint che il frontend chiama)

Il backend non espone i dati grezzi di OpenWeatherMap: li elabora, li arricchisce e li serve al frontend in un formato più semplice e significativo.

### `GET /api/report/:citta`

Il frontend lo chiama quando l'utente preme "Analizza". Il backend:
1. **Valida** il nome della città (solo lettere, max 80 caratteri)
2. **Chiama il Geocoding** per ottenere le coordinate
3. **Chiama Air Pollution** con quelle coordinate
4. **Trasforma i dati**: aggiunge uno status (`normale` / `attenzione` / `critico`) a ogni inquinante confrontandolo con le soglie WHO/UE
5. **Genera suggerimenti civici** personalizzati collegati ai Goal dell'Agenda 2030
6. **Risponde** con un JSON compatto e già interpretato

Esempio di risposta:
```json
{
  "city": { "name": "Roma", "country": "IT", "lat": 41.89, "lon": 12.51 },
  "aqi": { "index": 2, "label": "Discreto", "color": "info", "emoji": "🔵" },
  "pollutants": {
    "pm2_5": { "value": 18.4, "unit": "μg/m³", "status": "normale" },
    "no2":   { "value": 52.1, "unit": "μg/m³", "status": "attenzione" }
  },
  "civicTips": [
    { "goal": 11, "goalTitle": "Città Sostenibili", "text": "L'NO₂ elevato indica traffico intenso..." }
  ]
}
```

### `GET /api/obiettivi`

Restituisce i testi descrittivi dei Goal 3, 11 e 13 dell'Agenda 2030 con la spiegazione del loro collegamento alla qualità dell'aria. I dati sono statici (non cambiano), quindi il backend li serve direttamente senza chiamare servizi esterni.

---

## Come funziona il frontend (passo per passo)

1. L'utente scrive una città e preme "Analizza"
2. `main.js` valida l'input (minimo 2 caratteri, solo lettere)
3. Mostra un'animazione di caricamento
4. Chiama `fetch('/api/report/Roma')` — il nostro backend, non OpenWeatherMap
5. Riceve il JSON e aggiorna dinamicamente la pagina:
   - La **card AQI** con colore verde/giallo/rosso in base all'indice
   - La **griglia degli inquinanti** con il valore e lo status di ognuno
   - I **suggerimenti civici** collegati ai Goal Agenda 2030
6. Carica anche `/api/obiettivi` per mostrare le card informative in fondo

Tutto avviene senza ricaricare la pagina — è una **Single Page Application (SPA)**.

---

## Privacy e gestione dei dati

- Nessun dato personale viene raccolto o memorizzato
- Le ricerche per città sono anonime e non tracciate
- La API key è protetta nel backend e non è mai visibile al browser
- I dati ambientali sono pubblici e forniti da terze parti (OpenWeatherMap)

---

## Avvio del progetto

**Prerequisiti:** Node.js installato, account OpenWeatherMap con API key.

```bash
# 1. Installa le dipendenze
npm install

# 2. Crea il file .env con la tua API key
nano .env
# scrivi: OPENWEATHER_API_KEY=la_tua_key_qui

# 3. Avvia il server
node server/server.js
```

Apri il browser su **http://localhost:3000**

---

## Obiettivi Agenda 2030 trattati

| Goal | Titolo | Collegamento con l'aria |
|------|--------|------------------------|
| 3 | Salute e Benessere | PM₂.₅ e NO₂ causano malattie respiratorie e cardiovascolari |
| 11 | Città e Comunità Sostenibili | Il traffico urbano è la principale fonte di NO₂ nelle città |
| 13 | Lotta contro i Cambiamenti Climatici | CO e altri inquinanti sono anche gas serra |