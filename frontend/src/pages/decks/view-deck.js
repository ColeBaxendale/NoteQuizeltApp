import React, { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../../components/navbar/navbar";
import { AuthContext } from "../../utils/AuthContext.js";
import { FaArrowLeft } from "react-icons/fa";
import "./view-deck.css";
import API from "../../utils/api.js";

const ViewDeck = () => {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [deck, setDeck] = useState(null);
  const [activeView, setActiveView] = useState("flashcards");
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [flashcards, setFlashcards] = useState([]);
  const [shuffledOrder, setShuffledOrder] = useState([]);

  const goBack = () => navigate("/dashboard");

  const shuffleFlashcards = () => {
    const order = [...Array(flashcards.length).keys()];
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    setShuffledOrder(order);
    setCurrentCardIndex(0);
    setShowAnswer(false);
  };

  const handleEdit = async (index, field, value) => {
    const updated = [...flashcards];
    updated[index][field] = value;
    setFlashcards(updated);
    console.log("edited saved to mongo");
  };

  const nextCard = () => {
    if (currentCardIndex < flashcards.length - 1) {
      setShowAnswer(false); // Reset the showAnswer state before incrementing the card index
      setTimeout(() => {
        setCurrentCardIndex(currentCardIndex + 1);
      }, 100); // Delay the index increment to allow the showAnswer state update to render
    }
  };
  const prevCard = () => {
    if (currentCardIndex > 0) {
      setShowAnswer(false); // Reset the showAnswer state before decrementing the card index
      setTimeout(() => {
        setCurrentCardIndex(currentCardIndex - 1);
      }, 100); // Delay the index decrement to allow the showAnswer state update to render
    }
  };
  const handleFieldChange = (index, field, value) => {
    const updated = [...flashcards];
    updated[index][field] = value;
    setFlashcards(updated);
  };

  useEffect(() => {
    const fetchDeck = async () => {
      try {
        const response = await API.get(`/deck/${deckId}`);
        setDeck(response.data);
        setFlashcards(response.data.flashcards || []);
        setShuffledOrder([...Array(response.data.flashcards.length).keys()]);
        setActiveView(response.data.flashcards?.length > 0 ? "Flashcards" : "Summary");
      } catch (error) {
        console.error("Failed to load deck:", error);
        navigate("/dashboard");
      }
    };

    fetchDeck();
  }, [deckId, navigate]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (activeView !== "Flashcards") return;

      const isInputFocused = document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA";
      if (isInputFocused) return;

      if (e.key === "ArrowRight") nextCard();
      if (e.key === "ArrowLeft") prevCard();
      if (e.key === " ") {
        e.preventDefault();
        setShowAnswer((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeView, currentCardIndex]);

  if (!deck) return <p>Loading...</p>;
  const currentCard = flashcards[shuffledOrder[currentCardIndex]];

  return (
    <div className="view-deck">
      <Navbar />
      <div className="deck-body">
        <div className="deck-breadcrumb">
          <span className="breadcrumb-link" onClick={goBack}>
            <FaArrowLeft className="back-icon" /> Dashboard
          </span>
          <span className="breadcrumb-current">
            / {deck.title} / {activeView}
          </span>
        </div>

        <div className="deck-tab-nav">
          {["Summary", "Flashcards", "Tests"].map((tab) => (
            <button key={tab} className={`page-view ${activeView === tab ? "active" : ""}`} onClick={() => setActiveView(tab)}>
              {tab}
            </button>
          ))}
        </div>

        <div className="deck-content">
          {activeView === "Flashcards" && (
            <div className="flashcard-view">
              {flashcards.length === 0 ? (
                <button onClick={() => navigate("/create-flashcards", { state: { deckId: deck._id } })}>Create Flashcards for This Deck</button>
              ) : (
                <>
                  <div className={`flashcard-flip-card`} onClick={() => setShowAnswer(!showAnswer)}>
                    <div className={`flashcard-flip-card-inner ${showAnswer ? "show-answer" : ""}`}>
                      <div className="flashcard-front">
                        <p>{currentCard.question}</p>
                        <div className="flashcard-hint">Click or press spacebar to reveal answer</div>
                      </div>
                      <div className="flashcard-back">
                        <p>{currentCard.answer}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flashcard-controls2">
                    <p className="card-counter">
                      {currentCardIndex + 1} of {flashcards.length}
                    </p>
                    <div className="controls-space">
                      <button className="arrow-button left" onClick={prevCard} disabled={currentCardIndex === 0}>
                        &#8592;
                      </button>
                      <button className="arrow-button right" onClick={nextCard} disabled={currentCardIndex === flashcards.length - 1}>
                        &#8594;
                      </button>
                    </div>

                    <div className="flashcard-controls">
                      <button className="buttonNoGradient" onClick={shuffleFlashcards}>
                        Shuffle
                      </button>
                      <button className="buttonNoGradient" onClick={() => navigate("/create-test", { state: { deckId: deck._id } })}>
                        Create Test
                      </button>
                    </div>
                  </div>

                  <div className="answers-below">
                    <p className="all-cards">All Flashcards ({flashcards.length})</p>
                  </div>
                  <div className="flashcard-list">
                    {flashcards.map((card, index) => (
                      <div key={card._id} className="editable-flashcard">
                        <textarea className="question" type="text" value={card.question} onChange={(e) => handleFieldChange(index, "question", e.target.value)} onBlur={() => handleEdit(index, "question", card.question)} />
                        <textarea className="answer" value={card.answer} onChange={(e) => handleFieldChange(index, "answer", e.target.value)} onBlur={() => handleEdit(index, "answer", card.answer)} />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewDeck;
