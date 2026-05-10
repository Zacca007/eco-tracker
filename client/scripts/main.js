/**
 * Eco-Tracker 2030 — Frontend SPA
 * Gestisce la ricerca, le chiamate al backend Express,
 * e il rendering dinamico dei risultati nel DOM.
 */

// ─── Riferimenti DOM ────────────────────────────────────────
const cityInput   = document.getElementById('cityInput');
const searchBtn   = document.getElementById('searchBtn');
const searchError = document.getElementById('searchError');

const stateEmpty   = document.getElementById('stateEmpty');
const stateLoading = document.getElementById('stateLoading');
const stateResults = document.getElementById('stateResults');

const aqiCard        = document.getElementById('aqiCard');
const aqiEmoji       = document.getElementById('aqiEmoji');
const aqiIndex       = document.getElementById('aqiIndex');
const cityNameEl     = document.getElementById('cityName');
const aqiLabel       = document.getElementById('aqiLabel');
const aqiDescription = document.getElementById('aqiDescription');
const aqiTimestamp   = document.getElementById('aqiTimestamp');
const aqiCountry     = document.getElementById('aqiCountry');
const pollutantsGrid = document.getElementById('pollutantsGrid');
const civicTips      = document.getElementById('civicTips');
const goalsGrid      = document.getElementById('goalsGrid');

// ─── Utilità ────────────────────────────────────────────────

/**
 * Mostra uno solo degli stati UI: empty | loading | results
 */
function showState(state) {
  stateEmpty.classList.add('d-none');
  stateLoading.classList.add('d-none');
  stateResults.classList.add('d-none');
  if (state === 'empty')   stateEmpty.classList.remove('d-none');
  if (state === 'loading') stateLoading.classList.remove('d-none');
  if (state === 'results') stateResults.classList.remove('d-none');
}

function showError(msg) {
  searchError.textContent = '⚠ ' + msg;
  searchError.classList.remove('d-none');
}

function clearError() {
  searchError.textContent = '';
  searchError.classList.add('d-none');
}

/**
 * Formatta la data ISO in italiano leggibile.
 */
function formatTimestamp(isoString) {
  const d = new Date(isoString);
  return d.toLocaleString('it-IT', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── Rendering ──────────────────────────────────────────────

/**
 * Popola la card AQI principale con i colori corretti.
 */
function renderAQICard(data) {
  // Rimuovi classi AQI precedenti
  aqiCard.className = 'eco-aqi-card';
  aqiCard.classList.add(`aqi-${data.aqi.color}`);

  aqiEmoji.textContent = data.aqi.emoji;
  aqiIndex.textContent = `Indice AQI: ${data.aqi.index} / 5`;
  cityNameEl.textContent = `${data.city.name}`;
  aqiLabel.textContent = data.aqi.label;
  aqiLabel.className = `eco-aqi-label aqi-${data.aqi.color}`;
  aqiDescription.textContent = data.aqi.description;
  aqiTimestamp.textContent = formatTimestamp(data.timestamp);
  aqiCountry.textContent = `Paese: ${data.city.country} · ${data.city.lat.toFixed(2)}°N, ${data.city.lon.toFixed(2)}°E`;
}

/**
 * Renderizza la griglia degli inquinanti.
 */
function renderPollutants(pollutants) {
  pollutantsGrid.innerHTML = '';

  Object.entries(pollutants).forEach(([key, p]) => {
    const col = document.createElement('div');
    col.className = 'col-6 col-md-4 col-lg-3';

    col.innerHTML = `
      <div class="eco-pollutant-card status-${p.status}">
        <div class="eco-pollutant-name">${p.label}</div>
        <div class="eco-pollutant-value">
          ${p.value.toFixed(2)}<span class="eco-pollutant-unit">${p.unit}</span>
        </div>
        <div class="eco-pollutant-status">${p.status}</div>
      </div>
    `;
    pollutantsGrid.appendChild(col);
  });
}

/**
 * Renderizza i suggerimenti civici collegati all'Agenda 2030.
 */
function renderCivicTips(tips) {
  civicTips.innerHTML = '';

  tips.forEach(tip => {
    const col = document.createElement('div');
    col.className = 'col-md-6';

    col.innerHTML = `
      <div class="eco-civic-card">
        <div class="eco-civic-goal goal-${tip.goal}">
          ${tip.icon} Goal ${tip.goal} — ${tip.goalTitle}
        </div>
        <p class="eco-civic-text mb-0">${tip.text}</p>
      </div>
    `;
    civicTips.appendChild(col);
  });
}

/**
 * Carica e renderizza le card degli obiettivi Agenda 2030.
 * Chiamata separata all'endpoint /api/obiettivi.
 */
async function loadAndRenderGoals() {
  // Se già caricati, non ricaricare
  if (goalsGrid.dataset.loaded === 'true') return;

  try {
    const res  = await fetch('/api/obiettivi');
    const data = await res.json();

    goalsGrid.innerHTML = '';
    const colors = { 3: '#4CAF50', 11: '#FF9800', 13: '#2196F3' };

    data.obiettivi.forEach(goal => {
      const col = document.createElement('div');
      col.className = 'col-md-4';
      const color = colors[goal.numero] || 'var(--eco-green)';

      col.innerHTML = `
        <div class="eco-goal-card">
          <div class="eco-goal-number" style="color:${color}">${goal.numero}</div>
          <div class="eco-goal-title" style="color:${color}">${goal.icona} ${goal.titolo}</div>
          <p class="eco-goal-desc">${goal.descrizione}</p>
          <p class="eco-goal-desc mt-2">${goal.connessione_aria}</p>
          <div class="eco-goal-target" style="border-color:${color}">${goal.target_chiave}</div>
        </div>
      `;
      goalsGrid.appendChild(col);
    });

    goalsGrid.dataset.loaded = 'true';
  } catch (err) {
    console.error('Impossibile caricare gli obiettivi:', err);
  }
}

// ─── Logica principale ───────────────────────────────────────

/**
 * Validazione lato client (ridondante rispetto al backend,
 * ma migliora la UX evitando richieste inutili).
 */
function validateInput(city) {
  if (!city || city.trim().length < 2) return 'Inserisci almeno 2 caratteri.';
  if (city.length > 80)               return 'Nome troppo lungo (max 80 caratteri).';
  if (!/^[\p{L}\s\-']+$/u.test(city)) return 'Caratteri non validi nel nome città.';
  return null;
}

/**
 * Esegue la ricerca: chiama il backend, renderizza i risultati.
 */
async function search() {
  const city = cityInput.value.trim();
  clearError();

  // Validazione client-side
  const validationError = validateInput(city);
  if (validationError) {
    showError(validationError);
    return;
  }

  // UI loading
  searchBtn.disabled = true;
  showState('loading');

  try {
    // Chiamata al nostro backend Express (non direttamente a OpenWeatherMap)
    const res = await fetch(`/api/report/${encodeURIComponent(city)}`);

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: 'Errore sconosciuto.' }));
      throw new Error(errData.error || `Errore HTTP ${res.status}`);
    }

    const data = await res.json();

    // Renderizza tutto
    renderAQICard(data);
    renderPollutants(data.pollutants);
    renderCivicTips(data.civicTips);
    await loadAndRenderGoals();

    showState('results');

    // Scroll verso i risultati su mobile
    stateResults.scrollIntoView({ behavior: 'smooth', block: 'start' });

  } catch (err) {
    showState('empty');
    showError(err.message || 'Impossibile recuperare i dati. Riprova.');
  } finally {
    searchBtn.disabled = false;
  }
}

// ─── Event Listeners ─────────────────────────────────────────

searchBtn.addEventListener('click', search);

cityInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') search();
});

// Suggerimenti rapidi cliccabili
document.querySelectorAll('.eco-goal-chip').forEach(chip => {
  chip.style.cursor = 'default';
});

// Inizializzazione
showState('empty');