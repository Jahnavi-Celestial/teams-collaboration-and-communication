import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from "@mui/material";

interface RemoveConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  isExitingSelf: boolean;
  memberName: string | undefined;
  onSubmit: () => void;
}

export const RemoveConfirmDialog = ({ open, onClose, isExitingSelf, memberName, onSubmit }: RemoveConfirmDialogProps) => {

  return(
  <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
    <DialogTitle sx={{ fontWeight: "bold" }}>
      {isExitingSelf ? "Exit Team" : "Remove Member"}
    </DialogTitle>
    <DialogContent sx={{ pt: 1 }}>
      <Typography variant="body1">
        {isExitingSelf
          ? "Are you sure you want to leave this team? You will lose access to all team data."
          : `Are you sure you want to remove ${memberName} from the team?`}
      </Typography>
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 2 }}>
      <Button onClick={onClose} variant="outlined" color="inherit">
        Cancel
      </Button>
      <Button onClick={onSubmit} variant="contained" color="error">
        {isExitingSelf ? "Leave Team" : "Remove"}
      </Button>
    </DialogActions>
  </Dialog>
)}