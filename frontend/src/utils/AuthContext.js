// utils/AuthContext.js
import React, { createContext, useState, useEffect } from "react";
import API from "./api"; // Adjust the path as needed

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // for initial auth check

  const updateUser = (userData) => {
    setUser(userData);
  };

  // Check if the user is already logged in on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await API.get("/auth/user");
        setUser(response.data); // Should include user data like id, isPremium
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
