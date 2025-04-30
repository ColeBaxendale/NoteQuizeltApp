// src/pages/ViewDeck.jsx
import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../../components/navbar/navbar";
import { FaArrowLeft } from "react-icons/fa";
import API from "../../utils/api";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";

import "./view-deck.css";

const ViewDeck = () => {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const dropdownRef = useRef(null);
  const menuClickedRef = useRef(false);
  const [renamingFlashcardId, setRenamingFlashcardId] = useState(null);
  const renameInputRef = useRef(null);
  const [newTitle, setNewTitle] = useState("");
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null);

  const [deckTitle, setDeckTitle] = useState("");
  const [flashcardSets, setFlashcardSets] = useState([]); // [{ id, setTitle, flashcardCount }, …]
  const [summaryMeta, setSummaryMeta] = useState(null);
  const [quizTitles, setQuizTitles] = useState([]); // [{ id, title }, …]
  const [activeView, setActiveView] = useState("Flashcards");

  useEffect(() => {
    const fetchDeck = async () => {
      try {
        const { data } = await API.get(`/deck/${deckId}`);
        setDeckTitle(data.title);

        // map using `id` and `flashcardCount`, not `_id`/`length`
        setFlashcardSets(
          (data.flashcardSets || []).map((f) => ({
            id: f.id,
            setTitle: f.setTitle,
            flashcardCount: f.flashcardCount,
          }))
        );
        // pick initial tab
        if (data.flashcardSets?.length) {
          setActiveView("Flashcards");
        } else if (data.summarization) {
          setActiveView("Summary");
        } else if (data.quizzes?.length) {
          setActiveView("Tests");
        }
      } catch (err) {
        console.error("Failed to load deck:", err);
        navigate("/dashboard");
      }
    };
    fetchDeck();
  }, [deckId, navigate]);

  const goBack = () => navigate("/dashboard");

  const flashCardSetClick = (f) => navigate(`/flashcards/${f.id}`);

  useEffect(() => {
    function handleClickOutside(event) {
      if (openDropdownId !== null && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdownId(null);
        setConfirmingDeleteId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDropdownId]);

  const handleSetClick = (setId) => {
    console.log("Clicked Deck:", setId);
    console.log("menuClickedRef.current:", menuClickedRef.current);

    // Prevent nav if the last click was on a menu
    if (menuClickedRef.current) {
      console.log("Click was on a menu element, skipping nav.");
      menuClickedRef.current = false; // Reset for next click
      return;
    }

    const isMenuOpen = openDropdownId || renamingFlashcardId || confirmingDeleteId;

    if (isMenuOpen) {
      console.log("Menu is open. Closing it...");
      setOpenDropdownId(null);
      setRenamingFlashcardId(null);
      setConfirmingDeleteId(null);
      setNewTitle("");
      return;
    }

    console.log("Navigating to deck...");
    navigate(`/flashcards/${setId}`);
  };

  // in your ViewDeck.jsx
  const handleRenameFlashcardSet = async (setId) => {
    // keep a copy of the original for rollback
    const originalSets = [...flashcardSets];
    const target = originalSets.find((set) => set.id === setId);
    if (!target) return;

    // if unchanged, just exit edit mode
    if (newTitle.trim() === target.setTitle) {
      setRenamingFlashcardId(null);
      setNewTitle("");
      return;
    }

    // optimistic update
    setFlashcardSets((prev) => prev.map((set) => (set.id === setId ? { ...set, setTitle: newTitle.trim() } : set)));

    try {
      // call your backend
      await API.patch(`/flashcard/set/${setId}`, {
        setTitle: newTitle.trim(),
      });
      toast.success("Flashcard set renamed!");
    } catch (err) {
      console.error("Rename failed:", err);
      toast.error(err.response?.data?.message || "Rename failed");
      // rollback
      setFlashcardSets(originalSets);
    } finally {
      // clear edit state & close menu
      setRenamingFlashcardId(null);
      setOpenDropdownId(null);
      setNewTitle("");
    }
  };

  return (
    <div className="view-deck">
      <Navbar />
  
      <div className="deck-body">
        <div className="deck-breadcrumb">
          <span className="breadcrumb-link" onClick={goBack}>
            <FaArrowLeft className="back-icon" /> Dashboard
          </span>
          <span className="breadcrumb-current">
            / {deckTitle} / {activeView}
          </span>
        </div>
  
        <div className="deck-tab-nav">
          {["Summary", "Flashcards", "Tests", "AI Tools"].map(tab => (
            <button
              key={tab}
              className={`page-view ${activeView === tab ? "active" : ""}`}
              onClick={() => setActiveView(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
  
        <div className="deck-content">
          {/* Flashcards tab */}
          {activeView === "Flashcards" && (
            <div className={`dashboard-content-sets-sets ${openDropdownId ? "dropdown-open" : ""}`}>
              <div
                className="dashboard-content-first-container-box1"
                onClick={() => navigate(`/deck/${deckId}/flashcards/create`)}
              >
                <div className="dashboard-content-first-container-box-icons">
                  <div className="dashboard-content-first-container-box-icons-box">
                    <span style={{ fontSize: "2rem", color: "white" }}>＋</span>
                  </div>
                </div>
                <h2 className="dashboard-content-first-container-box-icons-box-header">
                  Create New Flashcard Set
                </h2>
                <p className="dashboard-content-first-container-box-icons-box-content">
                  Turn your notes into an interactive study tool!
                </p>
              </div>
  
              {flashcardSets.map(set => (
                <div
                  key={set.id}
                  className={`tempset ${openDropdownId === set.id ? "tempset-open" : ""}`}
                  onClick={() => handleSetClick(set.id)}
                >
                  <div className="tempset-left">
                    {renamingFlashcardId === set.id ? (
                      <div onClick={e => e.stopPropagation()} style={{ width: "100%" }}>
                        <input
                          ref={renameInputRef}
                          className="tempset-title-input"
                          value={newTitle}
                          maxLength={100}
                          onChange={e => setNewTitle(e.target.value)}
                          onBlur={() => {
                            setTimeout(() => {
                              if (document.activeElement !== renameInputRef.current) {
                                handleRenameFlashcardSet(set.id);
                              }
                            }, 150);
                          }}
                          onKeyDown={e => {
                            if (e.key === "Enter") e.target.blur();
                            if (e.key === "Escape") {
                              setRenamingFlashcardId(null);
                              setNewTitle("");
                            }
                          }}
                          autoFocus
                        />
                      </div>
                    ) : (
                      <h2 className="tempset-left-title">{set.setTitle}</h2>
                    )}
                    <h2 className="tempset-left-text">
                      {set.flashcardCount} card{set.flashcardCount !== 1 && "s"}
                    </h2>
                  </div>
  
                  <div className="tempset-right" onClick={e => e.stopPropagation()}>
                    {openDropdownId === set.id ? (
                      <div ref={dropdownRef}>
                        <div className="tempset-buttons-width">
                          <div className="tempset-buttons-width-inner" onClick={e => e.stopPropagation()}>
                            <button
                              className="tempset-menu-button"
                              onClick={e => {
                                e.stopPropagation();
                                setOpenDropdownId(openDropdownId === set.id ? null : set.id);
                              }}
                            >
                              ⋯
                            </button>
                          </div>
                        </div>
                        <AnimatePresence>
                          <motion.div
                            className="tempset-dropdown"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.15 }}
                            onClick={e => {
                              e.stopPropagation();
                              menuClickedRef.current = true;
                            }}
                          >
                            {confirmingDeleteId === set.id ? (
                              <div className="tempset-dropdown-confirm">
                                <div
                                  onClick={async () => {
                                    try {
                                      await API.delete(`/flashcard/${set.id}`);
                                      setFlashcardSets((prev) => prev.filter((s) => s.id !== set.id));
                                      toast.success("Set deleted");
                                    } catch (err) {
                                      toast.error("Failed to delete");
                                    }
                                    setConfirmingDeleteId(null);
                                    setOpenDropdownId(null);
                                  }}
                                >
                                  ✅ Confirm
                                </div>
                                <div onClick={() => setConfirmingDeleteId(null)}>❌ Cancel</div>
                              </div>
                            ) : (
                              <>
                                <div
                                  onClick={() => {
                                    setOpenDropdownId(null);
                                    navigate(`/flashcards/${set.id}`);
                                  }}
                                >
                                  📂 Open
                                </div>
                                <div
                                  onClick={e => {
                                    e.stopPropagation();
                                    setRenamingFlashcardId(set.id);
                                    setNewTitle(set.setTitle);
                                    setOpenDropdownId(null);
                                  }}
                                >
                                  ✏️ Rename
                                </div>
                                <div
                                  onClick={e => {
                                    e.stopPropagation();
                                    setConfirmingDeleteId(set.id);
                                  }}
                                >
                                  🗑️ Delete
                                </div>
                              </>
                            )}
                          </motion.div>
                        </AnimatePresence>
                      </div>
                    ) : (
                      <div className="tempset-buttons-width">
                        <div className="tempset-buttons-width-inner" onClick={e => e.stopPropagation()}>
                          <button
                            className="tempset-menu-button"
                            onClick={e => {
                              e.stopPropagation();
                              menuClickedRef.current = true;
                              setOpenDropdownId(openDropdownId === set.id ? null : set.id);
                            }}
                          >
                            ⋯
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
  
          {activeView === "Summary" && summaryMeta && (
            <div className="summary-title">{summaryMeta.title}</div>
          )}
  
          {activeView === "Tests" && (
            <ul className="quiz-list">
              {quizTitles.map(q => (
                <li key={q.id}>
                  <button className="quiz-item" onClick={() => navigate(`/quizzes/${q.id}`)}>
                    {q.title}
                  </button>
                </li>
              ))}
            </ul>
          )}
  
          {activeView === "AI Tools" && <p>…AI Tools UI here…</p>}
        </div>
      </div>
      </div>
    );
  };
  
  
  
export default ViewDeck;
