import React, { useState } from "react";
import "react-toastify/dist/ReactToastify.css";
import { toast } from "react-toastify";
import { useNavigate } from 'react-router-dom';
import API from "../../utils/api.js";

const SignUp = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = re.test(String(email).toLowerCase());
    console.log(`Validating email: ${email} - Valid: ${isValid}`);
    return isValid;
  }

  const handleSignup = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior

    // Validate inputs
    if (!email || !validateEmail(email)) {
        toast.error("Please enter a valid email address.");
        return;
    }
    if (!password || password.length < 8) {
        toast.error("Password must be at least 8 characters long.");
        return;
    }
    if (password !== confirmPassword) {
        toast.error("Passwords do not match.");
        return;
    }

    setIsLoading(true); // Start loading

    try {
        console.log(email);
        
        await API.post("/auth/signup", { email, password }, {
            headers: { "Content-Type": "application/json" }
          });
        
        toast.success("Account created successfully!");
        navigate("/signin"); // Redirect to sign-in page
    } catch (error) {
        toast.error(error.response?.data?.message || "Sign-up failed.");
    } finally {
        setIsLoading(false);
    }
};


    // Google OAuth Login
    const handleGoogleLogin = () => {
      window.location.href = "http://localhost:5001/auth/google"; // Redirects to OAuth endpoint
  };



  return (
<form className="auth-form" onSubmit={handleSignup} noValidate>
<input className="input" type="email" placeholder="" disabled={isLoading} value={email} onChange={(e) => setEmail(e.target.value)} />
<input className="input-password" type="password" disabled={isLoading} placeholder="" value={password} onChange={(e) => setPassword(e.target.value)} />
<input className="input-password" type="password" disabled={isLoading} placeholder="" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
<button disabled={isLoading} className={`button ${isLoading ? "loading" : ""}`}>{isLoading ? "Signing up..." : "Sign up"}</button>
<button className="google-button" disabled={isLoading} type="button" onClick={handleGoogleLogin}></button>
</form>


  );
};

export default SignUp;