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
            taskDescription += "Create simple Q&A flashcards. Make sure you cover all topics in the notes";
            break;
          case "detailed":
            taskDescription += "Create flashcards with detailed explanations in the answers.";
            break;
          case "fill":
            taskDescription += "Convert factual statements into fill-in-the-blank flashcards. For each card, remove one key term and replace it with '_____'. Provide the removed term as the answer.";
            break;
          case "mnemonics":
            taskDescription += "Create flashcards and include helpful mnemonics in the answers and ways to easily remember the content.";
            break;
          default:
            taskDescription += "Create simple Q&A flashcards.";
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
    newDeck.description = `Flashcards - ${insertedFlashcards.length} cards`;
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
    temperature: 0,
    stopSequences: [],
  };

  const systemInstruction = {
    parts: [
      {
        text: `
You are a summary generator. Your ONLY task is to create a markdown summary from the provided notes.
NEVER include any extra text, introductions, or conclusions.
ONLY output a valid markdown file using headings, bullet points, paragraphs, and any other markdown formatting as needed.
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
        // For free users: force examEssentials off, caseStudy off, and tone "simple"
        taskDescription = `Create a markdown summary of the notes. Use bullet points, headings, and paragraphs to organize the content clearly. Limit the output to a maximum of 20,000 characters overall. Use a simplified tone.`;
        console.log(taskDescription);

      } else {
        // Premium users: use provided settings
        if (isExamEssentials) {
          taskDescription += "Focus on key facts and core concepts for exam preparation. ";
        console.log(taskDescription);

        }
        if (isCaseStudyMode) {
          taskDescription += "Include hypothetical examples where relevant. ";
        console.log(taskDescription);

        }
        taskDescription += `Use a ${selectedTone} tone. Generate a well-organized markdown summary using headings, bullet points, and paragraphs.`;
        console.log(taskDescription);

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

      if (generatedText.startsWith("```")) {
        const firstNewlineIndex = generatedText.indexOf("\n");
        generatedText = generatedText.substring(firstNewlineIndex + 1);
        generatedText = generatedText.replace(/```$/, "").trim();
      }

      generatedText = generatedText.replace(/[\x00-\x1F\x7F]/g, "");

      console.log("\n=== RAW RESPONSE FROM GEMINI ===\n");
      console.log(generatedText);

      finalSummary += generatedText + "\n\n"; // Separate chunks with newlines
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
      summarizations: [],
      updatedAt: Date.now(),
    });
    await newDeck.save();

    const generatedSummary = await generateSummaryFromNotes(
      content,
      req.user.isPremium,
      examEssentials,
      caseStudyMode,
      summaryTone
    );

    // Create a Summarization object and link it to the deck
    const newSummary = await Summarization.create({
      summary: generatedSummary,
      user: userId,
      deck: newDeck._id,
    });

    newDeck.summarizations.push(newSummary._id);
    newDeck.description = `Summary generated successfully (${generatedSummary.length} characters)`;
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
      .populate("summarizations")
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

