import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Avatar,
  Typography,
  Grid,
  Button,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import BadgeIcon from "@mui/icons-material/Badge";

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Member {
  id: string;
  role: string;
  user: User;
}

interface UserProfileModalProps {
  open: boolean;
  onClose: () => void;
  member: Member | null;
}

const UserProfileModal = ({ open, onClose, member }: UserProfileModalProps) => {
  if (!member) return null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" sx={{ zIndex: 11000 }}>
      <DialogTitle sx={{ fontWeight: "bold", textAlign: "center", pt: 3 }}>
        User Profile Info
      </DialogTitle>
      <DialogContent dividers sx={{ pb: 3 }}>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 3 }}>
          <Avatar
            sx={{ width: 70, height: 70, bgcolor: "#3d77cf", fontSize: "1.8rem", mb: 1.5 }}
          >
            {member.user.name?.[0]?.toUpperCase()}
          </Avatar>
          <Typography variant="h6" >
            {member.user.name}
          </Typography>
        </Box>

        <Grid container spacing={2.5} sx={{ px: 1 }}>
          <Grid item xs={12} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <PersonIcon sx={{ color: "gray" }} />
            <Box>
              <Typography variant="caption" color="textSecondary">
                User ID
              </Typography>
              <Typography variant="body2">
                {member.user.id}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <EmailIcon sx={{ color: "gray" }} />
            <Box>
              <Typography variant="caption" color="textSecondary">
                Email Address
              </Typography>
              <Typography variant="body2">
                {member.user.email}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <BadgeIcon sx={{ color: "gray" }} />
            <Box>
              <Typography variant="caption" color="textSecondary">
                Workspace Role
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: member.role === "ADMIN" ? "primary.main" : "text.primary" }}
              >
                {member.role}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2, justifyContent: "center" }}>
        <Button onClick={onClose} variant="contained" sx={{ px: 4, borderRadius: "20px" }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserProfileModal;
