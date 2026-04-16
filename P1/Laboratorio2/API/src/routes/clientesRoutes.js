const express = require('express');
const {
  getClientes,
  getClienteById,
  createCliente,
  updateCliente
} = require('../controllers/clientesController');

const router = express.Router();

router.get('/', getClientes);
router.get('/:id', getClienteById);
router.post('/', createCliente);
router.put('/:id', updateCliente);

module.exports = router;
