import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Tabs,
  Tab,
  Badge,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useChat } from "../context/ChatContext";

interface ChatHeaderProps {
  teamName?: string;
  typingUser: string | null;
  isMobile: boolean;
  teams: any[];
  teamId?: string;
  activeTab: number;
  setActiveTab: (val: number) => void;
}

const ChatHeader = ({
  teamName,
  typingUser,
  isMobile,
  teams,
  teamId,
  activeTab,
  setActiveTab,
}: ChatHeaderProps) => {
  const [mobileMenu, setMobileMenu] = useState<null | HTMLElement>(null);

  const { unreadCounts } = useChat();

  return (
    <Box
      sx={{
        bgcolor: "#ffffff",
        borderBottom: "1px solid #e0e0e0",
        boxShadow: "0px 2px 4px rgba(0,0,0,0.05)",
      }}
    >
      <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 1 }}>
        {isMobile && (
          <>
            <IconButton onClick={(e) => setMobileMenu(e.currentTarget)}>
              <MenuIcon sx={{ color: "#3d77cf" }} />
            </IconButton>
            <Menu
              anchorEl={mobileMenu}
              open={Boolean(mobileMenu)}
              onClose={() => setMobileMenu(null)}
            >
              {teams?.map((team) => {
                const count = unreadCounts[team.id] || 0;
                return (
                  <Box key={team.id} sx={{display: "flex", alignItems: "center", }}>
                    <MenuItem
                      component={Link}
                      to={`/team/${team.id}`}
                      onClick={() => setMobileMenu(null)}
                      selected={team.id === teamId}
                    >
                      {team.name}
                    </MenuItem>
                    <Badge badgeContent={count} color="error" sx={{ mr: 2 }} />
                  </Box>
                );
              })}
            </Menu>
          </>
        )}

        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
            {teamName || "Select a team"}
          </Typography>
          {typingUser && (
            <Typography
              variant="caption"
              sx={{ color: "#3d77cf", fontWeight: "bold", fontStyle: "italic" }}
            >
              {typingUser}
            </Typography>
          )}
        </Box>
      </Box>

      {teamId && (
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          textColor="primary"
          indicatorColor="primary"
          variant="fullWidth"
          sx={{
            minHeight: "40px",
            "& .MuiTab-root": { minHeight: "40px", py: 1, fontWeight: "bold" },
          }}
        >
          <Tab label="Chat" />
          <Tab label="Tasks" />
          <Tab label="Members" />
        </Tabs>
      )}
    </Box>
  );
};

export default ChatHeader;
