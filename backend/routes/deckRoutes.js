// backend/routes/deckRoutes.js
const express = require('express');
const router = express.Router();
const deckController = require('../controllers/deckController');
const authMiddleware = require('../config/authMiddleware');
require('dotenv').config();

// Create a new deck (existing route)
router.post('/create-deck-flashcards', authMiddleware, deckController.createDeckWithFlashcards);
router.post('/create-deck-summary', authMiddleware, deckController.createDeckWithSummary);
// Get all decks for the logged-in user
router.get('/user-decks', authMiddleware, deckController.getUserDecks);
router.get('/:id', authMiddleware, deckController.getDeckById);
router.patch('/:id', authMiddleware, deckController.renameDeck);
router.delete('/:id', authMiddleware, deckController.deleteDeck);



module.exports = router;
