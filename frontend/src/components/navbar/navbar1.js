import "./navbar.css";
import logo from "../../assets/logo.png";
import crown from "../../assets/crown.png";
import React, { useContext } from "react";
// import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../utils/AuthContext.js";
import { FaArrowLeft } from "react-icons/fa";



const Navbar1 = () => {
  const { user } = useContext(AuthContext); 
//   const navigate = useNavigate();



  const handleUpgrade = () => {
    console.log("stripe");
  };

  const handleBack = () => {
    console.log("stripe");
  };



  return (
      <div className="create-flashcard-nav">
        <div className="create-flashcard-nav-container">
          <img src={logo} alt="Logo" className="create-flashcard-nav-container-logo" />
          <h1 className="create-flashcard-nav-container-text">NoteGenius</h1>
              <div className="back-to-dashboard" onClick={handleBack}>
                <FaArrowLeft className="back-icon" />
                <span>Dashboard</span>
              </div>
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
  );
};

export default Navbar1;
