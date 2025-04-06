/* eslint-disable no-lone-blocks */
import "./create-flashcards.css";
import logo from "../../assets/logo.png";
import crown from "../../assets/crown.png";
import Swal from "sweetalert2";
import wand from "../../assets/wand.png";
import React, { useEffect, useState } from "react";
import API from "../../utils/api.js";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "@fortawesome/fontawesome-free/css/all.min.css";
import Navbar from "../../components/navbar/navbar.js";

const CreateSummary = () => {
  const [user, setUser] = useState(null);
  const [notes, setNotes] = useState("");
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTone, setSelectedTone] = useState("simple");
  const [isExamEssentials, setIsExamEssentials] = useState(false);
  const [isCaseStudyMode, setIsCaseStudyMode] = useState(false);

  
  

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
      text: "Your new set will NOT be saved.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, go back",
      cancelButtonText: "Stay here",
      reverseButtons: true,
      customClass: {
        popup: 'swal-custom-popup',
        confirmButton: 'swal-confirm-button',
        cancelButton: 'swal-cancel-button',
        title: 'swal-title',
        htmlContainer: 'swal-text',
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

  const handleGenerateSummary = async () => {
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
          examEssentials: isExamEssentials,
          caseStudy: isCaseStudyMode,
          summaryTone: selectedTone,
        },
      };
      const response = await API.post("/deck/create-deck-summary", payload);
      toast.success(response.data.message || `${title} created successfully`);
      navigate("/dashboard");
    } catch (error) {
      console.error("Error generating summary:", error);
      toast.error(error.response?.data?.message || "An error occurred while generating summary.");
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
            <p>Generating Your Summary, this may take a minute</p>
          </div>
        </div>
      )}
      <Navbar/>

      <div className="create-flashcard-content">
        <div className="create-flashcard-content-container">
          <div className="create-flashcard-content-container-left">
            <div className="create-flashcard-content-container-left-title">
              <label className="create-flashcard-content-notes-label-text">Study Set Title</label>
              <input className="create-flashcard-content-notes-title" type="text" placeholder="Enter a title for this set." value={title} onChange={(e) => setTitle(e.target.value)} />
              <label className="create-flashcard-content-notes-label-text">Input Notes</label>

              <textarea className="create-flashcard-content-notes-textarea" value={notes} onChange={handleNotesChange} placeholder="Paste your notes here..." maxLength={currentLimit} />
              <div className={user && user.isPremium ? "create-flashcard-content-bottom" : "create-flashcard-content-bottom2"}>
                {!user?.isPremium && <p className="create-flashcard-content-botttom-characters1"> Free accounts are limited to generating summaries up to 2 pages per set.</p>}
                <p className={`create-flashcard-content-botttom-characters ${notes.length >= currentLimit ? "too-many" : ""}`}>
                  {notes.length}/{currentLimit} Characters
                </p>
              </div>
            </div>
          </div>
          <div className="create-flashcard-content-container-right">
            <div className="create-flashcard-content-container-left-title">
              <div className="flashcard-settings-header">
                <label className="create-flashcard-content-notes-label-settings">Summary Settings</label>
                {!user?.isPremium && <i className="fas fa-lock lock-icon"></i>}
              </div>
              {/* Exam Essentials */}
              <div className={`exam-mode-box ${!user?.isPremium ? "disabled-section" : ""}`}>
                <div className="exam-mode-box-two">
                <label className="create-flashcard-content-notes-label-header">Exam Essentials</label>
                <label className="create-flashcard-content-notes-label-desc">Focuses on key concepts and definitions, perfect for last second exam preparation</label>
                </div>
                <label className="switch">
                <input type="checkbox" checked={isExamEssentials} onChange={() => user?.isPremium && setIsExamEssentials(!isExamEssentials)} disabled={!user?.isPremium} />
                  <span className="slider round"></span>
                </label>
              </div>

              <div className={`exam-mode-box ${!user?.isPremium ? "disabled-section" : ""}`}>
                <div className="exam-mode-box-two">
                <label className="create-flashcard-content-notes-label-header">Case Study Mode</label>
                <label className="create-flashcard-content-notes-label-desc">Inserts short, hypothetical examples or scenarios that illustrate each key point in the notes.</label>
                </div>
                <label className="switch">
                <input type="checkbox" checked={isCaseStudyMode} onChange={() => user?.isPremium && setIsCaseStudyMode(!isCaseStudyMode)} disabled={!user?.isPremium} />
                  <span className="slider round"></span>
                </label>
              </div>

              {/* Flashcard Style */}
              <label className={`create-flashcard-content-notes-label-header ${!user?.isPremium ? "disabled-label" : ""}`}>Summary Tone</label>
              <label className={`create-flashcard-content-notes-label-desc2 ${!user?.isPremium ? "disabled-label" : ""}`}>Select the tone of the summary you would like to create</label>
              <div className={`flashcard-settings ${!user?.isPremium ? "disabled-section" : ""}`}>
                {["simple", "casual", "academic"].map((tone) => (
                  <label className="selector-option" key={tone}>
                    <input type="radio" name="flashcardStyle" value={tone} checked={selectedTone === tone} onChange={() => user?.isPremium && setSelectedTone(tone)} disabled={!user?.isPremium} />
                    {tone === "simple" && "Simplified"}
                    {tone === "casual" && "Casual"}
                    {tone === "academic" && "Academic"}
                  </label>
                ))}
              </div>

              {/* Buttons */}
              <button className="create-flashcard-content-bottom-button1" onClick={handleGenerateSummary}>
                <img src={wand} alt="Generate" className="create-flashcard-content-bottom-button1-logo" />
                Generate Summary
              </button>
              <button className="create-flashcard-content-bottom-button" onClick={handleBack}>
                Cancel
              </button>

              {/* Upgrade CTA for free users */}
              {!user?.isPremium && (
                <div className="upgrade-cta">
                  <p className="cta-text">Upgrade your account to unlock all features</p>
                  <button onClick={handleUpgrade} className="upgrade-btn">
                    Get Premium
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateSummary;
