import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignIn from "./pages/auths/signin";
import SignUp from "./pages/auths/signup";
import { ToastContainer, Slide } from "react-toastify";
import Dashboard from "./pages/dashboard/dashboard";
import ProtectedRoute from "./utils/protected-route";
import CreateFlashCards from "./pages/decks/create-flashcards";
import CreateSummary from "./pages/decks/create-summary";

const App = () => {
  return (
    <Router>
      <ToastContainer position="top-right" theme="light" transition={Slide} autoClose={3000} />

      <Routes>
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/dashboard" element={ <ProtectedRoute> <Dashboard /> </ProtectedRoute>}/>
        <Route path="/create-flashcards" element={ <ProtectedRoute> <CreateFlashCards /> </ProtectedRoute>}/>
        <Route path="/create-summary" element={ <ProtectedRoute> <CreateSummary /> </ProtectedRoute>}/>


      </Routes>
    </Router>
  );
};

export default App;