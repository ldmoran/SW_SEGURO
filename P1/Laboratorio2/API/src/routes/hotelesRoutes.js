const express = require('express');
const {
  getHoteles,
  getHotelById,
  createHotel,
  updateHotel
} = require('../controllers/hotelesController');

const router = express.Router();

router.get('/', getHoteles);
router.get('/:id', getHotelById);
router.post('/', createHotel);
router.put('/:id', updateHotel);

module.exports = router;
