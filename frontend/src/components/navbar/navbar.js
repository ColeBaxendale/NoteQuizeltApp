import "./navbar.css";
import logo from "../../assets/logo2.png";
import crown from "../../assets/crown.png";
import React, { useContext } from "react";
// import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../utils/AuthContext.js";


const Navbar = () => {
  const { user } = useContext(AuthContext); 



  const handleUpgrade = () => {
    console.log("stripe");
  };


  return (
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
  );
};

export default Navbar;
