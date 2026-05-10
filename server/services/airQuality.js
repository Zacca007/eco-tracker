const fetch = (...args) =>
  import('node-fetch').then(({ default: f }) => f(...args));

const OWM_KEY = process.env.OPENWEATHER_API_KEY;
const OWM_BASE = 'https://api.openweathermap.org';

/**
 * Trasforma il nome di una città in coordinate geografiche.
 * Usa l'API Geocoding di OpenWeatherMap.
 * Scelta di questa fonte: OpenWeatherMap è un servizio professionale, documentato,
 * con SLA dichiarati e usato da applicazioni industriali — più affidabile di
 * soluzioni amatoriali o dataset statici non aggiornati.
 *
 * @param {string} city - Nome della città
 * @returns {{ lat: number, lon: number, country: string, name: string }}
 */
async function geocodeCity(city) {
  const url = `${OWM_BASE}/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${OWM_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Geocoding HTTP error: ${res.status}`);
  const data = await res.json();
  if (!data.length) throw new Error(`Città non trovata: "${city}"`);
  const { lat, lon, country, name, local_names } = data[0];
  return { lat, lon, country, name: local_names?.it || name };
}

/**
 * Recupera i dati di qualità dell'aria dalle coordinate.
 * API Air Pollution di OpenWeatherMap — fornisce AQI e concentrazioni
 * di CO, NO, NO2, O3, SO2, PM2.5, PM10, NH3.
 *
 * @param {number} lat
 * @param {number} lon
 * @returns {object} raw pollution data
 */
async function fetchAirPollution(lat, lon) {
  const url = `${OWM_BASE}/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OWM_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Air Pollution API HTTP error: ${res.status}`);
  const data = await res.json();
  return data.list[0]; // dati più recenti
}

/**
 * Converte l'indice AQI numerico (1-5) in una valutazione leggibile.
 * Scala ufficiale OpenWeatherMap / EU AQI:
 * 1 = Buono, 2 = Discreto, 3 = Moderato, 4 = Scarso, 5 = Pessimo
 */
function interpretAQI(aqi) {
  const levels = {
    1: { label: 'Buono',    color: 'success', emoji: '🟢', description: 'La qualità dell\'aria è soddisfacente e non presenta rischi per la salute.' },
    2: { label: 'Discreto', color: 'info',    emoji: '🔵', description: 'La qualità dell\'aria è accettabile. Possibili leggeri rischi per persone molto sensibili.' },
    3: { label: 'Moderato', color: 'warning', emoji: '🟡', description: 'Persone sensibili potrebbero avvertire effetti sulla salute. Il pubblico generale è meno a rischio.' },
    4: { label: 'Scarso',   color: 'orange',  emoji: '🟠', description: 'Tutti possono iniziare ad avvertire effetti sulla salute. Limitare le attività all\'aperto.' },
    5: { label: 'Pessimo',  color: 'danger',  emoji: '🔴', description: 'Avvisi sanitari in emergenza. L\'intera popolazione è a rischio. Evitare attività all\'aperto.' },
  };
  return levels[aqi] || levels[3];
}

/**
 * Valutazione critica di ogni inquinante rispetto alle soglie WHO/EU.
 * Questo step di "Data Transformation" è il valore aggiunto del nostro backend:
 * invece di esporre dati grezzi, aggiungiamo significato contestuale.
 */
function evaluatePollutants(components) {
  const { co, no, no2, o3, so2, pm2_5, pm10, nh3 } = components;

  return {
    co:    { value: co,    unit: 'μg/m³', label: 'Monossido di Carbonio (CO)',    status: co    > 10000 ? 'critico' : co    > 4000 ? 'attenzione' : 'normale' },
    no2:   { value: no2,   unit: 'μg/m³', label: 'Biossido di Azoto (NO₂)',       status: no2   > 200  ? 'critico' : no2   > 40   ? 'attenzione' : 'normale' },
    o3:    { value: o3,    unit: 'μg/m³', label: 'Ozono (O₃)',                    status: o3    > 180  ? 'critico' : o3    > 100  ? 'attenzione' : 'normale' },
    so2:   { value: so2,   unit: 'μg/m³', label: 'Biossido di Zolfo (SO₂)',       status: so2   > 350  ? 'critico' : so2   > 20   ? 'attenzione' : 'normale' },
    pm2_5: { value: pm2_5, unit: 'μg/m³', label: 'Polveri Sottili (PM₂.₅)',      status: pm2_5 > 75   ? 'critico' : pm2_5 > 25   ? 'attenzione' : 'normale' },
    pm10:  { value: pm10,  unit: 'μg/m³', label: 'Polveri Grossolane (PM₁₀)',    status: pm10  > 150  ? 'critico' : pm10  > 50   ? 'attenzione' : 'normale' },
    nh3:   { value: nh3,   unit: 'μg/m³', label: 'Ammoniaca (NH₃)',              status: nh3   > 200  ? 'critico' : nh3   > 80   ? 'attenzione' : 'normale' },
  };
}

/**
 * Genera suggerimenti civici personalizzati in base ai dati.
 * Collega i valori agli obiettivi dell'Agenda 2030.
 */
function generateCivicTips(pollutants, cityName) {
  const tips = [];

  if (pollutants.pm2_5.status !== 'normale') {
    tips.push({
      goal: 3,
      goalTitle: 'Salute e Benessere',
      icon: '🏥',
      text: `Il PM₂.₅ a ${cityName} (${pollutants.pm2_5.value.toFixed(1)} μg/m³) supera le soglie raccomandate dall'OMS (25 μg/m³). Le polveri ultrafini penetrano nei polmoni e nel sangue. Usa mascherine FFP2 nelle ore di punta del traffico.`,
    });
  }

  if (pollutants.no2.status !== 'normale') {
    tips.push({
      goal: 11,
      goalTitle: 'Città e Comunità Sostenibili',
      icon: '🏙️',
      text: `L'NO₂ elevato (${pollutants.no2.value.toFixed(1)} μg/m³) indica traffico veicolare intenso. Il Goal 11 dell'Agenda 2030 chiede città inclusive e sostenibili: considera trasporti pubblici o bicicletta.`,
    });
  }

  if (pollutants.co.status !== 'normale') {
    tips.push({
      goal: 13,
      goalTitle: 'Lotta contro i Cambiamenti Climatici',
      icon: '🌍',
      text: `Il CO elevato (${(pollutants.co.value / 1000).toFixed(2)} mg/m³) è legato alla combustione incompleta di carburanti fossili — principale causa del cambiamento climatico. Il Goal 13 richiede azioni urgenti.`,
    });
  }

  if (tips.length === 0) {
    tips.push({
      goal: 11,
      goalTitle: 'Città e Comunità Sostenibili',
      icon: '✅',
      text: `Oggi l'aria a ${cityName} è nella norma. Contribuisci a mantenerla così: scegli i mezzi pubblici, limita i riscaldamenti a combustibile fossile e pianta alberi nel tuo quartiere.`,
    });
  }

  return tips;
}

/**
 * Funzione principale di orchestrazione.
 * Sequenza: Geocoding → Air Pollution → Trasformazione → Risposta arricchita
 */
async function getAirReport(city) {
  const geo = await geocodeCity(city);
  const pollution = await fetchAirPollution(geo.lat, geo.lon);

  const aqi = pollution.main.aqi;
  const aqiInfo = interpretAQI(aqi);
  const pollutants = evaluatePollutants(pollution.components);
  const civicTips = generateCivicTips(pollutants, geo.name);

  return {
    city: {
      name: geo.name,
      country: geo.country,
      lat: geo.lat,
      lon: geo.lon,
    },
    aqi: {
      index: aqi,
      ...aqiInfo,
    },
    pollutants,
    civicTips,
    timestamp: new Date().toISOString(),
  };
}

module.exports = { getAirReport };