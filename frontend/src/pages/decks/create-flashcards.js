import "./create-flashcards.css";
import logo from "../../assets/logo.png";
import crown from "../../assets/crown.png";
import Swal from "sweetalert2";
import wand from "../../assets/wand.png";
import React, { useEffect, useState } from "react";
import API from "../../utils/api.js";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const CreateFlashCards = () => {
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
        navigate("/signin");
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

  // Handle API request for creating deck & generating flashcards
  const handleGenerateFlashcards = async () => {
    // Validate that title is not empty
    if (!title.trim()) {
      toast.error("Please enter a title for the study set.");
      return;
    }
    // Validate that notes are at least 100 characters
    if (notes.trim().length < 100) {
      toast.error("Your notes must be at least 100 characters long.");
      return;
    }
    // Validate that notes are within the limit
    if (notes.length > currentLimit) {
      toast.error(`Your notes exceed the limit of ${currentLimit} characters.`);
      return;
    }
    // Set loading to true
    setIsLoading(true);
    try {
      const payload = { title, content: notes };
      const response = await API.post("/deck/create-deck", payload);
      toast.success(response.data.message || "Deck created successfully");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error generating flashcards:", error);
      toast.error(error.response?.data?.message || "An error occurred while generating flashcards.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="create-flashcard">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-content">
            {/* You can replace the below div with an actual spinner icon/image */}
            <div className="spinner"></div>
            <p>Generating Your Flashcards, this may take a minute</p>
          </div>
        </div>
      )}
      <div className="create-flashcard-nav">
        <div className="create-flashcard-nav-container">
          <img src={logo} alt="Logo" className="create-flashcard-nav-container-logo" />
          <h1 className="create-flashcard-nav-container-text">NoteGenius</h1>
        </div>
        <div className="create-flashcard-nav-container2">
          {user && !user.isPremium && (
            <button className="create-flashcard-nav-container2-button" onClick={handleUpgrade}>
              Get Premium
            </button>
          )}
          {user && user.isPremium && <img src={crown} alt="Premium" className="create-flashcard-nav-container-logo-prem" />}
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
            <label className="create-flashcard-content-notes-label-text">Study Set Title</label>
          </div>
          <input className="create-flashcard-content-notes-title" type="text" placeholder="Enter a title for this set." value={title} onChange={(e) => setTitle(e.target.value)} />
          <div className="create-flashcard-content-notes-label">
            <label className="create-flashcard-content-notes-label-text">Your Notes</label>
          </div>
          <textarea className="create-flashcard-content-notes-textarea" value={notes} onChange={handleNotesChange} placeholder="Paste your notes here..." maxLength={currentLimit} />
          <div className={user && user.isPremium ? "create-flashcard-content-bottom" : "create-flashcard-content-bottom2"}>
            {!user?.isPremium && <p className="create-flashcard-content-botttom-characters1">Free accounts are limited to 50 flashcards. Upgrade for unlimited flashcards.</p>}
            <p className={`create-flashcard-content-botttom-characters ${notes.length >= currentLimit ? "too-many" : ""}`}>
              {notes.length}/{currentLimit} Characters
            </p>
          </div>
          <div className="create-flashcard-content-bottom">
            <button className="create-flashcard-content-bottom-button" onClick={handleBack}>
              Cancel
            </button>
            <button className="create-flashcard-content-bottom-button1" onClick={handleGenerateFlashcards}>
              <img src={wand} alt="Generate" className="create-flashcard-content-bottom-button1-logo" />
              Generate Flashcards
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateFlashCards;
