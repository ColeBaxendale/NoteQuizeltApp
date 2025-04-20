/* eslint-disable no-lone-blocks */
import "./create-deck.css";
import Swal from "sweetalert2";
import wand from "../../assets/wand.png";
import React, { useEffect, useState } from "react";
import API from "../../utils/api.js";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "@fortawesome/fontawesome-free/css/all.min.css";
import Navbar from "../../components/navbar/navbar.js";

const CreateDeck = () => {
  const [user, setUser] = useState(null);
  const [notes, setNotes] = useState("");
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  // Define limits (in characters)
  const MAX_CHAR_FREE = 40000;
  const MAX_CHAR_PREMIUM = 100000;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await API.get("/auth/user");
        setUser(response.data);
      } catch (err) {
        console.error("Failed to fetch user:", err);
        navigate("/account");
      }
    };

    fetchUser();
  }, [navigate]);

  const handleUpgrade = () => {
    console.log("stripe");
  };

  const handleBack = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "Your new deck will NOT be saved.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, go back",
      cancelButtonText: "Stay here",
      reverseButtons: true,
      customClass: {
        popup: "swal-custom-popup",
        confirmButton: "swal-confirm-button",
        cancelButton: "swal-cancel-button",
        title: "swal-title",
        htmlContainer: "swal-text",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        navigate("/dashboard");
      }
    });
  };

  // Dynamically enforce character limit in the onChange handler
  const handleNotesChange = (e) => {
    let value = e.target.value;
    if (user) {
      const limit = user.isPremium ? MAX_CHAR_PREMIUM : MAX_CHAR_FREE;
      if (value.length > limit) {
        value = value.substring(0, limit);
      }
    }
    setNotes(value);
  };

  // Determine the current limit, default to free limit if user not loaded yet
  const currentLimit = user ? (user.isPremium ? MAX_CHAR_PREMIUM : MAX_CHAR_FREE) : MAX_CHAR_FREE;

  const handleGenerateFlashcards = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title for the study set.");
      return;
    }

    if (notes.trim().length < 100) {
      toast.error("Your notes must be at least 100 characters long.");
      return;
    }

    if (notes.length > currentLimit) {
      toast.error(`Your notes exceed the limit of ${currentLimit} characters.`);
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        title,
        content: notes,
        settings: {
        },
      };
      const response = await API.post("/deck/create-deck-flashcards", payload);
      toast.success(response.data.message || `${title} created successfully`);
      navigate("/dashboard");
    } catch (error) {
      console.error("Error generating flashcards:", error);
      toast.error(error.response?.data?.message || "An error occurred while generating flashcards.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="create-deck">
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="spinner"></div>
            <p>Creating Your Deck...</p>
          </div>
        </div>
      )}
      <Navbar />
      <div className="create-deck-content">
        <div className="create-deck-content-container">
          <div className="create-deck-content-container-title">
            <label className="create-deck-content-notes-label-text">Deck Title</label>
            <input className="create-deck-content-notes-title" type="text" placeholder="Enter a title for this set." value={title} onChange={(e) => setTitle(e.target.value)} />
            <div className="label-row-deck">
            <label className="create-deck-content-notes-label-text">Input Notes</label>

            <p className={`create-deck-note-count ${notes.length === currentLimit ? "too-many" : ""}`}>
                 Character Limit: {notes.length} / {currentLimit} 
                </p>

            </div>
            <textarea className="create-deck-content-notes-textarea" value={notes} onChange={handleNotesChange} placeholder="Paste your notes here..." maxLength={currentLimit} />
            <div className="create-deck-bottom">
              <div className="create-deck-notes-info">
              {!user?.isPremium && <p className="create-deck-note-count2 " onClick={handleUpgrade}>Free accounts are limited to 40,000 characters.</p>}



              </div>
              <div className="create-deck-buttons">
                <button className="create-deck-bottom-cancel" onClick={handleBack}>
                  Cancel
                </button>
                <button className="create-deck-bottom-submit" onClick={handleGenerateFlashcards}>
                  <img src={wand} alt="Generate" className="create-deck-bottom-submit-logo" />
                  Create Deck
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateDeck;


//TODO: set up the API for creating a new deck with just title and notes. 
// Change decks on back end so the user can have multiple sets of flashcards / summaries / tests. 
