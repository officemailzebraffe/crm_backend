const express = require('express');
const {
  getLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
  updateLeadScore
} = require('../controllers/leadController');

const router = express.Router();
const { protect } = require('../middleware/auth');

router.route('/')
  .get(protect, getLeads)
  .post(protect, createLead);

router.route('/:id')
  .get(protect, getLead)
  .put(protect, updateLead)
  .delete(protect, deleteLead);

router.put('/:id/score', protect, updateLeadScore);

module.exports = router;
