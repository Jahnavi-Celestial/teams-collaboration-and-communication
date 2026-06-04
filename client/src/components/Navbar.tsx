import { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Avatar,
  Drawer,
  List,
  ListItem,
  useMediaQuery,
  useTheme,
  Menu,
  MenuItem,
  Dialog,
  DialogActions,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useNavigate } from "react-router-dom";
import CreateTeamModal from "./CreateTeamModal";
import JoinTeamModal from "./JoinTeamModal";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [isJoinOpen, setIsJoinOpen] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const[openDialog, setOpenDialog] = useState<boolean>(false)
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [showLogout, setShowLogout] = useState<boolean>(false);
  const navigate = useNavigate();
  const { logoutUser } = useAuth();

  const userInitial = JSON.parse(
    localStorage.getItem("user") || "null",
  )?.email[0]?.toUpperCase();

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>): void => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = (): void => {
    setAnchorEl(null);
  };

  return (
    <>
      <AppBar
        position="sticky"
        sx={{
          bgcolor: "white",
          boxShadow: 1,
          backgroundColor: "#3d77cf",
          color: "#fff",
          zIndex: "10000",
        }}
      >
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: "bold" }}
            onClick={() => navigate("/")}
          >
            TeamChat
          </Typography>

          {isMobile ? (
            <IconButton onClick={() => setMobileOpen(!mobileOpen)}>
              <MenuIcon />
            </IconButton>
          ) : (
            <>
              <Box sx={{ display: "flex", gap: 3 }}>
                <Button
                  sx={{ color: "white" }}
                  onClick={() => setIsCreateOpen(true)}
                >
                  Create Team
                </Button>
                <Button
                  sx={{ color: "white" }}
                  onClick={() => setIsJoinOpen(true)}
                >
                  Join Team
                </Button>
                <Button sx={{ color: "white" }} onMouseEnter={handleOpenMenu}>
                  Tasks
                </Button>
              </Box>
              <Avatar
                sx={{ bgcolor: "white", color: "#3d77cf", cursor: "pointer" }}
                onClick={() => {
                  setShowLogout(!showLogout);
                }}
              >
                {userInitial}
              </Avatar>
            </>
          )}
        </Toolbar>
      </AppBar>
      {showLogout && (
        <Box sx={{ position: "absolute", right: 0, zIndex: 1000 }}>
          <Button
            onClick={() => logoutUser()}
            sx={{ bgcolor: "white", color: "#3d77cf" }}
          >
            Logout
          </Button>
        </Box>
      )}

      <Drawer
        anchor="top"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        slotProps={{ paper: { sx: { top: "50px" } } }}
      >
        <List sx={{ width: "100%", pt: 2, pb: 2 }}>
          <ListItem sx={{ justifyContent: "center" }}>
            <Button
              onClick={() => {
                setIsCreateOpen(true);
                setMobileOpen(false);
              }}
              sx={{ width: "100%", border: "1px solid" }}
            >
              Create Team
            </Button>
          </ListItem>
          <ListItem sx={{ justifyContent: "center" }}>
            <Button
              onClick={() => {
                setIsJoinOpen(true);
                setMobileOpen(false);
              }}
              sx={{ width: "100%", border: "1px solid" }}
            >
              Join Team
            </Button>
          </ListItem>
          <ListItem sx={{ justifyContent: "center" }}>
            <Button
              onClick={() => {
                setOpenDialog(!openDialog)
                setMobileOpen(false);
              }}
              sx={{ width: "100%", border: "1px solid" }}
            >
              Tasks
            </Button>
          </ListItem>
          <ListItem sx={{ justifyContent: "center" }}>
            <Button
              onClick={() => {
                logoutUser();
                setMobileOpen(false);
              }}
              sx={{ bgcolor: "#3d77cf", color: "white", width: "100%" }}
            >
              Logout
            </Button>
          </ListItem>
        </List>
      </Drawer>

      <CreateTeamModal open={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      <JoinTeamModal open={isJoinOpen} onClose={() => setIsJoinOpen(false)} />

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        slotProps={{ list: { onMouseLeave: handleCloseMenu } }}
        sx={{zIndex: 10000}}
      >
        <MenuItem
          onClick={() => {
            navigate("/assignedTask");
            handleCloseMenu();
          }}
        >
          Assigned Task
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate("/createdTask");
            handleCloseMenu();
          }}
        >
          Created Task
        </MenuItem>
      </Menu>

      <Dialog open={openDialog} onClose={()=>setOpenDialog(false)} fullWidth maxWidth="xs">
        <DialogActions sx={{display: "flex", flexDirection: "column"}}>
          <Button
            onClick={() => {
              navigate("/assignedTask");
              setOpenDialog(false);
            }}
          >
            Assigned Task
          </Button>
          <Button
            onClick={() => {
              navigate("/createdTask");
              setOpenDialog(false);
            }}
          >
            Creatd Task
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Navbar;
