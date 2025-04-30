import React, { useContext, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../../components/navbar/navbar";
import { AuthContext } from "../../utils/AuthContext.js";
import { FaArrowLeft } from "react-icons/fa";
import "./view-deck.css";
import API from "../../utils/api.js";
import { faEdit, faTrashAlt, faCheck, faX } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { toast } from "react-toastify";
// Set maximum characters for question and answer fields
const MAX_CHARS_QUESTION = 600;
const MAX_CHARS_ANSWER = 600;

const TempFlashCard = () => {
  const { setId }   = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [deck, setDeck] = useState(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [flashcards, setFlashcards] = useState([]);
  const [shuffledOrder, setShuffledOrder] = useState([]);
  const [editingCardId, setEditingCardId] = useState(null);
  const [editingBackup, setEditingBackup] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [deckTitle,     setDeckTitle]     = useState("");
  const [setTitle,      setSetTitle]      = useState("");

  // Create a ref to attach to the currently edited card container
  const editingRef = useRef(null);


  const goBack = () => navigate(-1);

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
    // Save previous state for rollback
    const previousFlashcards = [...flashcards];
  
    // Optimistically update UI
    const updated = [...flashcards];
    updated[index][field] = value;
    setFlashcards(updated);
  
    // If this isn’t a brand-new card, persist the change
    if (!updated[index].isNew) {
      try {
        await API.put(
          `/flashcard/${setId}/${updated[index]._id}`, 
          { [field]: value }
        );
      } catch (error) {
        console.error("Error updating flashcard:", error);
        // Roll back on failure
        setFlashcards(previousFlashcards);
        toast.error("Failed to update flashcard. Please try again.");
      }
    }
  };
  
  const nextCard = () => {
    if (currentCardIndex < flashcards.length - 1) {
      setShowAnswer(false);
      setCurrentCardIndex(currentCardIndex + 1);
    }
  };

  const prevCard = () => {
    if (currentCardIndex > 0) {
      setShowAnswer(false);
      setCurrentCardIndex(currentCardIndex - 1);
    }
  };

  // Function to confirm deletion
  const handleDeleteConfirm = async (flashcardId) => {
    const index = flashcards.findIndex((card) => card._id === flashcardId);
    if (index === -1) return;

    const previousFlashcards = [...flashcards];
    const updated = flashcards.filter((card, i) => i !== index);
    setFlashcards(updated);

    try {
      console.log(setId);
      console.log(flashcardId);

      
      await API.delete(`/flashcard/${setId}/${flashcardId}`);

      console.log("Flashcard deleted");
      setPendingDeleteId(null);
    } catch (error) {
      console.error("Error deleting flashcard:", error);
      setFlashcards(previousFlashcards);
      setPendingDeleteId(null);
      alert("Failed to delete flashcard. Please try again.");
    }
  };

  // Confirm edit: for new flashcards, call POST; for existing, just exit edit mode.
  const handleEditConfirm = async () => {
    const index = flashcards.findIndex((card) => card._id === editingCardId);
    if (index === -1) return;

    const card = flashcards[index];

    // Ensure both fields are filled
    if (!card.question.trim() || !card.answer.trim()) {
      toast.error("Both question and answer must be filled in.");
      return;
    }

    if (card.isNew) {
      try {
        // Call API to create new flashcard
        const response = await API.post(`/flashcard/${setId}/add`, {
          question: card.question,
          answer: card.answer,
          deck: deck._id,
          user: user.userId, // assuming user.userId is defined
        });
        // Replace temporary flashcard with the one from response
        const newCard = response.data.flashcard;
        const updated = [...flashcards];
        updated[index] = newCard;
        setFlashcards(updated);
      } catch (error) {
        console.error("Error adding flashcard:", error);
        toast.error("Failed to add flashcard. Please try again.");
        return;
      }
    } else {
    }

    setEditingCardId(null);
    setEditingBackup(null);
  };

  // Cancel edit: if editing a new flashcard, remove it; otherwise revert using backup.
  const handleEditCancel = (index) => {
    const card = flashcards[index];
    if (card.isNew) {
      const updated = flashcards.filter((_, i) => i !== index);
      setFlashcards(updated);
    } else if (editingBackup) {
      const updated = [...flashcards];
      updated[index] = editingBackup;
      setFlashcards(updated);
    }
    setEditingCardId(null);
    setEditingBackup(null);
  };

  // When clicking the edit button, store the current card as backup.
  const startEditing = (card) => {
    setEditingCardId(card._id);
    setEditingBackup({ ...card });
  };

  // Handle adding a new flashcard (inserts at the top)
  const handleAddFlashcard = () => {
    // Only allow one new flashcard at a time
    const hasNew = flashcards.some((card) => card.isNew);
    if (hasNew) {
      toast.info("Finish adding the current flashcard first.");
      return;
    }
    const tempId = "temp-" + Date.now();
    const newCard = {
      _id: tempId,
      question: "",
      answer: "",
      isNew: true,
    };
    setFlashcards([newCard, ...flashcards]);
    setEditingCardId(tempId);
    setEditingBackup(newCard);
    setShuffledOrder((prevOrder) => [0, ...prevOrder.map((i) => i + 1)]);
    setCurrentCardIndex(0);
  };

  useEffect(() => {
    const fetchFlashcardSet = async () => {
      try {
        const { data } = await API.get(`/flashcard/${setId}`);
        // data.deck === { id, title }
        setDeck(data.deck);
        setDeckTitle(data.deck.title);
        setSetTitle(data.setTitle)
  
        const cards = data.flashcards || [];
        setFlashcards(cards);
        setShuffledOrder([...Array(cards.length).keys()]);
      } catch (error) {
        console.error("Failed to load flashcard set:", error);
        navigate("/dashboard");
      }
    };
  
    fetchFlashcardSet();
  }, [setId, navigate]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const isInputFocused =
        document.activeElement.tagName === "INPUT" ||
        document.activeElement.tagName === "TEXTAREA" ||
        document.activeElement.isContentEditable;
      if (isInputFocused) return;
  
      if (e.key === "ArrowRight" && flashcards.length > 0) {
        setShowAnswer(false);
        setCurrentCardIndex(idx =>
          Math.min(idx + 1, flashcards.length - 1)
        );
      }
      if (e.key === "ArrowLeft") {
        setShowAnswer(false);
        setCurrentCardIndex(idx =>
          Math.max(idx - 1, 0)
        );
      }
      if (e.key === " ") {
        e.preventDefault();
        setShowAnswer(prev => !prev);
      }
    };
  
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [flashcards.length]);
  

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (editingRef.current && !editingRef.current.contains(event.target)) {
        const index = flashcards.findIndex((card) => card._id === editingCardId);
        if (index !== -1 && editingBackup) {
          const currentCard = flashcards[index];
          // For new flashcards, do not exit edit mode—force explicit confirm/cancel.
          if (currentCard.isNew) {
            return;
          }
          // For existing flashcards, update only if changes were made.
          if (currentCard.question !== editingBackup.question || currentCard.answer !== editingBackup.answer) {
            handleEditConfirm();
          } else {
            setEditingCardId(null);
            setEditingBackup(null);
          }
        } else {
          setEditingCardId(null);
          setEditingBackup(null);
        }
      }
    };

    if (editingCardId) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [editingCardId, flashcards, editingBackup]);

  const currentCard = flashcards[shuffledOrder[currentCardIndex]];

  return (
    <div className="view-deck">
      <Navbar />
      <div className="deck-body">
        <div className="deck-breadcrumb">
          <span className="breadcrumb-link" onClick={goBack}>
            <FaArrowLeft className="back-icon" /> {deckTitle}
          </span>
          <span className="breadcrumb-current">
              / Flashcards / {setTitle}
          </span>
        </div>


        <div className="deck-content">
        <div className="flashcard-view">
    {flashcards.length === 0 ? (
      <button onClick={() => navigate("/create-flashcards", { state: { deckId: deck._id } })}>Create Flashcards for This Deck</button>
    ) : (
      <>
        <div  key={currentCardIndex} className={`flashcard-flip-card`} onClick={() => setShowAnswer(!showAnswer)}>
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
            <button className="arrow-button left" title="Previous Card" onClick={prevCard} disabled={currentCardIndex === 0}>
              &#8592;
            </button>
            <button className="arrow-button right" title="Next Card" onClick={nextCard} disabled={currentCardIndex === flashcards.length - 1}>
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
          {user.isPremium ? (
            <button className="buttonGradient" onClick={handleAddFlashcard}>
              Add Flashcard
            </button>
          ) : (
            <button className="buttonGradient" disabled title="Upgrade to premium to add flashcards">
              Add Flashcard
            </button>
          )}
        </div>
        <div className="flashcard-list">
          {flashcards.map((card, index) => {
            const isEditing = editingCardId === card._id;
            return (
              <div className={`flashcardtwo ${isEditing ? "editing-field" : ""}`} key={card._id} ref={isEditing ? editingRef : null}>
                <div className="editable-flashcard">
                  <p
                    className="question"
                    contentEditable={isEditing}
                    suppressContentEditableWarning={true}
                    onInput={(e) => {
                      if (e.target.innerText.length > MAX_CHARS_QUESTION) {
                        e.target.innerText = e.target.innerText.substring(0, MAX_CHARS_QUESTION);
                      }
                    }}
                    onBlur={(e) => handleEdit(index, "question", e.target.innerText)}
                  >
                    {card.question}
                  </p>
                  <div className="stack-stuff">
                    <p
                      className="answer"
                      contentEditable={isEditing}
                      suppressContentEditableWarning={true}
                      onInput={(e) => {
                        if (e.target.innerText.length > MAX_CHARS_ANSWER) {
                          e.target.innerText = e.target.innerText.substring(0, MAX_CHARS_ANSWER);
                        }
                      }}
                      onBlur={(e) => handleEdit(index, "answer", e.target.innerText)}
                    >
                      {card.answer}
                    </p>
                    <div className="buttons-flashcard">
                      {pendingDeleteId === card._id ? (
                        <>
                          <p className="editing">Are you sure you want to delete?</p>
                          <button className="icon-button confirm-button" title="Confirm Delete" onClick={() => handleDeleteConfirm(card._id)}>
                            <FontAwesomeIcon icon={faCheck} className="icon" />
                          </button>
                          <button className="icon-button cancel-button" title="Cancel Delete" onClick={() => setPendingDeleteId(null)}>
                            <FontAwesomeIcon icon={faX} className="icon" />
                          </button>
                        </>
                      ) : (
                        <>
                          {isEditing ? (
                            <>
                              <p className="editing">Edit Mode | Max 600 Characters</p>
                              <button className="icon-button done-button" title="Confirm Edit" onClick={handleEditConfirm}>
                                <FontAwesomeIcon icon={faCheck} className="icon" />
                              </button>
                              <button className="icon-button cancel-edit-button" title="Cancel Edit" onClick={() => handleEditCancel(index)}>
                                <FontAwesomeIcon icon={faX} className="icon" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button className="icon-button" title="Edit Flashcard" onClick={() => startEditing(card)}>
                                <FontAwesomeIcon icon={faEdit} className="icon" />
                              </button>
                              <button className="icon-button" title="Delete Flashcard" onClick={() => setPendingDeleteId(card._id)}>
                                <FontAwesomeIcon icon={faTrashAlt} className="icon" />
                              </button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </>
    )}
  </div>
        </div>


      </div>
    </div>
  );
};

export default TempFlashCard;

