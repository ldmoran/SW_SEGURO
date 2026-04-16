const db = require('../config/db');

exports.getClientes = async (_req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM clientes ORDER BY id');
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

exports.getClienteById = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query('SELECT * FROM clientes WHERE id = $1', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    return res.status(200).json(rows[0]);
  } catch (error) {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

exports.createCliente = async (req, res) => {
  try {
    const { nombre, email, telefono } = req.body;

    if (!nombre || !email) {
      return res.status(400).json({ error: 'nombre y email son obligatorios' });
    }

    const { rows } = await db.query(
      'INSERT INTO clientes (nombre, email, telefono) VALUES ($1, $2, $3) RETURNING *',
      [nombre, email, telefono ?? null]
    );

    return res.status(201).json(rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'El email ya existe' });
    }
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

exports.updateCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, telefono } = req.body;

    if (!nombre || !email) {
      return res.status(400).json({ error: 'nombre y email son obligatorios' });
    }

    const { rows } = await db.query(
      'UPDATE clientes SET nombre = $1, email = $2, telefono = $3 WHERE id = $4 RETURNING *',
      [nombre, email, telefono ?? null, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    return res.status(200).json(rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'El email ya existe' });
    }
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};
