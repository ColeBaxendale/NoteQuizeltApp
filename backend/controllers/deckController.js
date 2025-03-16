// backend/controllers/deckController.js
const Deck = require('../models/DeckSchema');
const Flashcard = require('../models/FlashCardSchema');
const axios = require('axios');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const GEMINI_API_URL = process.env.GEMINI_API_URL;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Set character limits (in characters)
// Free users: 40,000 characters (~10k tokens)
// Premium users: 100,000 characters (~25k tokens)
const MAX_CHAR_FREE = 40000;
const MAX_CHAR_PREMIUM = 100000;

async function generateFlashcardsFromNotes(notes, isPremium) {
  try {
    console.log(isPremium);
    
    // Build prompt
    const prompt = isPremium 
      ? `You are teaching first time students in this subject, make their notes easy to understand and generate question to answer flashcards from them. Return a valid JSON array of objects (each object having a 'question' and 'answer') without any markdown formatting, code fences, or extra characters. Notes: ${notes}`
      : `You are teaching first time students in this subject, make their notes easy to understand and generate question to answer flashcards from them. Return a valid JSON array of objects (each object having a 'question' and 'answer') without any markdown formatting, code fences, or extra characters. Limit the output to at most 50 flashcards. Notes: ${notes}`;
    

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);

    
    let generatedText = result.response.text();
    
    // Remove Markdown code fences if present
    if (generatedText.startsWith("```")) {
      const firstNewlineIndex = generatedText.indexOf("\n");
      generatedText = generatedText.substring(firstNewlineIndex + 1);
      generatedText = generatedText.replace(/```$/, "").trim();
    }
    
    // Sanitize control characters that might be causing JSON parsing issues
    generatedText = generatedText.replace(/[\x00-\x1F\x7F]/g, "");
    
    // Now try parsing the cleaned JSON string
    const flashcards = JSON.parse(generatedText);
    return flashcards;
  } catch (error) {
    console.error("Error generating flashcards:", error);
    return [];
  }
}


exports.createDeckWithFlashcards = async (req, res) => {
  try {
    const { title, content } = req.body;
    const userId = req.user.userId;
    // Determine the character limit based on premium status
    const limit = req.user.isPremium ? MAX_CHAR_PREMIUM : MAX_CHAR_FREE;

    if (content.length > limit) {
      return res.status(400).json({
        message: `Note content exceeds the limit of ${limit} characters for your account.`,
      });
    }

    // 1. Create the deck (without flashcards)
    const newDeck = new Deck({
      title,
      content,
      fileURL: "",
      user: userId,
      description: "Flashcards", // temporary description
      flashcards: [],
      updatedAt: Date.now()
    });
    await newDeck.save();

    // 2. Generate flashcards from the notes using the Gemini API
    const generatedFlashcards = await generateFlashcardsFromNotes(content, req.user.isPremium);

    // 3. Create flashcards in bulk, associating them with the deck's _id
    const flashcardsToInsert = generatedFlashcards.map(card => ({
      question: card.question,
      answer: card.answer,
      user: userId,
      deck: newDeck._id,
      createdAt: Date.now()
    }));

    const insertedFlashcards = await Flashcard.insertMany(flashcardsToInsert);

    // 4. Update the deck with the flashcard IDs and description including count
    newDeck.flashcards = insertedFlashcards.map(fc => fc._id);
    newDeck.description = `Flashcards - ${insertedFlashcards.length} cards`;
    await newDeck.save();

    return res.status(201).json({
      message: "Deck and flashcards created successfully",
      deck: newDeck,
      flashcards: insertedFlashcards,
    });
  } catch (error) {
    console.error("Error creating deck with flashcards:", error);
    return res.status(500).json({ message: error.message });
  }
};

exports.getUserDecks = async (req, res) => {
  try {
    const userId = req.user.userId;
    const decks = await Deck.find({ user: userId }).select('title description updatedAt');
    return res.status(200).json({ decks });
  } catch (error) {
    console.error("Error fetching decks:", error);
    return res.status(500).json({ message: error.message });
  }
};
