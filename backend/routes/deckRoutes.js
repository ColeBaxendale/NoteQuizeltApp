// backend/routes/deckRoutes.js
const express = require('express');
const router = express.Router();
const deckController = require('../controllers/deckController');
const authMiddleware = require('../config/authMiddleware');
require('dotenv').config();

router.post(
  '/create-deck',
  authMiddleware,
  deckController.createDeck
);

module.exports = router;
