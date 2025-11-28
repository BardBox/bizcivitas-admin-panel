import React, { useState } from "react";
import {
  Box,
  Drawer,
  SwipeableDrawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Divider,
  useMediaQuery,
} from "@mui/material";
import { Menu as MenuIcon, ExitToApp } from "@mui/icons-material";
import { Link, useLocation, useNavigate } from "react-router-dom";

import DashboardIcon from "@mui/icons-material/Dashboard";
import SupervisedUserCircleIcon from "@mui/icons-material/SupervisedUserCircle";
import PeopleIcon from "@mui/icons-material/People";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import PaymentIcon from "@mui/icons-material/Payment";
import EventIcon from "@mui/icons-material/Event";
import GroupsIcon from "@mui/icons-material/Groups";
import MapIcon from "@mui/icons-material/Map";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import FeedIcon from "@mui/icons-material/Feed";
import ReportIcon from "@mui/icons-material/Report";
import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";
import CardMembershipIcon from "@mui/icons-material/CardMembership";
import CampaignIcon from "@mui/icons-material/Campaign";
import BarChartIcon from "@mui/icons-material/BarChart";
// import HandshakeIcon from "@mui/icons-material/Handshake"; // Hidden until backend ready
// Function to get user role from localStorage
const getUserRole = (): string | null => {
  return localStorage.getItem("role");
};

export default function AdminSidebar() {
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width:1024px)");
  const location = useLocation();
  const navigate = useNavigate();
  const userRole = getUserRole();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    navigate("/");
  };

  const toggleDrawer =
    (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
      if (
        event.type === "keydown" &&
        ((event as React.KeyboardEvent).key === "Tab" ||
          (event as React.KeyboardEvent).key === "Shift")
      ) {
        return;
      }
      setOpen(open);
    };

  if (location.pathname === "/") return null;

  return (
    <>
      {!isDesktop && (
        <IconButton
          onClick={toggleDrawer(true)}
          sx={{
            position: "fixed",
            top: 10,
            left: 10,
            zIndex: 2000,
            color: "black",
          }}
        >
          <MenuIcon />
        </IconButton>
      )}

      {isDesktop ? (
        <Drawer
          variant="permanent"
          sx={{
            width: 250,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: 250,
              bgcolor: "white",
              position: "fixed",
              height: "100vh",
              borderRight: "2px solid #E0E0E0",
            },
          }}
        >
          <SidebarContent handleLogout={handleLogout} userRole={userRole} />
        </Drawer>
      ) : (
        <SwipeableDrawer
          anchor="left"
          open={open}
          onClose={toggleDrawer(false)}
          onOpen={toggleDrawer(true)}
          sx={{ "& .MuiDrawer-paper": { width: 250, bgcolor: "white" } }}
        >
          <SidebarContent
            handleLogout={handleLogout}
            closeSidebar={() => setOpen(false)}
            userRole={userRole}
          />
        </SwipeableDrawer>
      )}
    </>
  );
}

const SidebarContent = ({
  closeSidebar,
  handleLogout,
  userRole,
}: {
  closeSidebar?: () => void;
  handleLogout: () => void;
  userRole: string | null;
}) => {
  const location = useLocation();

  const menuItems = [
    {
      text: "Dashboard",
      icon: <DashboardIcon />,
      link: "/dashboard",
      roles: ["admin"],
    },
    {
      text: "Comprehensive Stats",
      icon: <BarChartIcon />,
      link: "/comprehensive-dashboard",
      roles: ["admin"],
    },
    {
      text: "BizWin Analytics",
      icon: <PaymentIcon />,
      link: "/bizwin-analytics",
      roles: ["admin"],
    },
    // {
    //   text: "BizConnect Analytics",
    //   icon: <HandshakeIcon />,
    //   link: "/bizconnect-analytics",
    //   roles: ["admin"],
    // },
    {
      text: "Core Members",
      icon: <SupervisedUserCircleIcon />,
      link: "/core",
      roles: ["admin"],
    },
    { text: "Users", icon: <PeopleIcon />, link: "/user", roles: ["admin"] },
    { text: "Add User", icon: <PersonAddIcon />, link: "/add-user", roles: ["admin"] },
    {
      text: "Payments",
      icon: <PaymentIcon />,
      link: "/user-payment",
      roles: ["admin"],
    },
    {
      text: "Events",
      icon: <EventIcon />,
      link: "/AllEvents/one-day",
      roles: ["admin"],
    },
    {
      text: "Community",
      icon: <GroupsIcon />,
      link: "/community",
      roles: ["admin"],
    },
    { text: "Region", icon: <MapIcon />, link: "/region", roles: ["admin"] },
    {
      text: "Meetings",
      icon: <MeetingRoomIcon />,
      link: "/Meetingpage",
      roles: ["admin"],
    },
    {
      text: "Biz Pulse",
      icon: <FeedIcon />,
      link: "/Wallfeed",
      roles: ["admin"],
    },
    {
      text: "Wall feed",
      icon: <FeedIcon />,
      link: "/dailyfeed",
      roles: ["admin"],
    },
    {
      text: "Manual Payment",
      icon: <FeedIcon />,
      link: "/Mannual-payment",
      roles: ["admin"],
    },
    {
      text: "Knowledge Hub",
      icon: <CampaignIcon />,
      link: "/upload",
      roles: ["admin"],
    },

    {
      text: "View/Report-Post",
      icon: <ReportIcon />,
      link: "/report-post",
      roles: ["admin"],
    },
    {
      text: "Inquiry",
      icon: <QuestionAnswerIcon />,
      link: "/Inquiry",
      roles: ["admin"],
    },
    {
      text: "Membership manage",
      icon: <CardMembershipIcon />,
      link: "/memberships",
      roles: ["admin"],
    },
    {
      text: "Dashboard",
      icon: <DashboardIcon />,
      link: "/dashboard-core",
      roles: ["core-member"],
    },
    {
      text: "Community",
      icon: <GroupsIcon />,
      link: "/community-core",
      roles: ["core-member"],
    },
    {
      text: "Users",
      icon: <PeopleIcon />,
      link: "/user-core",
      roles: ["core-member"],
    },
  ];

  const filteredMenu = menuItems.filter((item) =>
    item.roles.includes(userRole || "")
  );

  return (
    <Box
      role="presentation"
      onClick={closeSidebar}
      onKeyDown={closeSidebar}
      sx={{ height: "100vh" }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          padding: "10px",
        }}
      >
        <img
          src="/bizcivitaslogo.jpg"
          alt="Logo"
          style={{
            height: "70px",
            width: "auto",
            marginRight: "0px",
          }}
        />
      </Box>

      <Divider />

      <List>
        {filteredMenu.map((item, index) => {
          const isActive = location.pathname === item.link;
          return (
            <ListItem key={index} disablePadding>
              <ListItemButton
                component={Link}
                to={item.link}
                sx={{
                  fontWeight: "bold",
                  borderRadius: "8px",
                  mx: 0,
                  transition: "all 0.3s ease-in-out",
                  backgroundColor: isActive ? "transparent" : "transparent",
                  color: isActive ? "#1976d2" : "black",
                  "&:hover": {
                    backgroundColor: "#E3F2FD",
                    color: "#1976d2",
                    transform: "scale(1.05)",
                    fontWeight: "bold",
                  },
                  "&.Mui-selected": {
                    color: "#1976d2",
                    fontWeight: "bold",
                    transform: "scale(1.05)",
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? "#1976d2" : "black",
                    fontSize: isActive ? "1.5rem" : "1rem",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  sx={{
                    color: isActive ? "#1976d2" : "black",
                    fontSize: isActive ? "1.2rem" : "1rem",
                    fontWeight: isActive ? "bold" : "normal",
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider />

      <ListItem disablePadding>
        <ListItemButton
          onClick={handleLogout}
          sx={{
            mx: 1,
            borderRadius: "8px",
            transition: "all 0.3s ease-in-out",
            "&:hover": {
              backgroundColor: "#E3F2FD",
              transform: "scale(1.05)",
            },
          }}
        >
          <ListItemIcon>
            <ExitToApp />
          </ListItemIcon>
          <ListItemText primary="Log Out" />
        </ListItemButton>
      </ListItem>
    </Box>
  );
};
