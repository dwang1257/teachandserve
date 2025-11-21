import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from './components/Layout/Header';
import LandingPage from './components/LandingPage/LandingPage';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import Dashboard from './components/Dashboard/Dashboard';
import MatchedProfiles from './components/Dashboard/MatchedProfiles';
import Messages from './components/Messages/Messages';
import ProfileSetup from './components/Profile/ProfileSetup';
import CompleteProfile from './components/Profile/CompleteProfile';
import ViewProfile from './components/Profile/ViewProfile';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import NotificationBanner from './components/Notifications/NotificationBanner';
import MenteeProfileForm from './components/Forms/MenteeForm.tsx';
import MentorProfileForm from './components/Forms/MentorForm.tsx';
import './App.css';

const AppRoutes = () => {
  const { user, loading, profileStatus, profileStatusLoading } = useAuth();
  const requiresProfileCompletion = user && profileStatus && !profileStatus.isComplete;

  if (loading || profileStatusLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      {user && profileStatus?.isComplete && <NotificationBanner />}
      <Routes>
        <Route
          path="/"
          element={
            user
              ? requiresProfileCompletion
                ? <Navigate to="/complete-profile" />
                : <Navigate to="/dashboard" />
              : <LandingPage />
          }
        />
        <Route
          path="/login"
          element={
            user
              ? requiresProfileCompletion
                ? <Navigate to="/complete-profile" />
                : <Navigate to="/dashboard" />
              : <Login />
          }
        />
        <Route
          path="/signup"
          element={
            user
              ? requiresProfileCompletion
                ? <Navigate to="/complete-profile" />
                : <Navigate to="/dashboard" />
              : <Signup />
          }
        />
        <Route 
          path="/complete-profile" 
          element={
            <ProtectedRoute allowIncompleteProfile>
              <CompleteProfile />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile/setup" 
          element={
            <ProtectedRoute allowIncompleteProfile>
              <ProfileSetup />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile/view" 
          element={
            <ProtectedRoute>
              <ViewProfile />
            </ProtectedRoute>
          } 
        />
        <Route
          path="/matches"
          element={
            <ProtectedRoute>
              <MatchedProfiles />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <Messages />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <div className="App">
      <Router>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
    </div>
  );
}

export default App;