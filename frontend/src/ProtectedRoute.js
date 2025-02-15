import React from "react";
import { useAuth } from "./AuthProvider";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // Optional loading state
  }

  if (!user) {
    return (
      <h1 style={{ color: "white" }}>Please sign in to view this page.</h1>
    );
  }

  return children;
};

export default ProtectedRoute;
