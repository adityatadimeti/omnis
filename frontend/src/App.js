// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Login from './Login';
import Dashboard from './Dashboard';
import ChatInterface from './ChatInterface';
import FirebaseVideoPlayer from './FirebaseVideoPlayer';
import VideoPage from './VideoPage';

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />

          {/* Class name (or ID) route parameter */}
          <Route
            path="/class/:className"
            element={
              <PrivateRoute>
                <ChatInterface />
              </PrivateRoute>
            }
          />
          <Route path="/video" element={<VideoPage />} />
          {/* Default route goes to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
