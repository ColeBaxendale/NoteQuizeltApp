// backend/routes/deckRoutes.js
const express = require('express');
const router = express.Router();
const deckController = require('../controllers/deckController');
const authMiddleware = require('../config/authMiddleware');
require('dotenv').config();

// Create a new deck (existing route)
router.post('/create-deck', authMiddleware, deckController.createDeck);

// Get all decks for the logged-in user
router.get('/user-decks', authMiddleware, deckController.getUserDecks);

module.exports = router;
