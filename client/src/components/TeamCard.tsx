import { Card, CardContent, CardActions, Typography, Button, Badge, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import type { TeamInterface } from "./TeamSidebar";
import { useChat } from "../context/ChatContext";

const TeamCard = ({ team }: {team: TeamInterface}) => {
    const navigate = useNavigate()
    const { unreadCounts } = useChat();
    const count = unreadCounts[team.id] || 0;

  return (
    <Card variant="outlined" sx={{width: "auto", height: "200px"}}>
      <CardContent>
        <Box sx={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
        <Typography gutterBottom sx={{ fontSize: 20 }}>
            {team?.name}
        </Typography>
        <Badge badgeContent={count} color="error" sx={{ mr: 2 }} />
        </Box>
        
        <Typography sx={{ mb: 1.5 }}>
          Description: {team?.description || "No description provided"}
        </Typography>

        <Typography variant="body1" component="div">
          Created-By: {team?.created_by?.name || "Unknown"}
        </Typography>
      </CardContent>
      <CardActions>
        <Button size="small" onClick={()=>navigate(`/team/${team.id}`)}>Visit Team</Button>
      </CardActions>
      
    </Card>
  );
};

export default TeamCard;
