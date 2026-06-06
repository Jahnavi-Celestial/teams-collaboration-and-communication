import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Autocomplete, TextField, CircularProgress } from "@mui/material";
import type { User } from "./UserProfileModal";

interface AddMemberDialogProps {
  open: boolean;
  onClose: () => void;
  availableUsers: User[];
  selectedNewUsers: User[];
  setSelectedNewUsers: (users: User[]) => void;
  inputValue: string;
  setInputValue: (val: string) => void;
  loadingUsers: boolean;
  onSubmit: () => void;
}

export const AddMemberDialog = ({ open, onClose, availableUsers, selectedNewUsers, setSelectedNewUsers, inputValue, setInputValue, loadingUsers, onSubmit}: AddMemberDialogProps) => {
    return (

  <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
    <DialogTitle>Add New Members</DialogTitle>
    <DialogContent sx={{ pt: 2 }}>
      <Autocomplete
        multiple
        id="tags-outlined"
        options={availableUsers}
        getOptionLabel={(option) => `${option.name}`}
        filterSelectedOptions
        value={selectedNewUsers}
        onChange={(_, newValue) => setSelectedNewUsers(newValue)}
        inputValue={inputValue}
        onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
        loading={loadingUsers}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Search users"
            placeholder="Select Users"
            fullWidth
            InputProps={{
              ...params?.InputProps,
              endAdornment: (
                <>
                  {loadingUsers ? <CircularProgress color="inherit" size={20} /> : null}
                  {params?.InputProps?.endAdornment}
                </>
              ),
            }}
          />
        )}
      />
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
      <Button onClick={onSubmit} variant="contained" disabled={selectedNewUsers.length === 0}>
        Add Selected
      </Button>
    </DialogActions>
  </Dialog>
  )   
}