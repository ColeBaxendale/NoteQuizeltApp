/* eslint-disable no-lone-blocks */
import "./create-deck.css";
import Swal from "sweetalert2";
import wand from "../../assets/wand.png";
import React, { useState, useContext } from "react";
import API from "../../utils/api.js";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Navbar from "../../components/navbar/navbar.js";
import { AuthContext } from "../../utils/AuthContext.js";
const CreateDeck = () => {
  const { user } = useContext(AuthContext);
  const [notes, setNotes] = useState("");
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const MAX_CHAR_FREE = 40000;
  const MAX_CHAR_PREMIUM = 100000;

  const handleUpgrade = () => {
    console.log("stripe");
  };

  const handleBack = () => {
    if (!title.trim() && !notes.trim()) {
        navigate("/dashboard");
        
    }
    else{
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
        }
  };

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

  const currentLimit = user ? (user.isPremium ? MAX_CHAR_PREMIUM : MAX_CHAR_FREE) : MAX_CHAR_FREE;

  const handleCreateDeck = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title for the study set.");
      return;
    }

    if (title.length > 100) {
        toast.error("Title is too long.");
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
      };
       await API.post("/deck/create-deck", payload);
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "An error occurred while creating the new deck.");
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
            <input className="create-deck-content-notes-title" type="text" maxLength={100} placeholder="Enter a title for this set." value={title} onChange={(e) => setTitle(e.target.value)} />
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
                <button className="create-deck-bottom-submit" onClick={handleCreateDeck}>
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
