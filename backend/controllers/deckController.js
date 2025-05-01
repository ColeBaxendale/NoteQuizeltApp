const OpenAI = require("openai");
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Deck = require("../models/DeckSchema");
const FlashcardSet = require("../models/FlashCardSchema");
const Summarization = require("../models/SummarizationSchema");
const Quiz = require("../models/QuizSchema");

require("dotenv").config();

const MAX_CHAR_FREE = 40000;
const MAX_CHAR_PREMIUM = 100000;
const FREE_CHUNK_SIZE = 20000; // Max 2 chunks for free
const PREMIUM_CHUNK_SIZE = 5000;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

function chunkNotes(notes, isPremium) {
  if (!notes || !notes.length) return [];

  // Free users ("0") get smaller chunks; premium ("1" or "2") get larger chunks
  const size = isPremium === 0 ? FREE_CHUNK_SIZE : PREMIUM_CHUNK_SIZE;
  const chunks = [];
  let start = 0;

  while (start < notes.length) {
    const end = Math.min(start + size, notes.length);
    chunks.push(notes.slice(start, end));
    start = end;
  }

  // Free users only get the first two chunks
  return isPremium === 0 ? chunks.slice(0, 2) : chunks;
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

  // Tiered limits
  const freeLimit = 50;
  const basicLimit = 500;
  // super premium has no limit

  const generationConfig = { temperature: 0, stopSequences: [] };
  const systemInstruction = {
    parts: [
      {
        text: `
You are a flashcard generator. Your ONLY task is to clean up notes to generate flashcards in the requested format.
NEVER introduce yourself or reply conversationally.
NEVER include extra text or explanations.
NEVER INCLUDE MARKDOWN.
YOU MAY CHANGE AND ADD INFORMATION WHERE NEED BE.
ONLY return a valid JSON array following this EXACT structure: [{"question": "string", "answer": "string"}].
      `.trim(),
      },
    ],
  };

  for (const chunk of chunks) {
    if (!chunk.trim()) continue;

    let taskDescription = "";


    switch (isPremium) {
      case 0:
        // Free users
        taskDescription = `Create no more than ${freeLimit + 3} simple Q&A flashcards focused on the most critical topics.`;
        break;

      case 1:
      case 2:
        // Basic (1) and Premium (2) users share styles,
        // but differ on that limit vs unlimited
        if (isPremium === 1) {
          taskDescription = `Create no more than ${basicLimit} flashcards. `;
        } else {
          taskDescription = `Create as many flashcards as you need. `;
          if (isExamEssentials) {
            taskDescription += "The test is in 24 hours—ONLY create flashcards on key facts and core concepts for exam preparation that I can learn in that time frame. ";
          }
        }

        // append style‐based instructions
        switch (flashcardStyle) {
          case "simple":
            taskDescription += "Use simple Q&A. Clean up questions and answers.";
            break;
          case "fill":
            taskDescription += "Create cloze (fill-in-the-blank) style flashcards.";
            break;
          case "detailed":
            taskDescription += "Include in-depth explanations and examples on each flashcard for comprehensive understanding.";
            break;
          case "mnemonics":
            taskDescription += "Include mnemonics to help retention.";
            break;
          // …other styles
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

    try {
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig,
        systemInstruction,
      });

      const jsonArray = extractFirstJSONArray(result.response.text().trim());
      const flashcards = JSON.parse(jsonArray);
      allFlashcards.push(...flashcards);

      // early stop if free or basic premium hit their limit
      if ((isPremium === 0 && allFlashcards.length >= freeLimit) || (isPremium === 1 && allFlashcards.length >= basicLimit)) {
        break;
      }
    } catch (err) {
      console.error("Gemini chunk error:", err);
    }
  }

  // Final slice per tier
  if (isPremium === 0) return allFlashcards.slice(0, freeLimit);
  if (isPremium === 1) return allFlashcards.slice(0, basicLimit);
  return allFlashcards; // super premium unlimited
}

exports.createFlashcardSet = async (req, res) => {
  try {
    const { setTitle, deckId, settings } = req.body;
    const userId = req.user.userId;
    const tier = req.user.isPremium; // 0=free, 1=basic, 2=super

    // 1) Fetch & authorize deck
    const deck = await Deck.findById(deckId);
    if (!deck) return res.status(404).json({ message: "Deck not found" });
    if (deck.user.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // 2) Generate flashcards from deck.content
    const generated = await generateFlashcardsFromNotes(deck.content, tier, settings.examEssentials, settings.flashcardStyle);

    // 3) Create a new FlashcardSet document
    const newSet = await FlashcardSet.create({
      setTitle,
      length: generated.length, // satisfy required `length`
      flashcards: generated, // [{ question, answer }, …]
      deck: deckId,

    });

    // 4) Attach to deck and save
    deck.flashcardSets.push(newSet._id);
    await deck.save();

    return res.status(201).json({
      message: "Flashcard set created successfully",
      flashcardSet: newSet,
    });
  } catch (err) {
    console.error("Error creating flashcard set:", err);
    return res.status(500).json({ message: err.message });
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

// async function generateSummaryFromNotes(notes, isPremium, isExamEssentials, isCaseStudyMode, selectedTone) {
//   let finalSummary = "";
//   const chunks = chunkNotes(notes, isPremium);

//   const generationConfig = {
//     temperature: 0.4,
//     stopSequences: [],
//   };

//   const systemInstruction = {
//     parts: [{
//       text: `
//   You are a markdown note generator.
//   ONLY output clean, valid Markdown (no extra symbols or spacing errors).

//   Rules:
//   - Use proper headers with a space (e.g., '# Title')
//   - Avoid broken bullets (no '*' alone on a line)
//   - Use '-' or '*' for bullets with actual content after them
//   - Use emojis, bold, italics, and callouts sparingly but consistently
//   - Separate sections clearly
//   - Use spacing to keep things readable (double newlines between groups)

//   DO NOT add code blocks or markdown fences (no backticks or triple quotes).
//   `.trim()
//     }]
//   };

//   for (const chunk of chunks) {
//     if (!chunk.trim()) continue;

//     try {
//       let taskDescription = "";

//       if (!isPremium) {
//         taskDescription = `
// Create well-structured, markdown-formatted study notes with a max length of 20,000 characters.
// Use simplified, easy-to-read language and follow the formatting rules above.
// `.trim();
//       } else {
//         taskDescription = `
// Create premium-style markdown study notes.
// ${isExamEssentials ? "Focus on core concepts and test-critical info." : ""}
// ${isCaseStudyMode ? "Include brief hypothetical examples for context." : ""}
// Use a ${selectedTone} tone and follow the formatting rules above.
// `.trim();
//       }

//       const prompt = `
// TASK:
// ${taskDescription}

// NOTES:
// """
// ${chunk}
// """
// `.trim();

//       const result = await model.generateContent({
//         contents: [{ role: "user", parts: [{ text: prompt }] }],
//         generationConfig,
//         systemInstruction,
//       });

//       let generatedText = result.response.text().trim();

//       // Strip surrounding code blocks if present
//       if (generatedText.startsWith("```")) {
//         const firstNewlineIndex = generatedText.indexOf("\n");
//         generatedText = generatedText.substring(firstNewlineIndex + 1).replace(/```$/, "").trim();
//       }

//       generatedText = generatedText.replace(/[\x00-\x1F\x7F]/g, "");
//       finalSummary += generatedText + "\n\n";

//     } catch (error) {
//       console.error("Gemini chunk error:", error);
//     }
//   }

//   if (!isPremium && finalSummary.length > 20000) {
//     finalSummary = finalSummary.substring(0, 20000);
//   }

//   return finalSummary;
// }

// exports.createDeckWithSummary = async (req, res) => {
//   try {
//     const { title, content, settings } = req.body;
//     const userId = req.user.userId;
//     const limit = req.user.isPremium ? MAX_CHAR_PREMIUM : MAX_CHAR_FREE;

//     if (content.length > limit) {
//       return res.status(400).json({
//         message: `Note content exceeds the limit of ${limit} characters for your account.`,
//       });
//     }

//     // For free users, force examEssentials = false, caseStudyMode = false, and tone "simple"
//     const examEssentials = req.user.isPremium ? settings.examEssentials : false;
//     const caseStudyMode = req.user.isPremium ? settings.caseStudyMode : false;
//     const summaryTone = req.user.isPremium ? settings.summaryTone : "simple";

//     const newDeck = new Deck({
//       title,
//       content,
//       fileURL: "",
//       user: userId,
//       description: "Summary",
//       flashcards: [],
//       summarization: null, // single summarization object now
//       updatedAt: Date.now(),
//     });
//     await newDeck.save();

//     // Generate the summary from notes
//     const generatedSummary = await generateSummaryFromNotes(
//       content,
//       req.user.isPremium,
//       examEssentials,
//       caseStudyMode,
//       summaryTone
//     );

//     // Create the summarization and attach it to the deck
//     const newSummary = await Summarization.create({
//       summary: generatedSummary,
//       user: userId,
//       deck: newDeck._id,
//     });

//     // Update deck with single summarization reference
//     newDeck.summarization = newSummary._id;
//     await newDeck.save();

//     return res.status(201).json({
//       message: `${title} created successfully`,
//       deck: newDeck,
//       summary: generatedSummary,
//     });
//   } catch (error) {
//     console.error("Error creating deck with summary:", error);
//     return res.status(500).json({ message: error.message });
//   }
// };

exports.getDeckById = async (req, res) => {
  try {
    const deck = await Deck.findById(req.params.id).populate("flashcardSets", "setTitle length").populate("summarizations", "title").populate("quizSets", "title");

    if (!deck) return res.status(404).json({ message: "Deck not found" });
    if (deck.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // guard with empty‐array fallback
    const flashcardSets = (deck.flashcardSets || []).map((f) => ({
      id: f._id,
      setTitle: f.setTitle,
      flashcardCount: f.length,
    }));

    const summarization = (deck.summarizations || [])[0] ? { id: deck.summarizations[0]._id, title: deck.summarizations[0].title } : null;

    const quizzes = (deck.quizSets || []).map((q) => ({
      id: q._id,
      title: q.title,
    }));

    return res.status(200).json({
      id: deck._id,
      description: deck.description,
      title: deck.title,
      flashcardSets,
      summarization,
      quizzes,
      updatedAt: deck.updatedAt,
    });
  } catch (error) {
    console.error("Error fetching deck:", error);
    return res.status(500).json({ message: "Server error", error });
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
      return res.status(404).json({ message: "Deck not found" });
    }

    // Cascade delete associated flashcards, quizzes, and summarization
    await Flashcard.deleteMany({ deck: deckId });
    await Quiz.deleteMany({ deck: deckId });
    await Summarization.deleteOne({ deck: deckId });

    res.status(200).json({ message: "Deck and all associated data deleted successfully" });
  } catch (error) {
    console.error("Error deleting deck:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

exports.createDeck = async (req, res) => {
  try {
    const { title, content } = req.body;
    const userId = req.user.userId;
    const tier = req.user.isPremium; // "0"=free, "1"=basic, "2"=super

    // 1) Character‐limit per tier
    const contentLimit = tier === 0 ? MAX_CHAR_FREE : MAX_CHAR_PREMIUM;
    if (content.length > contentLimit) {
      return res.status(400).json({
        message: `Note content exceeds the ${contentLimit}-character limit for your account.`,
      });
    }

    // 2) Deck‐count limit per tier
    const userDeckCount = await Deck.countDocuments({ user: userId });
    const deckLimit = tier === 0 ? 3 : tier === 1 ? 10 : Infinity;
    if (userDeckCount >= deckLimit) {
      return res.status(403).json({
        message: `Deck limit reached. Your plan allows up to ${deckLimit === Infinity ? "unlimited" : deckLimit} decks.`,
      });
    }

    // 3) Unique title check (case‐insensitive)
    const existing = await Deck.findOne({
      user: userId,
      title: { $regex: `^${title}$`, $options: "i" },
    });
    if (existing) {
      return res.status(400).json({
        message: "A deck with this title already exists. Please choose a different title.",
      });
    }

    // 4) Create and save
    const newDeck = new Deck({
      title,
      content,
      description: "Set up your study deck by adding flashcards, summaries, and tests.",
      user: userId,
    });
    await newDeck.save();

    return res.status(201).json({
      message: "Deck created successfully!",
      deck: newDeck,
    });
  } catch (error) {
    console.error("Error creating deck:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};
