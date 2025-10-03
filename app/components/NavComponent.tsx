import * as React from "react";
import { useState, useEffect, useCallback, memo } from "react";
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import CssBaseline from "@mui/material/CssBaseline";
import MuiAppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import List from "@mui/material/List";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { Outlet } from "react-router";
import Icon from "@mui/material/Icon";
import { useNavigate } from "react-router";
import { navItems } from "../constants/navItems";
import { Help, Keyboard } from "@mui/icons-material";
import { useUserGuide, UserGuide } from "./UserGuide";
import { NotificationButton } from "./NotificationButton";

const drawerWidth = 240;

const Main = styled("main", { shouldForwardProp: (prop) => prop !== "open" })<{
  open?: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
  padding: 0,
  margin: 0,
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100%",
  pointerEvents: "auto",
  transition: theme.transitions.create("margin", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: `-${drawerWidth}px`,
  ...(open && {
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: 0,
  }),
}));

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})<{
  open?: boolean;
}>(({ theme, open }) => ({
  backgroundColor: theme.palette.primary.main,
  boxShadow: theme.shadows[2],
  transition: theme.transitions.create(["margin", "width"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(["margin", "width"], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
  justifyContent: "flex-end",
}));

const NavComponent = memo(() => {
  // Minimal test version
  const [open, setOpen] = useState(false);
  const [appHeader, setAppHeader] = useState("Navy PdM");
  const navigate = useNavigate();
  const { isOpen: guideOpen, openGuide, closeGuide } = useUserGuide();

  const handleDrawerOpen = useCallback(() => {
    setOpen(true);
  }, []);

  const handleDrawerClose = useCallback(() => {
    setOpen(false);
  }, []);

  const handleAppHeader = useCallback((header: string) => {
    setAppHeader(header);
  }, []);

  // Handle drawer-specific keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Close drawer with Escape
      if (event.key === "Escape" && open) {
        handleDrawerClose();
        return;
      }

      // Open user guide with Ctrl+? or Cmd+?
      if ((event.ctrlKey || event.metaKey) && event.key === "?") {
        event.preventDefault();
        openGuide();
        return;
      }
    };

    if (typeof window !== "undefined" && window.document) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [open, openGuide]);

  return (
    <Box
      sx={{
        display: "flex",
        width: "100vw",
        height: "100vh",
        margin: 0,
        padding: 0,
      }}
    >
      <CssBaseline />
      <AppBar position="fixed" open={open} role="banner">
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="Open navigation menu"
            aria-expanded={open}
            aria-controls="navigation-drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{
              mr: 2,
              ...(open && { display: "none" }),
            }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="h1" sx={{ flexGrow: 1 }}>
            {appHeader}
          </Typography>

          {/* Notifications, Help and Keyboard Shortcuts */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <NotificationButton />
            <IconButton
              color="inherit"
              onClick={openGuide}
              aria-label="Open user guide"
              size="small"
            >
              <Help />
            </IconButton>
            <IconButton
              color="inherit"
              onClick={() => {
                // Show keyboard shortcuts help
                alert(
                  "Keyboard Shortcuts:\n\nCtrl+1: Work Orders\nCtrl+2: Assets\nCtrl+3: Parts\nCtrl+4: Readiness\nCtrl+N: New Work Order\nCtrl+R: Refresh\nCtrl+H: Home\nCtrl+?: User Guide",
                );
              }}
              aria-label="Show keyboard shortcuts"
              size="small"
            >
              <Keyboard />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      <Drawer
        id="navigation-drawer"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            backgroundColor: "background.paper",
            borderRight: "1px solid",
            borderColor: "divider",
          },
        }}
        variant="persistent"
        anchor="left"
        open={open}
        role="navigation"
        aria-label="Main navigation"
      >
        <DrawerHeader>
          <IconButton
            onClick={handleDrawerClose}
            aria-label="Close navigation menu"
          >
            <ChevronLeftIcon />
          </IconButton>
        </DrawerHeader>
        <Divider />
        <List role="menubar" aria-label="Navigation menu">
          {navItems.map((item) => {
            const handleNavigation = useCallback(() => {
              handleAppHeader(item.title);
              navigate(item.route);
              handleDrawerClose();
            }, [
              item.title,
              item.route,
              handleAppHeader,
              navigate,
              handleDrawerClose,
            ]);

            const handleKeyDown = useCallback(
              (e: React.KeyboardEvent) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleNavigation();
                }
              },
              [handleNavigation],
            );

            return (
              <ListItem key={item.title} disablePadding>
                <ListItemButton
                  onClick={handleNavigation}
                  role="menuitem"
                  tabIndex={0}
                  aria-label={`Navigate to ${item.title}`}
                  onKeyDown={handleKeyDown}
                >
                  <ListItemIcon aria-hidden="true">
                    <Icon>{item.icon}</Icon>
                  </ListItemIcon>
                  <ListItemText primary={item.title} />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Drawer>
      <Main open={open} role="main" id="main-content">
        <DrawerHeader />
        <Box
          sx={{
            width: "100%",
            maxWidth: "100%",
            minHeight: "calc(100vh - 64px)",
            backgroundColor: "background.default",
            padding: 2,
            margin: 0,
            overflow: "auto",
            marginTop: 0,
            pointerEvents: "auto",
          }}
        >
          <Outlet />
        </Box>

        {/* User Guide */}
        <UserGuide open={guideOpen} onClose={closeGuide} />
      </Main>
    </Box>
  );
});

NavComponent.displayName = "NavComponent";

export default NavComponent;
