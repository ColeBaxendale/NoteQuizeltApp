import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import API from "./api"; // ✅ Import API instance

const ProtectedRoute = ({ children }) => {
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const checkUser = async () => {
            try {
                const response = await API.get("/auth/user"); // ✅ Get user data

                if (response.data) {
                    setIsAuthenticated(true);
                }
            } catch (error) {
                setIsAuthenticated(false);
            } finally {
                setLoading(false);
            }
        };

        checkUser();
    }, []);

    if (loading) {
        return <div>Loading...</div>; // ✅ Show loading state
    }

    if (!isAuthenticated) {
        return <Navigate to="/signin" />; // ✅ Redirect to login if not authenticated
    }

    return children; 
};

export default ProtectedRoute;