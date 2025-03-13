
import React, { useState } from "react";
import "react-toastify/dist/ReactToastify.css";
import { toast } from "react-toastify";
import { useNavigate } from 'react-router-dom';
import API from "../../utils/api.js";
import loginImage from "../../assets/auth_image.png";
import google from "../../assets/google.png";
import apple from "../../assets/apple.png";
import logo from "../../assets/logo.png";
import "./auth.css";

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

  const handleAppleLogin = () => {
    window.location.href = "http://localhost:5001/auth/google"; // Redirects to OAuth endpoint
  };

  const backToHome = () => {
    navigate("/");
  };



  return (
    <div className="auth-page">
        <div className="auth-page-left">
            <div className="auth-page-left-container">
                <div className="auth-page-left-container-header">
                    <img src={logo} alt="" className="auth-page-left-container-header-logo"/>
                    <h1 className="auth-page-left-container-header-text" onClick={backToHome}>NoteGenius</h1>
                </div>
                <div className="auth-page-left-container-welcome">
                    <h1 className="auth-page-left-container-welcome-text">Sign Up Today!</h1>
                    <p className="auth-page-left-container-welcome-p-text">Convert your notes into interactive learning materials</p>
                </div>
                <form className="auth-page-left-container-form" onSubmit={handleSignup} noValidate>
                    <div className="auth-page-left-container-form-input-container">
                        <label htmlFor="" className="auth-page-left-container-form-input-container-label">
                            Email Address
                        </label>
                        <input className="auth-page-left-container-form-input-container-input" type="email" placeholder="Enter your email" disabled={isLoading} value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className="auth-page-left-container-form-input-container">
                        <label htmlFor="" className="auth-page-left-container-form-input-container-label">
                            Password
                        </label>
                        <input className="auth-page-left-container-form-input-container-input" type="password" placeholder="Enter your password" disabled={isLoading} value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    <div className="auth-page-left-container-form-forgot">
                    </div>
                    <button disabled={isLoading} className={`auth-page-left-container-form-submit ${isLoading ? "loading" : ""}`}>{isLoading ? "Signing up..." : "Sign up"}</button>
                    <div className="auth-page-left-container-form-continue">
                        <div className="auth-page-left-container-form-continue-line"/>
                        <div className="auth-page-left-container-form-continue-text">Or continue with</div>
                        <div className="auth-page-left-container-form-continue-line"/>
                    </div>
                    <div className="auth-page-left-container-form-buttons">
                        <button className="auth-page-left-container-form-buttons-button" disabled={isLoading} type="button" onClick={handleGoogleLogin}>
                            <img src={google} alt="" className="auth-page-left-container-form-buttons-button-icon-google"/>
                            Google
                        </button>
                        <button className="auth-page-left-container-form-buttons-button" disabled={isLoading} type="button" onClick={handleAppleLogin}>
                            <img src={apple} alt="" className="auth-page-left-container-form-buttons-button-icon-apple"/>
                            Apple
                        </button>
                    </div>
                    <div className="auth-page-left-container-form-signup">
                        <p className="auth-page-left-container-form-signup-text">Already have an account? &nbsp;</p>
                        <a href="/signin" className="auth-page-left-container-form-signup-link">Sign in</a>
                    </div>
                </form>
            </div>
        </div>
        <div className="auth-page-right">
        <img src={loginImage} alt="" className="auth-page-right-image"/>

        </div>

    </div>

  );
};

export default SignUp;