import { useQuery } from "@apollo/client/react";
import { GetTeams } from "../graphql/queries";
import TeamSidebar from "../components/TeamSidebar";
import { useParams } from "react-router-dom";
import { useTheme, useMediaQuery, Box } from "@mui/material";
import ChatHeader from "../components/ChatHeader";
import { useState } from "react";

const ChatRoom = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const [activeTab, setActiveTab] = useState(0);
  const [typingUser, setTypingUser] = useState<string | null>(null);

  const { data: teamsData } = useQuery(GetTeams);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Box sx={{ display: "flex", width: "100%", height: "calc(100vh - 64px)" }}>
      {!isMobile && <TeamSidebar teams={teamsData?.getTeams} teamId={teamId} />}
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          bgcolor: "#efeae2",
        }}
      >
        <ChatHeader
          teamName={
            teamsData?.getTeams?.find((t: any) => t.id === teamId)?.name
          }
          typingUser={typingUser}
          isMobile={isMobile}
          teams={teamsData?.getTeams}
          teamId={teamId}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </Box>
    </Box>
  );
};

export default ChatRoom;
