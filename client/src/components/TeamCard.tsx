import { Card, CardContent, CardActions, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import type { TeamInterface } from "./TeamSidebar";

const TeamCard = ({ team }: {team: TeamInterface}) => {
    const navigate = useNavigate()

  return (
    <Card variant="outlined" sx={{width: "auto", height: "200px"}}>
      <CardContent>
        <Typography gutterBottom sx={{ fontSize: 20 }}>
          {team?.name}
        </Typography>
        
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
