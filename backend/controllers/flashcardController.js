// controllers/flashcardsController.js
const Flashcard = require("../models/FlashCardSchema");
const Deck = require('../models/DeckSchema');

exports.updateFlashcard = async (req, res) => {
  const { flashcardId } = req.params;
  const updateData = req.body; // e.g. { question: "new question" } or { answer: "new answer" }

  try {
    const flashcard = await Flashcard.findById(flashcardId);
    if (!flashcard) {
      return res.status(404).json({ message: "Flashcard not found" });
    }

    // Check authorization
    if (flashcard.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Update flashcard fields
    Object.keys(updateData).forEach((field) => {
      flashcard[field] = updateData[field];
    });
    await flashcard.save();

    // Update the deck's updatedAt field
    await Deck.findByIdAndUpdate(flashcard.deck, { updatedAt: Date.now() });

    res.status(200).json({ message: "Flashcard updated", flashcard });
  } catch (error) {
    console.error("Error updating flashcard:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.deleteFlashcard = async (req, res) => {
  const { flashcardId } = req.params;
  try {
    const flashcard = await Flashcard.findById(flashcardId);
    if (!flashcard) {
      return res.status(404).json({ message: "Flashcard not found" });
    }

    // Check if the user is authorized to delete this flashcard
    if (flashcard.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Remove the flashcard reference from its Deck and update updatedAt.
    // Set new: true so we get the updated deck document.
    const updatedDeck = await Deck.findByIdAndUpdate(
      flashcard.deck,
      {
        $pull: { flashcards: flashcard._id },
        $set: { updatedAt: Date.now() }
      },
      { new: true }
    );

    await flashcard.deleteOne();

    res.status(200).json({ message: "Flashcard deleted" });
  } catch (error) {
    console.error("Error deleting flashcard:", error);
    res.status(500).json({ message: error.message });
  }
};

  

  
  exports.createFlashcard = async (req, res) => {
    try {
      const { question, answer, deck } = req.body;
      const userId = req.user.userId; // Set by your auth middleware
  
      // Validate required fields
      if (!question || !answer || !deck) {
        return res.status(400).json({ message: "Missing required fields" });
      }
  
      // Create new flashcard document
      const newFlashcard = new Flashcard({
        question,
        answer,
        deck,
        user: userId,
      });
  
      await newFlashcard.save();
  
      // Update the deck's flashcards array and updatedAt field
      await Deck.findByIdAndUpdate(deck, {
        $push: { flashcards: newFlashcard._id },
        $set: { updatedAt: Date.now() },
      });
  
      res.status(201).json({ message: "Flashcard created", flashcard: newFlashcard });
    } catch (error) {
      console.error("Error creating flashcard:", error);
      res.status(500).json({ message: error.message });
    }
  };
  