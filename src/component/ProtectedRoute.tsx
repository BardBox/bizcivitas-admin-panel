import React, { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

interface ProtectedRouteProps {
  allowedRoles: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const auth = useContext(AuthContext);

  if (auth?.loading) {
    return <p>Loading...</p>; // Or a spinner
  }

  if (!auth?.user) {
    return <Navigate to="/" />; // Redirect if not authenticated
  }

  return allowedRoles.includes(auth.user.role) ? <Outlet /> : <Navigate to="/core" />;
};

export default ProtectedRoute;
