import "./dashboard.css";
import logo from "../../assets/logo.png";
import sun from "../../assets/brightness.png";
import moon from "../../assets/night-mode.png";
import card from "../../assets/flash-card.png";
import ai from "../../assets/ai.png";
import search from "../../assets/search.png";
import crown from "../../assets/crown.png";

import rightArrow from "../../assets/right-arrow.png";
import React, { useEffect, useState } from "react";
import axios from "axios"; // or use fetch API
import API from "../../utils/api.js";

import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [decks, setDecks] = useState([]);

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


  useEffect(() => {
    // Fetch the user's decks only if the user is logged in
    if (user) {
      const fetchDecks = async () => {
        try {
          const response = await API.get("/deck/user-decks");
          // Sort decks by updatedAt descending (most recent first)
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

  const handleUpgrade = () => {
    console.log("stripe");
  };
  
  const createFlashCardSet = () => {
    navigate("/create-flashcards");
  };

  return (
    <div className="dashboard">
      <div className="dashboard-nav">
        <div className="dashboard-nav-container">
          <img src={logo} alt="" className="dashboard-nav-container-logo" />
          <h1 className="dashboard-nav-container-text">NoteGenius</h1>
        </div>
        <div className="dashboard-nav-container2">
          {user && !user.isPremium && (
            <button className="dashboard-nav-container2-button" onClick={handleUpgrade}>
              Get Premium
            </button>
          )}
          {user && user.isPremium && <img src={crown} alt="" className="dashboard-nav-container-logo-prem" />}
          <div className="dashboard-nav-container-profile">
            <p className="dashboard-nav-container-profile-text">{user ? user.email.slice(0, 2).toUpperCase() : ""}</p>
          </div>
        </div>
      </div>
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
          <div className="dashboard-content-first-container-box">
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
              <div className="tempset" key={deck._id}>
                <div className="tempset-left">
                  <h2 className="tempset-left-title">{deck.title}</h2>
                  <h2 className="tempset-left-text">{deck.description}</h2>
                </div>
                <p className="tempset-time">
                  {new Date(deck.updatedAt).toLocaleDateString()}
                </p>
              </div>
            ))
          ) : (
            <div className="no-sets">
              <p>
                You haven't created any study sets yet. Click an option above to get started!
              </p>
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
