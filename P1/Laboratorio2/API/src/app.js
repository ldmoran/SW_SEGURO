require('dotenv').config();
const express = require('express');
const db = require('./config/db');

const hotelesRoutes = require('./routes/hotelesRoutes');
const clientesRoutes = require('./routes/clientesRoutes');
const reservasRoutes = require('./routes/reservasRoutes');

const app = express();

app.use(express.json());

app.get('/health', async (_req, res) => {
  try {
    await db.query('SELECT 1');
    return res.status(200).json({ status: 'ok', db: 'connected' });
  } catch (error) {
    return res.status(500).json({ status: 'error', db: 'disconnected' });
  }
});

app.use('/api/hoteles', hotelesRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/reservas', reservasRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

module.exports = app;
