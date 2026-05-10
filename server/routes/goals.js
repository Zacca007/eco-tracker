const express = require('express');
const router = express.Router();

/**
 * GET /api/obiettivi
 * Restituisce i testi descrittivi degli obiettivi 3, 11 e 13 dell'Agenda 2030
 * rilevanti per la qualità dell'aria e la sostenibilità urbana.
 *
 * I dati sono statici (non cambiano frequentemente) quindi non richiedono
 * una fonte esterna — il backend li serve direttamente.
 */
router.get('/', (req, res) => {
  const obiettivi = [
    {
      numero: 3,
      titolo: 'Salute e Benessere',
      colore: '#4CAF50',
      icona: '🏥',
      descrizione: 'Garantire una vita sana e promuovere il benessere per tutti, a tutte le età.',
      connessione_aria: 'L\'inquinamento atmosferico causa 7 milioni di morti premature all\'anno (OMS). PM₂.₅ e NO₂ sono legati a malattie respiratorie, cardiovascolari e tumori polmonari.',
      target_chiave: 'Target 3.9: Ridurre sostanzialmente il numero di morti e malattie da sostanze chimiche pericolose e da inquinamento di aria, acqua e suolo.',
    },
    {
      numero: 11,
      titolo: 'Città e Comunità Sostenibili',
      colore: '#FF9800',
      icona: '🏙️',
      descrizione: 'Rendere le città e gli insediamenti umani inclusivi, sicuri, duraturi e sostenibili.',
      connessione_aria: 'Il traffico urbano è la principale fonte di NO₂ e PM nelle città. La pianificazione urbana sostenibile — con piste ciclabili, aree verdi e trasporti pubblici efficienti — riduce direttamente l\'inquinamento.',
      target_chiave: 'Target 11.6: Entro il 2030, ridurre l\'impatto ambientale negativo pro capite delle città, con particolare attenzione alla qualità dell\'aria e alla gestione dei rifiuti.',
    },
    {
      numero: 13,
      titolo: 'Lotta contro i Cambiamenti Climatici',
      colore: '#2196F3',
      icona: '🌍',
      descrizione: 'Adottare misure urgenti per combattere i cambiamenti climatici e le loro conseguenze.',
      connessione_aria: 'Molti inquinanti atmosferici (CO₂, CH₄, O₃ troposferico) sono anche gas serra. Ridurre le emissioni migliora simultaneamente la qualità dell\'aria locale e contrasta il riscaldamento globale.',
      target_chiave: 'Target 13.2: Integrare le misure di cambiamento climatico nelle politiche, strategie e pianificazioni nazionali.',
    },
  ];

  res.json({ obiettivi });
});

module.exports = router;