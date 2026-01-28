const express = require('express');
const {
  getInteractions,
  getInteraction,
  createInteraction,
  updateInteraction,
  deleteInteraction
} = require('../controllers/interactionController');

const router = express.Router();
const { protect } = require('../middleware/auth');

router.route('/')
  .get(protect, getInteractions)
  .post(protect, createInteraction);

router.route('/:id')
  .get(protect, getInteraction)
  .put(protect, updateInteraction)
  .delete(protect, deleteInteraction);

module.exports = router;
