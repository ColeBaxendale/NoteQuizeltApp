import "./dashboard.css";
import logo from "../../assets/logo.png";
import card from "../../assets/flash-card.png";
import ai from "../../assets/ai.png";
import crown from "../../assets/crown.png";
import React, { useEffect, useState,useContext } from "react";
import API from "../../utils/api.js";
import { AuthContext } from "../../utils/AuthContext.js";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/navbar/navbar.js";

const Dashboard = () => {
  const navigate = useNavigate();
  const [decks, setDecks] = useState([]);
  const { user } = useContext(AuthContext); 

  // Only fetch decks if user is present
  useEffect(() => {
    if (user) {
      const fetchDecks = async () => {
        try {
          const response = await API.get("/deck/user-decks");
          const sortedDecks = response.data.decks.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
          setDecks(sortedDecks);
        } catch (err) {
          console.error("Failed to fetch decks:", err);
        }
      };
      fetchDecks();
    }
  }, [user]);

  const handleUpgrade = () => {
    console.log("stripe");
  };

  const createFlashCardSet = () => {
    navigate("/create-flashcards");
  };

  const createSummary = () => {
    navigate("/create-summary");
  };

  const viewDeck = (deck) => {
    navigate("/view-deck", { state: { deck, user } });
  };

  return (
    <div className="dashboard">
      <Navbar/>
      <div className="dashboard-content">
        <h2 className="dashboard-content-welcome">Welcome back!</h2>
        <p className="dashboard-content-text">Convert your notes into interactive learning material!</p>
        <div className="dashboard-content-first-container">
          <div className="dashboard-content-first-container-box" onClick={createFlashCardSet}>
            <div className="dashboard-content-first-container-box-icons">
              <div className="dashboard-content-first-container-box-icons-box">
                <img src={card} alt="" className="dashboard-content-first-container-box-icons-box-icon" />
              </div>
            </div>
            <h2 className="dashboard-content-first-container-box-icons-box-header">Create Flashcard Set</h2>
            <p className="dashboard-content-first-container-box-icons-box-content">Transform your notes into interactive flashcards for effective memorization.</p>
          </div>
          <div className="dashboard-content-first-container-box" onClick={createSummary}>
            <div className="dashboard-content-first-container-box-icons">
              <div className="dashboard-content-first-container-box-icons-box">
                <img src={ai} alt="" className="dashboard-content-first-container-box-icons-box-icon" />
              </div>
            </div>
            <h2 className="dashboard-content-first-container-box-icons-box-header">Summerize Notes</h2>
            <p className="dashboard-content-first-container-box-icons-box-content">Convert detailed notes into concise summaries perfect for quick review.</p>
          </div>
        </div>
        <h2 className="dashboard-content-sets-text">My Study Sets</h2>
        <div className="dashboard-content-sets-sets">
          {decks.length > 0 ? (
            decks.map((deck) => (
              <div className="tempset" key={deck._id} onClick={() => viewDeck(deck)}>
                <div className="tempset-left">
                  <h2 className="tempset-left-title">{deck.title}</h2>
                  <h2 className="tempset-left-text">{deck.description}</h2>
                </div>
                <p className="tempset-time">{new Date(deck.updatedAt).toLocaleDateString()}</p>
              </div>
            ))
          ) : (
            <div className="no-sets">
              <p>You haven't created any study sets yet. Click an option above to get started!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
{
  /* {user ? <h1>Welcome, {user.email}</h1> : <p>No user data available.</p>} */
}
