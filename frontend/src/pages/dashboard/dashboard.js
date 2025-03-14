import "./dashboard.css";
import logo from "../../assets/logo.png";
import sun from "../../assets/brightness.png";
import moon from "../../assets/night-mode.png";
import React, { useEffect, useState } from 'react';
import axios from 'axios'; // or use fetch API
import API from "../../utils/api.js";

import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await API.get('/auth/user'); 
        setUser(response.data);
      } catch (err) {
        console.error('Failed to fetch user:', err);
        navigate('/signin'); 
      } finally {
      }
    };

    fetchUser();
  }, [navigate]); 

  return (
    <div className="dashboard">
      <div className="dashboard-nav">
        <div className="dashboard-nav-container">
          <img src={logo} alt="" className="dashboard-nav-container-logo" />
          <h1 className="dashboard-nav-container-text">NoteGenius</h1>
        </div>
        <div className="dashboard-nav-container2">
          <div className="dashboard-nav-container-profile">
            <p className="dashboard-nav-container-profile-text">CB</p>
          </div>
        </div>
      </div>
      {user ? <h1>Welcome, {user.email}</h1> : <p>No user data available.</p>}
    </div>
  );
};

export default Dashboard;
