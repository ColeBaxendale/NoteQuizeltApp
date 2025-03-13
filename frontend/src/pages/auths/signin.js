import React, { useState } from "react";
import "react-toastify/dist/ReactToastify.css";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import API from "../../utils/api.js";
import loginImage from "../../assets/auth_image.png";
import google from "../../assets/google.png";
import apple from "../../assets/apple.png";


import logo from "../../assets/logo.png";

import "./auth.css";

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
                    <h1 className="auth-page-left-container-welcome-text">Welcome Back!</h1>
                    <p className="auth-page-left-container-welcome-p-text">Convert your notes into interactive learning materials</p>
                </div>
                <form className="auth-page-left-container-form" onSubmit={handleLogin} noValidate>
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
                        <a href="/forgot" className="auth-page-left-container-form-forgot-password">Forgot Password</a>
                    </div>
                    <button disabled={isLoading} className={`auth-page-left-container-form-submit ${isLoading ? "loading" : ""}`}>{isLoading ? "Signing in..." : "Sign in"}</button>
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
                        <p className="auth-page-left-container-form-signup-text">Don't have an account? &nbsp;</p>
                        <a href="/signup" className="auth-page-left-container-form-signup-link">Sign up</a>
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

export default SignIn;

{
  /* <form className="auth-form" onSubmit={handleLogin} noValidate>
<input className="input" type="email" placeholder="" disabled={isLoading} value={email} onChange={(e) => setEmail(e.target.value)} />
<input className="input-password" type="password" disabled={isLoading} placeholder="" value={password} onChange={(e) => setPassword(e.target.value)} />
<button disabled={isLoading} className={`button ${isLoading ? "loading" : ""}`}>{isLoading ? "Signing in..." : "Sign in"}</button>
<button className="google-button" disabled={isLoading} type="button" onClick={handleGoogleLogin}></button>
</form> */
}