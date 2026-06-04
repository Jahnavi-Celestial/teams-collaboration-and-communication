import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, FormControl, InputLabel, Select, MenuItem } from "@mui/material";

interface RoleModalDialogProps {
  open: boolean;
  onClose: () => void;
  memberName: string | undefined;
  selectedRole: string;
  setSelectedRole: (role: string) => void;
  onSubmit: () => void;
}

export const RoleModalDialog = ({ open, onClose, memberName, selectedRole, setSelectedRole, onSubmit}: RoleModalDialogProps) => {
    
  return (
  <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
    <DialogTitle>Update Member Role</DialogTitle>
    <DialogContent sx={{ pt: 2 }}>
      <Typography variant="body2" sx={{ mb: 2 }}>
        Changing role for <b>{memberName}</b>
      </Typography>
      <FormControl fullWidth>
        <InputLabel id="role-select-label">Select Role</InputLabel>
        <Select
          labelId="role-select-label"
          id="role-select"
          value={selectedRole}
          label="Select Role"
          onChange={(e) => setSelectedRole(e.target.value)}
        >
          <MenuItem value="ADMIN">ADMIN</MenuItem>
          <MenuItem value="MEMBER">MEMBER</MenuItem>
        </Select>
      </FormControl>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
      <Button onClick={onSubmit} variant="contained" color="primary">
        Save Changes
      </Button>
    </DialogActions>
  </Dialog>
)}