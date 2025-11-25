import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getUserFromLocalStorage, getUserRole } from "../api/auth";

interface RoleBasedRouteProps {
  allowedRoles: string[];
  redirectTo?: string;
}

const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({ allowedRoles, redirectTo = "/unauthorized" }) => {
  const user = getUserFromLocalStorage();
  const role = getUserRole();
  const location = useLocation();

  // If no user, redirect to login
  if (!user || !role) {
    return <Navigate to="/login" replace />;
  }

  // ✅ Allow access if user's role is in allowedRoles
  if (allowedRoles.includes(role)) {
    return <Outlet />;
  }

  // ✅ Admin always has full access
  if (role === "admin") {
    return <Outlet />;
  }

  // ✅ Core-Member specific access control
  if (role === "core-member") {
    const allowedPaths = [
      "/community",
      "/community-members",
      "/user-core",
      "/dashboard-core"
    ];
    const isUserPage = /^\/user\/[a-zA-Z0-9]+$/.test(location.pathname);

    if (allowedPaths.some(path => location.pathname.startsWith(path)) || isUserPage) {
      return <Outlet />;
    }

    return <Navigate to="/dashboard-core" replace />;
  }

  // ✅ Deny access if role is not allowed
  return <Navigate to={redirectTo} replace />;
};

export default RoleBasedRoute;
