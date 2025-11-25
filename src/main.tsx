import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { BrowserRouter, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { TabValueProvider } from "./context/tabValue";
import { LoadingProvider } from "./context/loading";
import AdminSidebar from "./component/AdminSidebar";
import Header from "./component/Header";
import { VisibilityProvider, useVisibility } from "./context/VisibilityContext";
import 'react-phone-input-2/lib/style.css';


import { createTheme, ThemeProvider } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2", // blue
    },
    secondary: {
      main: "#f50057", // pink
    },
    background: {
      default: "#f9f9f9",
    },
  },
  typography: {
    fontFamily: "Inter, sans-serif",
  },
});

// Layout component
const Layout: React.FC = () => {
  const { isSidebarAndHeaderVisible } = useVisibility();
  const location = useLocation();

  const pageTitles: { [key: string]: string } = {
    "/dashboard": "Dashboard",
    "/GuestList": "Guest List",
    "/user": "Users",
    "/core": "Core Members",
    "/EventCreation": "Create Event",
    "/AllEvents/one-day": "Events",
    "/AllEvents/online-events": "Online Events",
    "/AllEvents/trip-events": "Trip Events",
    "/community": "Community",
    "/dashboard-core": "Dashboard",
    "/community-core": "Community",
    "/user-core": "Users",
    "/region": "Regions",
    "/user/:userId": "User Dashboard",
    "/report-post": "Manage Reported Posts",
    "/memberships": "Membership Manage",
    "/meetings/:id": "Meeting Detail Page",
    "/upload": "Knowledge Hub",
    "/Wallfeed":"Biz Pulse"
  };

  let currentTitle = pageTitles[location.pathname] || "Dashboard";

  if (location.pathname.startsWith("/community-members/")) {
    currentTitle = "Community Members";
  }

  const isAuthPage = location.pathname === "/" || location.pathname === "/signup";

  return (
    <div className="flex bg-gray-100 h-screen">
      {!isAuthPage && isSidebarAndHeaderVisible && <AdminSidebar />}

      <div className="flex flex-col flex-1">
        {!isAuthPage && isSidebarAndHeaderVisible && (
          <Header title={currentTitle} />
        )}

        <div className="flex-1 bg-gray-100 p-4">
          <TabValueProvider>
            <LoadingProvider>
              <App />
            </LoadingProvider>
          </TabValueProvider>
        </div>
      </div>
    </div>
  );
};

const Root: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <ToastContainer
          limit={3}
          position="top-right"
          autoClose={2000}
          pauseOnFocusLoss={false}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          theme="light"
          icon={false}
        />
        <VisibilityProvider>
          <Layout />
        </VisibilityProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(<Root />);
