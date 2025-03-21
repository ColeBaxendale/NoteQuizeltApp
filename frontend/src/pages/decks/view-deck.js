import React from "react";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import "./create-flashcards.css";
import logo from "../../assets/logo.png";
import crown from "../../assets/crown.png";

const ViewDeck = () => {
    const navigate = useNavigate();
  const location = useLocation();
  const { deck } = location.state || {};
  const { user } = location.state || {};

  
  if (!deck) {
    navigate("/dashboard");
  }

  const handleUpgrade = () => {
    console.log("stripe");
  };
  
  return (
    <div>
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
    </div>
  );
};

export default ViewDeck;