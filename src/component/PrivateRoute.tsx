import { Navigate, Outlet } from "react-router-dom";
import { getUserFromLocalStorage, getUserRole } from "../api/auth";

const PrivateRoute = () => {
  const user = getUserFromLocalStorage();
  const role = getUserRole();
  const token = localStorage.getItem("token");

  return user && token && role ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoute;
