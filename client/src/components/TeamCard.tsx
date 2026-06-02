import { Card, CardContent, CardActions, Typography, Button } from "@mui/material";

const TeamCard = ({ team }) => {
  return (
    <Card variant="outlined" sx={{width: "auto"}}>
      <CardContent>
        <Typography gutterBottom sx={{ fontSize: 20 }}>
          {team?.name}
        </Typography>
        
        <Typography sx={{ mb: 1.5 }}>
          Description: {team?.description || "No description provided"}
        </Typography>

        <Typography variant="p" component="div">
          Created-By: {team?.created_by?.name || "Unknown"}
        </Typography>
      </CardContent>
      <CardActions>
        <Button size="small">Visit Team</Button>
      </CardActions>
    </Card>
  );
};

export default TeamCard;
