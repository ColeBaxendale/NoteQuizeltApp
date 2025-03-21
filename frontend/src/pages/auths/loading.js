import "../decks/create-flashcards.css";
import { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../utils/api";
import { AuthContext } from "../../utils/AuthContext";
import { toast } from "react-toastify";

const LoadingScreen = () => {
  const { updateUser } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await API.get("/auth/user");
        updateUser(response.data);

        // Optional toast if you want
        navigate("/dashboard");
      } catch (err) {
        toast.error("Failed to complete OAuth login. Please try again.");
        navigate("/signin");
      }
    };

    fetchUser();
  }, [updateUser, navigate]);

  return (
    <div className="create-flashcard">
      <div className="loading-overlay">
        <div className="loading-content">
          <div className="spinner"></div>
          <p>Logging in please wait...</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
