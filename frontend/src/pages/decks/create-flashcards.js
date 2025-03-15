import "./create-flashcards.css";
import logo from "../../assets/logo.png";
import sun from "../../assets/brightness.png";
import moon from "../../assets/night-mode.png";
import card from "../../assets/flash-card.png";
import ai from "../../assets/ai.png";
import search from "../../assets/search.png";
import crown from "../../assets/crown.png";
import Swal from "sweetalert2";
import rightArrow from "../../assets/right-arrow.png";
import wand from "../../assets/wand.png";

import information from "../../assets/information.png";

import React, { useEffect, useState } from "react";
import axios from "axios"; // or use fetch API
import API from "../../utils/api.js";

import { useNavigate } from "react-router-dom";

const CreateFlashCards = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [decks, setDecks] = useState([]);
  const [notes, setNotes] = useState("");
  const [title, setTitle] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await API.get("/auth/user");
        setUser(response.data);
      } catch (err) {
        console.error("Failed to fetch user:", err);
        navigate("/signin");
      } finally {
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
      text: "Your new set will NOT be saved.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, go back",
      cancelButtonText: "Stay here",
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        navigate("/dashboard");
      }
    });
  };
  const handleNotesChange = (e) => {
    setNotes(e.target.value);
  };

  return (
    <div className="create-flashcard">
      <div className="create-flashcard-nav">
        <div className="create-flashcard-nav-container">
          <img src={logo} alt="" className="create-flashcard-nav-container-logo" />
          <h1 className="create-flashcard-nav-container-text">NoteGenius</h1>
        </div>
        <div className="create-flashcard-nav-container2">
          {user && !user.isPremium && (
            <button className="create-flashcard-nav-container2-button" onClick={handleUpgrade}>
              Get Premium
            </button>
          )}
          {user && user.isPremium && <img src={crown} alt="" className="create-flashcard-nav-container-logo-prem" />}
          <div className="create-flashcard-nav-container-profile">
            <p className="create-flashcard-nav-container-profile-text">{user ? user.email.slice(0, 2).toUpperCase() : ""}</p>
          </div>
        </div>
      </div>
      <div className="create-flashcard-content">
        <div className="create-flashcard-content-title-container">
          <h1 className="create-flashcard-content-title-container-header">Transform Your Notes</h1>
          <p className="create-flashcard-content-title-container-secondary">Paste your notes below to generate flashcards</p>
        </div>
        <div className="create-flashcard-content-notes">
          <div className="create-flashcard-content-notes-label">
            <label htmlFor="" className="create-flashcard-content-notes-label-text">
              Study Set Title
            </label>
          </div>
          <input
            className="create-flashcard-content-notes-title"
            type="text"
            placeholder="Enter a title for this set."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="create-flashcard-content-notes-label">
            <label htmlFor="" className="create-flashcard-content-notes-label-text">
              Your Notes
            </label>
          </div>
          <textarea className="create-flashcard-content-notes-textarea" value={notes} onChange={handleNotesChange} placeholder="Paste your notes here, do not worry about formatting..." />
          <div className="create-flashcard-content-bottom">
                <button className="create-flashcard-content-bottom-button" onClick={handleBack}>
                    Cancel
                </button>
                <button className="create-flashcard-content-bottom-button1">
                    <img src={wand} alt="" className="create-flashcard-content-bottom-button1-logo" />
                    Generate Flashcards
                </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateFlashCards;
