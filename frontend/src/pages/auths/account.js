import React, { useState, useContext } from "react";
import "react-toastify/dist/ReactToastify.css";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import API from "../../utils/api.js";
import loginImage from "../../assets/auth.png";
import { AuthContext } from "../../utils/AuthContext";
import logo from "../../assets/logo2.png";
import "./account.css";
import { FaGoogle } from "react-icons/fa";
import { FaApple } from "react-icons/fa";

const Account = () => {
  const { updateUser } = useContext(AuthContext);
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [emailSignup, setEmailSignup] = useState("");
  const [passwordSignup, setPasswordSignup] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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

      await API.post(
        "/auth/signup",
        { email, password },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      toast.success("Account created successfully!");
      navigate("/signin"); // Redirect to sign-in page
    } catch (error) {
      toast.error(error.response?.data?.message || "Sign-up failed.");
    } finally {
      setIsLoading(false);
    }
  };

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
      await API.post("/auth/signin", { email, password });
      // After successful login, fetch user info
      const meRes = await API.get("/auth/user");
      updateUser(meRes.data);
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

  const toggleForm = () => setIsLogin((prev) => !prev);

  return (
    <div className="auth-page">
      <div className="auth-page-left">
        {isLogin ? (
          <div className="auth-page-left-container">
            <div className="auth-page-left-container-header">
              <img src={logo} alt="" className="auth-page-left-container-header-logo" />
              <h1 className="auth-page-left-container-header-text" onClick={backToHome}>
                NoteGenius
              </h1>
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
                <input
                  className="auth-page-left-container-form-input-container-input"
                  type="email"
                  placeholder="Enter your email"
                  disabled={isLoading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="auth-page-left-container-form-input-container">
                <label htmlFor="" className="auth-page-left-container-form-input-container-label">
                  Password
                </label>
                <input
                  className="auth-page-left-container-form-input-container-input"
                  type="password"
                  placeholder="Enter your password"
                  disabled={isLoading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="auth-page-left-container-form-forgot">
                <a href="/forgot" className="auth-page-left-container-form-forgot-password">
                  Forgot Password
                </a>
              </div>
              <button disabled={isLoading} className={`auth-page-left-container-form-submit ${isLoading ? "loading" : ""}`}>
                {isLoading ? "Signing in..." : "Sign in"}
              </button>
              <div className="auth-page-left-container-form-continue">
                <div className="auth-page-left-container-form-continue-line" />
                <div className="auth-page-left-container-form-continue-text">Or continue with</div>
                <div className="auth-page-left-container-form-continue-line" />
              </div>
              <div className="auth-page-left-container-form-buttons">
              <button className="auth-page-left-container-form-buttons-button" disabled={isLoading} type="button" onClick={handleGoogleLogin}>
                  <FaGoogle className="text-white mr-2 text-lg" />
                  Google
                </button>
                <button className="auth-page-left-container-form-buttons-button" disabled={isLoading} type="button" onClick={handleAppleLogin}>
                  <FaApple className="text-white mr-2 text-lg" />
                  Apple
                </button>
              </div>
              <div className="auth-page-left-container-form-signup">
                <p className="auth-page-left-container-form-signup-text">Don't have an account? &nbsp;</p>
                <a onClick={toggleForm} className="auth-page-left-container-form-signup-link">
                  Sign up
                </a>
              </div>
            </form>
          </div>
        ) : (
          <div className="auth-page-left-container">
            <div className="auth-page-left-container-header">
              <img src={logo} alt="" className="auth-page-left-container-header-logo" />
              <h1 className="auth-page-left-container-header-text" onClick={backToHome}>
                NoteGenius
              </h1>
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
                <input
                  className="auth-page-left-container-form-input-container-input"
                  type="email"
                  placeholder="Enter your email"
                  disabled={isLoading}
                  value={emailSignup}
                  onChange={(e) => setEmailSignup(e.target.value)}
                />
              </div>
              <div className="auth-page-left-container-form-input-container">
                <label htmlFor="" className="auth-page-left-container-form-input-container-label">
                  Password
                </label>
                <input
                  className="auth-page-left-container-form-input-container-input"
                  type="password"
                  placeholder="Enter your password"
                  disabled={isLoading}
                  value={passwordSignup}
                  onChange={(e) => setPasswordSignup(e.target.value)}
                />
              </div>

              <div className="auth-page-left-container-form-forgot">
                <p className="auth-page-left-container-form-forgot-password-transparent">Forgot Password</p>
              </div>
              <button disabled={isLoading} className={`auth-page-left-container-form-submit ${isLoading ? "loading" : ""}`}>
                {isLoading ? "Signing up..." : "Sign up"}
              </button>
              <div className="auth-page-left-container-form-continue">
                <div className="auth-page-left-container-form-continue-line" />
                <div className="auth-page-left-container-form-continue-text">Or continue with</div>
                <div className="auth-page-left-container-form-continue-line" />
              </div>
              <div className="auth-page-left-container-form-buttons">
                <button className="auth-page-left-container-form-buttons-button" disabled={isLoading} type="button" onClick={handleGoogleLogin}>
                  <FaGoogle className="text-white mr-2 text-lg" />
                  Google
                </button>
                <button className="auth-page-left-container-form-buttons-button" disabled={isLoading} type="button" onClick={handleAppleLogin}>
                  <FaApple className="text-white mr-2 text-lg" />
                  Apple
                </button>
              </div>
              <div className="auth-page-left-container-form-signup">
                <p className="auth-page-left-container-form-signup-text">Already have an account? &nbsp;</p>
                <a onClick={toggleForm} className="auth-page-left-container-form-signup-link">
                  Sign in
                </a>
              </div>
            </form>
          </div>
        )}
      </div>

      <div className="auth-page-right">
        <img src={loginImage} alt="" className="auth-page-right-image" />
      </div>
    </div>
  );
};

export default Account;

//   {/* Toggle Button */}
//   <div className="text-center mt-6">
//     <button onClick={toggleForm} className="text-blue-500 underline">
//       {isLogin ? "Switch to Sign Up" : "Switch to Login"}
//     </button>
//   </div>

//   {/* Conditional Placeholder Rendering */}
//   <div className="mt-10 text-center">
//     {isLogin ? (
//       <div>
//         <h2 className="text-2xl font-semibold">Login Placeholder</h2>
//       </div>
//     ) : (
//       <div>
//         <h2 className="text-2xl font-semibold">Sign Up Placeholder</h2>
//       </div>
//     )}
//   </div>
