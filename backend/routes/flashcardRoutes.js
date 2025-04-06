// routes/flashcardRoutes.js
const express = require('express');
const router = express.Router();
const flashcardsController = require('../controllers/flashcardController');
const authMiddleware = require('../config/authMiddleware');

// Update flashcard by ID
router.put('/:flashcardId', authMiddleware, flashcardsController.updateFlashcard);
router.delete('/:flashcardId', authMiddleware, flashcardsController.deleteFlashcard);
router.post("/add", authMiddleware, flashcardsController.createFlashcard);
module.exports = router;
