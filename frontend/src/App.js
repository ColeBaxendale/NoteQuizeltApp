import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./utils/AuthContext"; // adjust the path as needed
import { ToastContainer, Slide } from "react-toastify";
import Dashboard from "./pages/dashboard/dashboard";
import ProtectedRoute from "./utils/protected-route";
import CreateFlashCards from "./pages/decks/create-flashcards";
import CreateSummary from "./pages/decks/create-summary";
import ViewDeck from "./pages/decks/view-deck";
import LoadingScreen from "./pages/auths/loading";
import Account from "./pages/auths/account";
import CreateDeck from "./pages/decks/create-deck";

const App = () => {
  return (
    <Router>
    <AuthProvider>
      <ToastContainer position="top-right" theme="dark" transition={Slide} autoClose={3000} />
      <Routes>
        <Route path="/account" element={<Account />} />

        <Route path="/oauth-success" element={<LoadingScreen />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-flashcards"
          element={
            <ProtectedRoute>
              <CreateFlashCards />
            </ProtectedRoute>
          }
        />

<Route
          path="/create-set"
          element={
            <ProtectedRoute>
              <CreateDeck />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-summary"
          element={
            <ProtectedRoute>
              <CreateSummary />
            </ProtectedRoute>
          }
        />
          <Route path="/view-deck/:deckId" element={
            <ProtectedRoute>
              <ViewDeck />
            </ProtectedRoute>
          } />
      </Routes>
    </AuthProvider>
  </Router>
  );
};

export default App;
