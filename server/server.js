require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const reportRouter = require('./routes/report');
const goalsRouter = require('./routes/goals');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../client/pages')));
app.use('/styles', express.static(path.join(__dirname, '../client/styles')));
app.use('/scripts', express.static(path.join(__dirname, '../client/scripts')));

// API Routes
app.use('/api/report', reportRouter);
app.use('/api/obiettivi', goalsRouter);

// Fallback: serve index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/index.html'));
});

app.listen(PORT, () => {
  console.log(`🌱 Eco-Tracker 2030 server running on http://localhost:${PORT}`);
});