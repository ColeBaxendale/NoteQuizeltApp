import React, { useState } from "react";
import "react-toastify/dist/ReactToastify.css";
import { toast } from "react-toastify";
import { useNavigate } from 'react-router-dom';
import API from "../../utils/api.js";

const SignIn = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior

    // Check email and password validity before proceeding
    if (!email) {
        toast.error("Please enter an email address.");
        return;
    }
    if (!password) {
        toast.error("Please enter your password.");
        return;
    }

    setIsLoading(true); // Start loading

    try {
        await API.post("/auth/signin", { email, password }); // Send login request
        toast.success("Logged in successfully!");
        navigate("/dashboard"); 
    } catch (error) {
        toast.error(error.response?.data?.message || "Login failed");
    } finally {
        setIsLoading(false);
    }
};

    // Google OAuth Login
    const handleGoogleLogin = () => {
      window.location.href = "http://localhost:5001/auth/google"; // Redirects to OAuth endpoint
  };



  return (
<form className="auth-form" onSubmit={handleLogin} noValidate>
<input className="input" type="email" placeholder="" disabled={isLoading} value={email} onChange={(e) => setEmail(e.target.value)} />
<input className="input-password" type="password" disabled={isLoading} placeholder="" value={password} onChange={(e) => setPassword(e.target.value)} />
<button disabled={isLoading} className={`button ${isLoading ? "loading" : ""}`}>{isLoading ? "Signing in..." : "Sign in"}</button>
<button className="google-button" disabled={isLoading} type="button" onClick={handleGoogleLogin}></button>
</form>


  );
};

export default SignIn;