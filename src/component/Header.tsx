import React, { useEffect, useState } from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import { useNavigate } from "react-router-dom";
import { useMediaQuery } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import api from "../api/api"; // Import the Axios instance

// Define the interface for user data
interface User {
  fname: string;
  lname: string;
  role: string;
  avatar: string;
}

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Fetch user data from API
useEffect(() => {
  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get("/users/get-user", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        const { fname, lname, role, avatar } = response.data.data;
        setUser({ fname, lname, role, avatar });
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  fetchUser();
}, []);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <AppBar
      position="sticky"
      sx={{
        backgroundColor: "white",
        boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
        zIndex: 1000,
        height: "100px",
      }}
    >
      <Toolbar sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: "100%", px: 2 }}>
        {/* Page Title */}
        <Typography variant={isMobile ? "h6" : "h5"} sx={{ color: "black", fontWeight: "bold" }}>
          {title}
        </Typography>

        {/* Profile Section */}
        <Box display="flex" alignItems="center" gap={2}>
          {/* Profile Menu */}
          <Box display="flex" alignItems="center" sx={{ cursor: "pointer" }} onClick={handleMenuOpen}>
            <Avatar alt="Profile Picture" src={user?.avatar || "./profile-pic.png"} sx={{ width: 40, height: 40 }} />
            {!isMobile && user && (
              <Box ml={1} display="flex" flexDirection="column">
                <Typography variant="subtitle1" color={"black"} sx={{ fontSize: "14px", fontWeight: "bold" }}>
                  {user.fname} {user.lname}
                </Typography>
                <Typography variant="body2" color="gray" sx={{ fontSize: "12px" }}>
                  {user.role}
                </Typography>
              </Box>
            )}
            {/* Dropdown Arrow */}
            <IconButton size="small" sx={{ ml: 1, color: "black" }}>
              <KeyboardArrowDownIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Dropdown Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
        >
          {user && (
            <MenuItem disabled>
              <Avatar alt="Profile Picture" src={user.avatar} sx={{ width: 40, height: 40, marginRight: "10px" }} />
              <div>
                <Typography variant="subtitle1">{user.fname} {user.lname}</Typography>
                <Typography variant="body2" color="gray">{user.role}</Typography>
              </div>
            </MenuItem>
          )}
          <MenuItem onClick={handleLogout}>Logout</MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
