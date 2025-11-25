import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const PublicRoute: React.FC = () => {
  const token = localStorage.getItem("token");

  if (token) {
    // If token exists, redirect to home page
    return <Navigate to="/dashboard" />;
  }

  // If no token, allow access to the public route (e.g., login)
  return <Outlet />;
};

export default PublicRoute;
