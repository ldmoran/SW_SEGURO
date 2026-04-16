const db = require('../config/db');

exports.getReservas = async (_req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM reservas ORDER BY id');
    return res.status(200).json(rows);
  } catch (error) {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

exports.getReservaById = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query('SELECT * FROM reservas WHERE id = $1', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    return res.status(200).json(rows[0]);
  } catch (error) {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

exports.createReserva = async (req, res) => {
  try {
    const { fecha_entrada, fecha_salida, num_huespedes, hotel_id, cliente_id } = req.body;

    if (!fecha_entrada || !fecha_salida || !hotel_id || !cliente_id) {
      return res.status(400).json({
        error: 'fecha_entrada, fecha_salida, hotel_id y cliente_id son obligatorios'
      });
    }

    const { rows } = await db.query(
      `INSERT INTO reservas (fecha_entrada, fecha_salida, num_huespedes, hotel_id, cliente_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [fecha_entrada, fecha_salida, num_huespedes ?? 1, hotel_id, cliente_id]
    );

    return res.status(201).json(rows[0]);
  } catch (error) {
    if (error.code === '23503') {
      return res.status(400).json({ error: 'hotel_id o cliente_id no existen' });
    }
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

exports.updateReserva = async (req, res) => {
  try {
    const { id } = req.params;
    const { fecha_entrada, fecha_salida, num_huespedes, hotel_id, cliente_id } = req.body;

    if (!fecha_entrada || !fecha_salida || !hotel_id || !cliente_id) {
      return res.status(400).json({
        error: 'fecha_entrada, fecha_salida, hotel_id y cliente_id son obligatorios'
      });
    }

    const { rows } = await db.query(
      `UPDATE reservas
       SET fecha_entrada = $1, fecha_salida = $2, num_huespedes = $3, hotel_id = $4, cliente_id = $5
       WHERE id = $6
       RETURNING *`,
      [fecha_entrada, fecha_salida, num_huespedes ?? 1, hotel_id, cliente_id, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    return res.status(200).json(rows[0]);
  } catch (error) {
    if (error.code === '23503') {
      return res.status(400).json({ error: 'hotel_id o cliente_id no existen' });
    }
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};
