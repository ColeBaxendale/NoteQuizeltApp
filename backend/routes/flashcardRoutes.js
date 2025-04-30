// routes/flashcardRoutes.js
const express = require('express');
const router = express.Router();
const flashcardsController = require('../controllers/flashcardController');
const authMiddleware = require('../config/authMiddleware');

// Update flashcard by ID
router.put('/:setId/:flashcardId', authMiddleware, flashcardsController.updateFlashcard);
router.delete('/:setId/:flashcardId', authMiddleware, flashcardsController.deleteFlashcard);
router.post("/:setId/add", authMiddleware, flashcardsController.createFlashcard);
router.get("/:setId", authMiddleware, flashcardsController.getFlashcards);
router.patch("/set/:setId", authMiddleware, flashcardsController.updateFlashcardSet);
router.delete("/:setId", authMiddleware, flashcardsController.deleteFlashcardSet);
module.exports = router;
