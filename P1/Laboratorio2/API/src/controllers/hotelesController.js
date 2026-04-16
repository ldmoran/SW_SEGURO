const db = require('../config/db');

exports.getHoteles = async (_req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM hoteles ORDER BY id');
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

exports.getHotelById = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query('SELECT * FROM hoteles WHERE id = $1', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Hotel no encontrado' });
    }

    return res.status(200).json(rows[0]);
  } catch (error) {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

exports.createHotel = async (req, res) => {
  try {
    const { nombre, direccion, estrellas, telefono } = req.body;

    if (!nombre || !direccion) {
      return res.status(400).json({ error: 'nombre y direccion son obligatorios' });
    }

    const { rows } = await db.query(
      'INSERT INTO hoteles (nombre, direccion, estrellas, telefono) VALUES ($1, $2, $3, $4) RETURNING *',
      [nombre, direccion, estrellas ?? null, telefono ?? null]
    );

    return res.status(201).json(rows[0]);
  } catch (error) {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

exports.updateHotel = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, direccion, estrellas, telefono } = req.body;

    if (!nombre || !direccion) {
      return res.status(400).json({ error: 'nombre y direccion son obligatorios' });
    }

    const { rows } = await db.query(
      'UPDATE hoteles SET nombre = $1, direccion = $2, estrellas = $3, telefono = $4 WHERE id = $5 RETURNING *',
      [nombre, direccion, estrellas ?? null, telefono ?? null, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Hotel no encontrado' });
    }

    return res.status(200).json(rows[0]);
  } catch (error) {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};
