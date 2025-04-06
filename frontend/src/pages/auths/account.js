import React, { useState, useContext } from "react";
import "react-toastify/dist/ReactToastify.css";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import API from "../../utils/api.js";
import loginImage from "../../assets/auth_image.png";
import google from "../../assets/google.png";
import apple from "../../assets/apple.png";
import { AuthContext } from "../../utils/AuthContext";
import logo from "../../assets/logo2.png";
import "./account.css";

const Account = () => {
  const [isLogin, setIsLogin] = useState(true);

  const toggleForm = () => setIsLogin((prev) => !prev);

  return (
    <div className="auth-page">
      <div className="auth-page-left">
        {isLogin ? (
          <div>
            <h2 className="text-2xl font-semibold">Login Placeholder</h2>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-semibold">Sign Up Placeholder</h2>
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
