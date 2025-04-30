// controllers/flashcardsController.js
const FlashcardSet = require("../models/FlashCardSchema");
const Deck = require('../models/DeckSchema');

// controllers/flashcardsController.js

exports.updateFlashcard = async (req, res) => {
  const { setId, flashcardId } = req.params;
  const updateData = req.body;        // e.g. { question: "new?" }
  const userId     = req.user.userId; // from your auth middleware

  try {
    // 1) Load the set and its deck-owner for auth
    const set = await FlashcardSet.findById(setId)
      .populate({ path: "deck", select: "user" });
    if (!set) {
      return res
        .status(404)
        .json({ message: "Flashcard set not found" });
    }
    if (set.deck.user.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Unauthorized" });
    }

    // 2) Perform the subdoc update
    const updatedSet = await FlashcardSet.findOneAndUpdate(
      { 
        _id: setId, 
        "flashcards._id": flashcardId 
      },
      {
        $set: {
          // Map each field → its positional path
          ...Object.entries(updateData).reduce((acc, [key, val]) => {
            acc[`flashcards.$.${key}`] = val;
            return acc;
          }, {}),
          updatedAt: Date.now()
        }
      },
      { new: true, runValidators: true }
    );

    if (!updatedSet) {
      // The card ID wasn’t found in that set
      return res
        .status(404)
        .json({ message: "Flashcard not found in set" });
    }

    // 3) Bump the parent Deck’s updatedAt
    await Deck.findByIdAndUpdate(set.deck._id, {
      updatedAt: Date.now()
    });

    // 4) Extract and return the updated subdocument
    const updatedFlashcard = updatedSet.flashcards.id(flashcardId);
    return res.json({
      message: "Flashcard updated",
      flashcard: updatedFlashcard
    });

  } catch (error) {
    console.error("Error updating flashcard:", error);
    return res
      .status(500)
      .json({ message: "Server error" });
  }
};


// controllers/flashcardsController.js

exports.deleteFlashcard = async (req, res) => {
  const { setId, flashcardId } = req.params;
  const userId = req.user.userId;

  try {
    // 1) Load the set and its deck-owner to enforce auth
    const set = await FlashcardSet.findById(setId).populate({
      path: "deck",
      select: "user"
    });
    if (!set) {
      return res.status(404).json({ message: "Flashcard set not found" });
    }
    if (set.deck.user.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // 2) Now remove the subdoc, adjust length, stamp updatedAt
    const updatedSet = await FlashcardSet.findByIdAndUpdate(
      setId,
      {
        $pull: { flashcards: { _id: flashcardId } },
        $inc:  { length: -1 },
        $set:  { updatedAt: Date.now() }
      },
      { new: true }
    );

    if (!updatedSet) {
      // flashcardId wasn’t in the array
      return res.status(404).json({ message: "Flashcard not found in set" });
    }

    // 3) Also bump the parent Deck’s updatedAt
    await Deck.findByIdAndUpdate(set.deck._id, { updatedAt: Date.now() });

    return res.json({ message: "Flashcard deleted" });
  } catch (error) {
    console.error("Error deleting flashcard:", error);
    return res.status(500).json({ message: error.message });
  }
};



  

  
// controllers/flashcardsController.js

exports.createFlashcard = async (req, res) => {
  const { setId } = req.params;           // <-- from URL, not body
  const { question, answer } = req.body;
  const userId = req.user.userId;

  // 1) Validate
  if (!question?.trim() || !answer?.trim()) {
    return res.status(400).json({ message: "Question and answer are required" });
  }

  try {
    // 2) Load the set and its deck-owner
    const set = await FlashcardSet.findById(setId)
      .populate({ path: "deck", select: "user" });
    if (!set) {
      return res.status(404).json({ message: "Flashcard set not found" });
    }
    if (set.deck.user.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // 3) Push the new card
    const updatedSet = await FlashcardSet.findByIdAndUpdate(
      setId,
      {
        $push: { flashcards: { question, answer } },
        $inc:  { length: 1 },
        $set:  { updatedAt: Date.now() }
      },
      { new: true, runValidators: true }
    );

    // 4) Bump the parent Deck’s updatedAt
    await Deck.findByIdAndUpdate(set.deck._id, { updatedAt: Date.now() });

    // 5) Grab the last‐pushed flashcard
    const newFlashcard = updatedSet.flashcards.at(-1);

    return res.status(201).json({
      message: "Flashcard created",
      flashcard: newFlashcard
    });
  } catch (error) {
    console.error("Error creating flashcard:", error);
    return res.status(500).json({ message: error.message });
  }
};


  exports.getFlashcards = async (req, res) => {
    const { setId } = req.params;
    const userId    = req.user.userId;
  
    try {
      // 1) Fetch the FlashcardSet and populate its deck
      const set = await FlashcardSet.findById(setId)
        .populate({ 
          path: "deck", 
          select: "title user" 
        });
  
      if (!set) {
        return res.status(404).json({ message: "Flashcard set not found" });
      }
  
      // 2) Authorization: only owner of the deck may view
      if (set.deck.user.toString() !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
  
      // 3) Send back the set metadata and cards
      return res.status(200).json({
        id:        set._id,
        setTitle:  set.setTitle,
        deck: {
          id:    set.deck._id,
          title: set.deck.title
        },
        flashcards: set.flashcards   // array of { question, answer }
      });
    } catch (err) {
      console.error("Error fetching flashcard set:", err);
      return res.status(500).json({ message: err.message });
    }
  };



  exports.updateFlashcardSet = async (req, res) => {
    const { setId }    = req.params;
    const { setTitle } = req.body;
    const userId = req.user.userId;

  
    if (!setTitle) {
      return res.status(400).json({ message: "Missing setTitle" });
    }
  
    try {
      // 1) Find the set and populate its deck to check ownership
      const set = await FlashcardSet.findById(setId).populate("deck", "user");
      if (!set) {
        return res.status(404).json({ message: "Flashcard set not found" });
      }
      if (set.deck.user.toString() !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
  
      // 2) Update the title and stamp updatedAt on both set & deck
      set.setTitle = setTitle;
      await set.save();
  
      await Deck.findByIdAndUpdate(set.deck._id, { updatedAt: Date.now() });
  
      res.json({ message: "Flashcard set renamed", flashcardSet: set });
    } catch (err) {
      console.error("Error renaming flashcard set:", err);
      res.status(500).json({ message: err.message });
    }
  };
  
  /**
   * DELETE /flashcard-sets/:setId
   */
  exports.deleteFlashcardSet = async (req, res) => {
    const { setId } = req.params;
    const userId = req.user.userId;
  
    try {
      // 1) Find the set and populate deck to check user
      const set = await FlashcardSet.findById(setId).populate("deck", "user flashcardSets");
      if (!set) {
        return res.status(404).json({ message: "Flashcard set not found" });
      }
      if (set.deck.user.toString() !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
  
      // 2) Remove the set document
      await FlashcardSet.findByIdAndDelete(setId);
  
      // 3) Optionally remove from deck.flashcardSets array & update updatedAt
      await Deck.findByIdAndUpdate(
        set.deck._id,
        {
          $pull: { flashcardSets: setId },
          $set:  { updatedAt: Date.now() }
        },
        { new: true }
      );
  
      res.json({ message: "Flashcard set deleted" });
    } catch (err) {
      console.error("Error deleting flashcard set:", err);
      res.status(500).json({ message: err.message });
    }
  };