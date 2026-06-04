import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from "@mui/material";

interface DeleteTeamConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export const DeleteTeamConfirmDialog = ({ open, onClose, onSubmit }: DeleteTeamConfirmDialogProps) => {

  return(
  <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
    <DialogTitle sx={{ fontWeight: "bold" }}>
      Delete Team
    </DialogTitle>
    <DialogContent sx={{ pt: 1 }}>
      <Typography variant="body1">
        Are you sure you want to delete this team.
      </Typography>
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 2 }}>
      <Button onClick={onClose} variant="outlined" color="inherit">
        Cancel
      </Button>
      <Button onClick={onSubmit} variant="contained" color="error">
        Delete Team
      </Button>
    </DialogActions>
  </Dialog>
)}