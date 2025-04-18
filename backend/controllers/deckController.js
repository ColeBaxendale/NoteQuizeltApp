const OpenAI = require("openai");
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Deck = require("../models/DeckSchema");
const Flashcard = require("../models/FlashCardSchema");
const Summarization = require("../models/SummarizationSchema");
const Quiz = require("../models/QuizSchema");

require("dotenv").config();

const MAX_CHAR_FREE = 40000;
const MAX_CHAR_PREMIUM = 100000;
const FREE_CHUNK_SIZE = 20000; // Max 2 chunks for free
const PREMIUM_CHUNK_SIZE = 6000;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

function chunkNotes(notes, isPremium) {
  const size = isPremium ? PREMIUM_CHUNK_SIZE : FREE_CHUNK_SIZE;
  const chunks = [];
  let start = 0;
  while (start < notes.length) {
    const end = Math.min(start + size, notes.length);
    chunks.push(notes.slice(start, end));
    start = end;
  }
  return isPremium ? chunks : chunks.slice(0, 2); // free users limited to 2 chunks
}

const extractFirstJSONArray = (text) => {
  const arrayMatch = text.match(/\[[\s\S]*?\]/);
  if (arrayMatch) {
    return arrayMatch[0];
  } else {
    throw new Error("No JSON array found in response!");
  }
};

async function generateFlashcardsFromNotes(notes, isPremium, isExamEssentials, flashcardStyle) {
  const allFlashcards = [];
  const chunks = chunkNotes(notes, isPremium);

  const generationConfig = {
    temperature: 0,
    stopSequences: [],
  };

  const systemInstruction = {
    parts: [
      {
        text: `
You are a flashcard generator. Your ONLY task is to create flashcards in the requested format.
NEVER introduce yourself or reply conversationally.
NEVER include extra text or explanations.
NEVER INCLUDE MARKDOWN.
ONLY return a valid JSON array following this EXACT structure: [{"question": "string", "answer": "string"}].
      `.trim(),
      },
    ],
  };

  for (const chunk of chunks) {
    if (!chunk.trim()) {
      console.warn("⚠️ Skipping empty chunk");
      continue;
    }

    try {
      let taskDescription = "";
      

      if (!isPremium) {
        const cardLimit = chunk.length < 20000 ? 50 : 25;

        taskDescription = `Create no more than ${cardLimit} simple Q&A flashcards focused on the most critical topics.`;
      } else {
        // Premium user logic
        if (isExamEssentials) {

          taskDescription += "Focus on key facts and core concepts for exam preparation. ";
        }

        switch (flashcardStyle) {
          case "simple":
            taskDescription += "Create simple Q&A flashcards. Clean up both questions and answers, use your knowledge to make them better too. Make sure you cover all topics in the notes";
            break;
          case "detailed":
            taskDescription += "Create flashcards with detailed explanations in the answers. Clean up both questions and answers, use your knowledge to make them better too. ";
            break;
          case "fill":
            taskDescription += "Convert factual statements into fill-in-the-blank flashcards. For each card, remove one key term and replace it with '_____'. Provide the removed term as the answer. Clean up both questions and answers, use your knowledge to make them better too.";
            break;
          case "mnemonics":
            taskDescription += "Create flashcards and include helpful mnemonics in the answers and ways to easily remember the content. Clean up both questions and answers, use your knowledge to make them better too. ";
            break;
          default:
            taskDescription += "Create simple Q&A flashcards. Clean up both questions and answers, use your knowledge to make them better too. ";
            break;
        }
      }

      const prompt = `
TASK:
${taskDescription}

NOTES:
"""
${chunk}
"""
`.trim();



      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig,
        systemInstruction,
      });

      let generatedText = result.response.text().trim();


      const jsonArray = extractFirstJSONArray(generatedText);
      const flashcards = JSON.parse(jsonArray);
      allFlashcards.push(...flashcards);
    } catch (error) {
      console.error("Gemini chunk error:", error);
    }
  }

  if (!isPremium && allFlashcards.length > 50) {
    return allFlashcards.slice(0, 50);
  }


  // DEBUG: Print all generated flashcards (question and answer)
  console.log("\n=== ALL GENERATED FLASHCARDS ===\n");
  allFlashcards.forEach((card, index) => {
    console.log(`${index + 1}. Q: ${card.question}`);
    console.log(`   A: ${card.answer}\n`);
  });
  return allFlashcards;
}

exports.createDeckWithFlashcards = async (req, res) => {
  try {
    const { title, content, settings } = req.body;
    const userId = req.user.userId;

    
    const limit = req.user.isPremium ? MAX_CHAR_PREMIUM : MAX_CHAR_FREE;

    if (content.length > limit) {
      return res.status(400).json({
        message: `Note content exceeds the limit of ${limit} characters for your account.`,
      });
    }

    const newDeck = new Deck({
      title,
      content,
      fileURL: "",
      user: userId,
      description: "Flashcards",
      flashcards: [],
      updatedAt: Date.now(),
    });
    await newDeck.save();

    const generatedFlashcards = await generateFlashcardsFromNotes(content, req.user.isPremium, req.body.settings.examEssentials, req.body.settings.flashcardStyle);

    const flashcardsToInsert = generatedFlashcards.map((card) => ({
      question: card.question,
      answer: card.answer,
      user: userId,
      deck: newDeck._id,
      createdAt: Date.now(),
    }));

    const insertedFlashcards = await Flashcard.insertMany(flashcardsToInsert);

    newDeck.flashcards = insertedFlashcards.map((fc) => fc._id);
    await newDeck.save();

    return res.status(201).json({
      message: `${title} created successfully`,
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
    const decks = await Deck.find({ user: userId }).select("title description updatedAt");
    return res.status(200).json({ decks });
  } catch (error) {
    console.error("Error fetching decks:", error);
    return res.status(500).json({ message: error.message });
  }
};







async function generateSummaryFromNotes(notes, isPremium, isExamEssentials, isCaseStudyMode, selectedTone) {
  let finalSummary = "";
  const chunks = chunkNotes(notes, isPremium);

  const generationConfig = {
    temperature: 0.4,
    stopSequences: [],
  };

  const systemInstruction = {
    parts: [{
      text: `
  You are a markdown note generator.
  ONLY output clean, valid Markdown (no extra symbols or spacing errors).
  
  Rules:
  - Use proper headers with a space (e.g., '# Title')
  - Avoid broken bullets (no '*' alone on a line)
  - Use '-' or '*' for bullets with actual content after them
  - Use emojis, bold, italics, and callouts sparingly but consistently
  - Separate sections clearly
  - Use spacing to keep things readable (double newlines between groups)
  
  DO NOT add code blocks or markdown fences (no backticks or triple quotes).
  `.trim()
    }]
  };
  
  
  for (const chunk of chunks) {
    if (!chunk.trim()) continue;

    try {
      let taskDescription = "";

      if (!isPremium) {
        taskDescription = `
Create well-structured, markdown-formatted study notes with a max length of 20,000 characters.
Use simplified, easy-to-read language and follow the formatting rules above.
`.trim();
      } else {
        taskDescription = `
Create premium-style markdown study notes.
${isExamEssentials ? "Focus on core concepts and test-critical info." : ""}
${isCaseStudyMode ? "Include brief hypothetical examples for context." : ""}
Use a ${selectedTone} tone and follow the formatting rules above.
`.trim();
      }

      const prompt = `
TASK:
${taskDescription}

NOTES:
"""
${chunk}
"""
`.trim();

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig,
        systemInstruction,
      });

      let generatedText = result.response.text().trim();

      // Strip surrounding code blocks if present
      if (generatedText.startsWith("```")) {
        const firstNewlineIndex = generatedText.indexOf("\n");
        generatedText = generatedText.substring(firstNewlineIndex + 1).replace(/```$/, "").trim();
      }

      generatedText = generatedText.replace(/[\x00-\x1F\x7F]/g, "");
      finalSummary += generatedText + "\n\n";

    } catch (error) {
      console.error("Gemini chunk error:", error);
    }
  }

  if (!isPremium && finalSummary.length > 20000) {
    finalSummary = finalSummary.substring(0, 20000);
  }

  return finalSummary;
}


exports.createDeckWithSummary = async (req, res) => {
  try {
    const { title, content, settings } = req.body;
    const userId = req.user.userId;
    const limit = req.user.isPremium ? MAX_CHAR_PREMIUM : MAX_CHAR_FREE;

    if (content.length > limit) {
      return res.status(400).json({
        message: `Note content exceeds the limit of ${limit} characters for your account.`,
      });
    }

    // For free users, force examEssentials = false, caseStudyMode = false, and tone "simple"
    const examEssentials = req.user.isPremium ? settings.examEssentials : false;
    const caseStudyMode = req.user.isPremium ? settings.caseStudyMode : false;
    const summaryTone = req.user.isPremium ? settings.summaryTone : "simple";

    const newDeck = new Deck({
      title,
      content,
      fileURL: "",
      user: userId,
      description: "Summary",
      flashcards: [],
      summarization: null, // single summarization object now
      updatedAt: Date.now(),
    });
    await newDeck.save();

    // Generate the summary from notes
    const generatedSummary = await generateSummaryFromNotes(
      content,
      req.user.isPremium,
      examEssentials,
      caseStudyMode,
      summaryTone
    );

    // Create the summarization and attach it to the deck
    const newSummary = await Summarization.create({
      summary: generatedSummary,
      user: userId,
      deck: newDeck._id,
    });

    // Update deck with single summarization reference
    newDeck.summarization = newSummary._id;
    await newDeck.save();

    return res.status(201).json({
      message: `${title} created successfully`,
      deck: newDeck,
      summary: generatedSummary,
    });
  } catch (error) {
    console.error("Error creating deck with summary:", error);
    return res.status(500).json({ message: error.message });
  }
};


exports.getDeckById = async (req, res) => {
  try {
    const deck = await Deck.findById(req.params.id)
      .populate("flashcards")
      .populate("summarization")
      .populate("quizzes"); 

    if (!deck) {
      return res.status(404).json({ message: "Deck not found" });
    }

    if (deck.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    res.status(200).json(deck);
  } catch (error) {
    console.error("Error fetching deck:", error);
    res.status(500).json({ message: error.message });
  }
};


exports.renameDeck = async (req, res) => {
  const deckId = req.params.id;
  const newTitle = req.body.title?.trim();

  if (!newTitle) {
    return res.status(400).json({ message: "Title is required." });
  }

  try {
    const deck = await Deck.findById(deckId);

    if (!deck) {
      return res.status(404).json({ message: "Deck not found" });
    }

    if (deck.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // If the title hasn’t changed, no need to continue
    if (deck.title === newTitle) {
      return res.status(200).json({ message: "No changes made.", deck });
    }

    // Check if another deck by the same user already has this title
    const existingDeck = await Deck.findOne({
      user: req.user.userId,
      title: newTitle,
    });

    if (existingDeck) {
      return res.status(409).json({ message: "You already have a deck with this title." });
    }

    // Update title and save
    deck.title = newTitle;
    await deck.save();

    res.status(200).json({ message: "Deck renamed successfully", deck });
  } catch (error) {
    console.error("Error renaming deck:", error);
    res.status(500).json({ message: "Server error" });
  }
};



exports.deleteDeck = async (req, res) => {
  try {
    // Get deck id from the route params
    const deckId = req.params.id;
    // Get user id from the authenticated user object
    const userId = req.user.userId;
    
    // Ensure the deck belongs to the authenticated user
    const deletedDeck = await Deck.findOneAndDelete({ _id: deckId, user: userId });
    
    if (!deletedDeck) {
      console.log("Deck not found or not owned by user.");
      return res.status(404).json({ message: 'Deck not found' });
    }
    
    // Cascade delete associated flashcards, quizzes, and summarization
    await Flashcard.deleteMany({ deck: deckId });
    await Quiz.deleteMany({ deck: deckId });
    await Summarization.deleteOne({ deck: deckId });
    
    res.status(200).json({ message: 'Deck and all associated data deleted successfully' });
  } catch (error) {
    console.error("Error deleting deck:", error);
    res.status(500).json({ message: 'Server error', error });
  }
};


