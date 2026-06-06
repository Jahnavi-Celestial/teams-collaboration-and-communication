import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
  Button,
  CircularProgress,
} from "@mui/material";

export interface TeamMemberNode {
  id: string;
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
    created_at: string;
    updated_at: string;
  };
}

interface CreateTaskModalProps {
  open: boolean;
  onClose: () => void;
  teamMembers: TeamMemberNode[];
  membersLoading: boolean;
  onSubmit: (data: {
    subject: string;
    description: string;
    assignedToUserId: string;
    deadline: string;
  }) => Promise<void>;
  creatingTask: boolean;
  setSearchTerm: (a: string) => void;
}

const CreateTaskModal = ({
  open,
  onClose,
  teamMembers,
  membersLoading,
  onSubmit,
  creatingTask,
  setSearchTerm,
}: CreateTaskModalProps) => {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [assignedMember, setAssignedMember] = useState<TeamMemberNode | null>(null);

  const [inputValue, setInputValue] = useState<string>("");
  const [dateError, setDateError] = useState<string | null>(null);

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const todayStr = `${yyyy}-${mm}-${dd}`;

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setSearchTerm(inputValue);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [inputValue, setSearchTerm]);

  const handleClearAndClose = () => {
    setSubject("");
    setDescription("");
    setDeadline("");
    setAssignedMember(null);
    setInputValue("");
    setSearchTerm("");
    setDateError(null);
    onClose();
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosenDate = e.target.value;
    setDeadline(chosenDate);

    if (chosenDate && chosenDate < todayStr) {
      setDateError("Past dates are not allowed");
    } else {
      setDateError(null);
    }
  };

  const handleFormSubmit = async () => {
    if (!subject.trim() || !assignedMember || !deadline || dateError) return;
    
    const deadlineIso = new Date(deadline).toISOString();
    await onSubmit({
      subject,
      description,
      assignedToUserId: assignedMember.user.id,
      deadline: deadlineIso,
    });
    handleClearAndClose();
  };

  return (
    <Dialog open={open} onClose={handleClearAndClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: "bold" }}>Create Task</DialogTitle>
      <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}>
        
        <TextField
          label="Subject"
          variant="outlined"
          fullWidth
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />

        <TextField
          label="Enter Description"
          variant="outlined"
          fullWidth
          multiline
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <Autocomplete
          options={teamMembers}
          loading={membersLoading}
          getOptionLabel={(option: TeamMemberNode) => `${option.user.name}`}
          isOptionEqualToValue={(option, value) => option.user.id === value.user.id}
          slotProps={{
            option: {
              key: (option: TeamMemberNode) => option.user.id,
            },
          }}
          value={assignedMember}
          onChange={(_event, newValue: TeamMemberNode | null) => {
            setAssignedMember(newValue);
          }}
          inputValue={inputValue}
          onInputChange={(_event, newInputValue) => {
            setInputValue(newInputValue);
          }}
          renderOption={(props, option) => {
            const { key, ...optionProps } = props;
            return (
              <li key={option.user.id} {...optionProps}>
                {option.user.name}
              </li>
            );
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Assigned To"
              variant="outlined"
              required
              InputProps={{
                ...params?.InputProps,
                endAdornment: (
                  <>
                    {membersLoading ? <CircularProgress color="inherit" size={20} /> : null}
                    {params?.InputProps?.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />

        <TextField
          label="Deadline"
          type="date"
          variant="outlined"
          fullWidth
          required
          error={!!dateError}
          helperText={dateError}
          value={deadline}
          onChange={handleDateChange}
          InputLabelProps={{ 
            shrink: true 
          }}
          inputProps={{ 
            min: todayStr 
          }}
          sx={{
            "& input::-webkit-calendar-picker-indicator": {
              cursor: "pointer"
            }
          }}
        />
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClearAndClose} color="secondary" disabled={creatingTask}>
          Cancel
        </Button>
        <Button
          onClick={handleFormSubmit}
          variant="contained"
          color="primary"
          disabled={creatingTask || !subject.trim() || !assignedMember || !deadline || !!dateError}
        >
          {creatingTask ? "Creating..." : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateTaskModal;