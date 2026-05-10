const express = require('express');
const router = express.Router();
const { getAirReport } = require('../services/airQuality');

/**
 * GET /api/report/:citta
 * Restituisce il report completo di qualità dell'aria per una città.
 *
 * Validazione: il nome città deve essere una stringa alfabetica (con spazi e
 * caratteri accentati) tra 2 e 80 caratteri. Questo previene injection o
 * richieste malformate prima ancora di chiamare le API esterne.
 */
router.get('/:citta', async (req, res) => {
  const { citta } = req.params;

  // Validazione input
  if (!citta || citta.trim().length < 2) {
    return res.status(400).json({ error: 'Nome città troppo corto (minimo 2 caratteri).' });
  }
  if (citta.length > 80) {
    return res.status(400).json({ error: 'Nome città troppo lungo (massimo 80 caratteri).' });
  }
  // Accetta lettere (incluse accentate), spazi, trattini e apostrofi
  if (!/^[\p{L}\s\-']+$/u.test(citta.trim())) {
    return res.status(400).json({ error: 'Nome città contiene caratteri non validi.' });
  }

  // Controlla che la API key sia configurata
  if (!process.env.OPENWEATHER_API_KEY) {
    return res.status(503).json({
      error: 'API key di OpenWeatherMap non configurata. Aggiungi OPENWEATHER_API_KEY nel file .env',
    });
  }

  try {
    const report = await getAirReport(citta.trim());
    res.json(report);
  } catch (err) {
    console.error('Errore getAirReport:', err.message);

    if (err.message.includes('non trovata')) {
      return res.status(404).json({ error: `Città "${citta}" non trovata. Verifica il nome e riprova.` });
    }

    res.status(500).json({ error: 'Errore nel recupero dei dati. Riprova più tardi.' });
  }
});

module.exports = router;