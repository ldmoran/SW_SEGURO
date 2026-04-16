const express = require('express');
const {
  getReservas,
  getReservaById,
  createReserva,
  updateReserva
} = require('../controllers/reservasController');

const router = express.Router();

router.get('/', getReservas);
router.get('/:id', getReservaById);
router.post('/', createReserva);
router.put('/:id', updateReserva);

module.exports = router;
