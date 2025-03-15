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
        description: "Blank Set",
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


  exports.getUserDecks = async (req, res) => {
    try {
      // Get userId from the authenticated request (set by auth middleware)
      const userId = req.user.userId;
      // Find decks for this user, selecting only the title and updatedAt fields
      const decks = await Deck.find({ user: userId }).select('title description updatedAt');
      return res.status(200).json({ decks });
    } catch (error) {
      console.error("Error fetching decks:", error);
      return res.status(500).json({ message: error.message });
    }
  };
