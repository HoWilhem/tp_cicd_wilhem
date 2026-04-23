const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Stockage en mémoire (pas de base de données)
let weights = [];
let nextId = 1;

// Health check (requis par le TP)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'weight-tracker-api',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// GET tous les poids (triés par date décroissante)
app.get('/api/weights', (req, res) => {
  const sorted = [...weights].sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(sorted);
});

// POST ajouter un poids
app.post('/api/weights', (req, res) => {
  const { weight, date } = req.body;
  if (weight === undefined || weight === null || isNaN(Number(weight))) {
    return res.status(400).json({ error: 'Le poids est requis (nombre)' });
  }
  if (!date) {
    return res.status(400).json({ error: 'La date est requise' });
  }
  const entry = { id: nextId++, weight: Number(weight), date };
  weights.push(entry);
  res.status(201).json(entry);
});

// PUT modifier un enregistrement
app.put('/api/weights/:id', (req, res) => {
  const entry = weights.find(w => w.id === parseInt(req.params.id));
  if (!entry) return res.status(404).json({ error: 'Enregistrement non trouvé' });
  if (req.body.weight !== undefined) entry.weight = Number(req.body.weight);
  if (req.body.date !== undefined) entry.date = req.body.date;
  res.json(entry);
});

// DELETE supprimer un enregistrement
app.delete('/api/weights/:id', (req, res) => {
  const index = weights.findIndex(w => w.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Enregistrement non trouvé' });
  weights.splice(index, 1);
  res.json({ message: 'Supprimé' });
});

// Démarrer le serveur
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Weight Tracker API running on port ${PORT}`);
});

module.exports = app;
