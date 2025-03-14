// backend/controllers/deckController.js

const Deck = require('../models/DeckSchema');


exports.createDeck = async (req, res) => {
    try {
      const { title, content } = req.body;
  
      // Create a new deck. The user is taken from the JWT middleware (req.user.userId)
      const newDeck = new Deck({
        title,
        content,
        user: req.user.userId,
        updatedAt: Date.now()
      });
  
      await newDeck.save();
  
      return res.status(201).json({
        message: "Deck created successfully",
        deck: newDeck
      });
    } catch (error) {
      console.error("Error creating deck:", error);
      return res.status(500).json({ message: error.message });
    }
  };
