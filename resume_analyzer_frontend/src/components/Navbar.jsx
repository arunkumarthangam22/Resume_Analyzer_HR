import React from "react";
import { AppBar, Toolbar, Button, IconButton, Menu, MenuItem } from "@mui/material";
import { Link, useLocation } from "react-router-dom";
import MenuIcon from "@mui/icons-material/Menu"; // Mobile menu icon
import { useState } from "react";

const Navbar = () => {
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState(null);

  // Function to check if a button is active
  const isActive = (path) => location.pathname === path;

  // Handle mobile menu
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar
      position="static"
      sx={{
        backgroundColor: "#1f57b5",
        borderBottom: "3px solid white",
        boxShadow: "0px 4px 10px rgba(255, 255, 255, 0.3)",
        paddingX: { xs: 1, md: 3 },
      }}
    >
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        {/* Brand Name (Left Side) */}
        <Button
          component={Link}
          to="/"
          sx={{
            fontSize: "1.2rem",
            fontWeight: "bold",
            color: "white",
            "&:hover": { color: "#ffd700" },
          }}
        >
          Resume Analyzer
        </Button>

        {/* Navbar Buttons (For Desktop) */}
        <div style={{ display: "flex", gap: "1rem" }}>
          {["/", "/upload", "/dashboard", "/report"].map((path, index) => (
            <Button
              key={index}
              component={Link}
              to={path}
              sx={{
                color: isActive(path) ? "#ffd700" : "white",
                fontWeight: isActive(path) ? "bold" : "normal",
                borderBottom: isActive(path) ? "2px solid #ffd700" : "none",
                transition: "0.3s ease",
                "&:hover": { color: "#ffd700" },
              }}
            >
              {path === "/" ? "Home" : path.slice(1).charAt(0).toUpperCase() + path.slice(2)}
            </Button>
          ))}
        </div>

        {/* Mobile Menu (Hamburger) */}
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          sx={{ display: { xs: "flex", md: "none" } }}
          onClick={handleMenuOpen}
        >
          <MenuIcon />
        </IconButton>

        {/* Mobile Dropdown Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          sx={{ display: { xs: "block", md: "none" } }}
        >
          {["/", "/upload", "/dashboard", "/report"].map((path, index) => (
            <MenuItem key={index} component={Link} to={path} onClick={handleMenuClose}>
              {path === "/" ? "Home" : path.slice(1).charAt(0).toUpperCase() + path.slice(2)}
            </MenuItem>
          ))}
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
