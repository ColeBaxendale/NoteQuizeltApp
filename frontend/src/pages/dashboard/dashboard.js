import "./dashboard.css";
import logo from "../../assets/logo.png";
import card from "../../assets/flash-card.png";
import ai from "../../assets/ai.png";
import crown from "../../assets/crown.png";
import React, { useEffect, useState, useContext, useRef } from "react";
import API from "../../utils/api.js";
import { AuthContext } from "../../utils/AuthContext.js";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/navbar/navbar.js";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";

const Dashboard = () => {
  const navigate = useNavigate();
  const [decks, setDecks] = useState([]);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [pendingDeckClickId, setPendingDeckClickId] = useState(null);
  const { user } = useContext(AuthContext);
  const [renamingDeckId, setRenamingDeckId] = useState(null);
  const [newTitle, setNewTitle] = useState("");
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null);

  // This ref will point to the container wrapping the menu button and its dropdown (when open)
  const dropdownRef = useRef(null);
  const renameInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      const fetchDecks = async () => {
        try {
          const response = await API.get("/deck/user-decks");
          const sortedDecks = response.data.decks.sort(
            (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
          );
          setDecks(sortedDecks);
        } catch (err) {
          console.error("Failed to fetch decks:", err);
        }
      };
      fetchDecks();
    }
  }, [user]);

  // Document-level click handler: if click is outside of our dropdown container, close the menu.
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        openDropdownId !== null &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setOpenDropdownId(null);
        setConfirmingDeleteId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDropdownId]);

  const createFlashCardSet = () => navigate("/create-flashcards");
  const createSummary = () => navigate("/create-summary");

  const handleDeckClick = (deckId) => {
    if (openDropdownId || renamingDeckId) {
      setOpenDropdownId(null);
      setRenamingDeckId(null);
      setNewTitle("");
      setPendingDeckClickId(deckId);
      return;
    }
    if (pendingDeckClickId === deckId) {
      setPendingDeckClickId(null);
      navigate(`/view-deck/${deckId}`);
    } else {
      setPendingDeckClickId(deckId);
    }
  };

  const handleRenameDeck = async (deckId) => {
    const originalDecks = [...decks];
    const originalTitle = originalDecks.find((deck) => deck._id === deckId)?.title;
    if (newTitle.trim() === originalTitle?.trim()) {
      setRenamingDeckId(null);
      setNewTitle("");
      return;
    }
    setDecks((prev) =>
      prev.map((deck) => (deck._id === deckId ? { ...deck, title: newTitle } : deck))
    );
    try {
      await API.patch(`/deck/${deckId}`, { title: newTitle.trim() });
      toast.success("Deck renamed successfully!");
    } catch (err) {
      console.error("Rename failed:", err);
      toast.error(err.response?.data?.message || "Rename failed");
      setDecks(originalDecks);
    }
    setRenamingDeckId(null);
    setOpenDropdownId(null);
    setNewTitle("");
  };

  return (
    <div className="dashboard">
      <Navbar />
      <div className="dashboard-content">
        <h2 className="dashboard-content-welcome">Welcome back!</h2>
        <p className="dashboard-content-text">
          Let’s turn your notes into something powerful...
        </p>

        <div className="dashboard-content-first-container">
          <div
            className="dashboard-content-first-container-box"
            onClick={createFlashCardSet}
          >
            <div className="dashboard-content-first-container-box-icons">
              <div className="dashboard-content-first-container-box-icons-box">
                <img
                  src={card}
                  alt=""
                  className="dashboard-content-first-container-box-icons-box-icon"
                />
              </div>
            </div>
            <h2 className="dashboard-content-first-container-box-icons-box-header">
              Create Flashcard Set
            </h2>
            <p className="dashboard-content-first-container-box-icons-box-content">
              Transform your notes into interactive flashcards for effective memorization.
            </p>
          </div>

          <div className="dashboard-content-first-container-box" onClick={createSummary}>
            <div className="dashboard-content-first-container-box-icons">
              <div className="dashboard-content-first-container-box-icons-box">
                <img
                  src={ai}
                  alt=""
                  className="dashboard-content-first-container-box-icons-box-icon"
                />
              </div>
            </div>
            <h2 className="dashboard-content-first-container-box-icons-box-header">
              Summarize Notes
            </h2>
            <p className="dashboard-content-first-container-box-icons-box-content">
              Convert detailed notes into concise summaries perfect for quick review.
            </p>
          </div>
        </div>

        <h2 className="dashboard-content-sets-text">My Study Sets</h2>

        <div
          className={`dashboard-content-sets-sets ${
            openDropdownId ? "dropdown-open" : ""
          }`}
        >
          {decks.length === 0 ? (
            <div className="no-sets">
              Click an option above to create your first set!
            </div>
          ) : (
            decks.map((deck) => (
              <div
                key={deck._id}
                className={`tempset ${openDropdownId === deck._id ? "tempset-open" : ""}`}
                onClick={() => handleDeckClick(deck._id)}
              >
                <div className="tempset-left">
                  {renamingDeckId === deck._id ? (
                    <div onClick={(e) => e.stopPropagation()} style={{ width: "100%" }}>
                      <input
                        ref={renameInputRef}
                        className="tempset-title-input"
                        value={newTitle}
                        maxLength={100}
                        onChange={(e) => setNewTitle(e.target.value)}
                        onBlur={() => {
                          setTimeout(() => {
                            if (document.activeElement !== renameInputRef.current) {
                              handleRenameDeck(deck._id);
                            }
                          }, 150);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") e.target.blur();
                          if (e.key === "Escape") {
                            setRenamingDeckId(null);
                            setNewTitle("");
                          }
                        }}
                        autoFocus
                      />
                    </div>
                  ) : (
                    <h2 className="tempset-left-title">{deck.title}</h2>
                  )}
                  <h2 className="tempset-left-text">{deck.description}</h2>
                </div>

                <div className="tempset-right">
                  {openDropdownId === deck._id ? (
                    <div ref={dropdownRef}>
                      <div className="tempset-buttons-width">
                        <div
                          className="tempset-buttons-width-inner"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            className="tempset-menu-button"
                            onClick={() =>
                              setOpenDropdownId(
                                openDropdownId === deck._id ? null : deck._id
                              )
                            }
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
                          onClick={(e) => e.stopPropagation()}
                        >
                          {confirmingDeleteId === deck._id ? (
                            <div className="tempset-dropdown-confirm">
                              <div
                                onClick={async () => {
                                  try {
                                    await API.delete(`/deck/${deck._id}`);
                                    setDecks((prev) =>
                                      prev.filter((d) => d._id !== deck._id)
                                    );
                                    toast.success("Deck deleted");
                                  } catch (err) {
                                    toast.error("Failed to delete");
                                    console.error(err);
                                  }
                                  setConfirmingDeleteId(null);
                                  setOpenDropdownId(null);
                                }}
                              >
                                ✅ Confirm
                              </div>
                              <div onClick={() => setConfirmingDeleteId(null)}>
                                ❌ Cancel
                              </div>
                            </div>
                          ) : (
                            <>
                              <div
                                onClick={() => {
                                  setOpenDropdownId(null);
                                  setPendingDeckClickId(null);
                                  navigate(`/view-deck/${deck._id}`);
                                }}
                              >
                                📂 Open
                              </div>
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRenamingDeckId(deck._id);
                                  setNewTitle(deck.title);
                                  setOpenDropdownId(null);
                                }}
                              >
                                ✏️ Rename
                              </div>
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmingDeleteId(deck._id);
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
                      <div
                        className="tempset-buttons-width-inner"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          className="tempset-menu-button"
                          onClick={() => setOpenDropdownId(deck._id)}
                        >
                          ⋯
                        </button>
                      </div>
                    </div>
                  )}
                  <p className="tempset-time">
                    {new Date(deck.updatedAt).toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;



// FIXME: Error where it takes two clicks to get the view-deck even when the menu has not been opened
//        Seems that the menu refs are not doing anything in handleDeckClick().  