import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Autocomplete,
  CircularProgress,
  Switch,
  FormControlLabel,
  TextareaAutosize,
} from "@mui/material";
import { useMutation, useQuery } from "@apollo/client/react";
import { GetAllUsers } from "../graphql/queries";
import { createTeamWithMembers } from "../graphql/mutations";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface User {
  name: string;
  id: string;
}

const CreateTeamModal = ({ open, onClose }: Props) => {
  const [teamName, setTeamName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [isPublic, setIsPublic] = useState<boolean>(true);

  const [inputValue, setInputValue] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const { data, loading } = useQuery(GetAllUsers, {
    variables: { searchTerm },
    skip: !open,
  });

  const [createTeam] = useMutation(createTeamWithMembers, {
    update(cache) {
        cache.evict({ fieldName: "getTeams" });
        cache.gc();
    },
    onCompleted: () => {
      onClose();
      setTeamName("");
      setDescription("");
      setSelectedUsers([]);
      setInputValue("");
      setSearchTerm("");
      alert("Team Created Successfully");
    },
  });

  const handleCreate = (): void => {
    if (!teamName || selectedUsers.length === 0) return;
    createTeam({
      variables: {
        name: teamName,
        description: description,
        memberIds: selectedUsers.map((user) => user.id),
        isPublic: isPublic,
      },
    });
  };

  const options = data?.getAllUsers || [];

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setSearchTerm(inputValue);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [inputValue]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Create Team</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          label="Team Name"
          margin="dense"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
        />
        <TextareaAutosize
          maxRows={4}
          placeholder="Team description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ width: "100%", padding: "20px 10px", fontSize: "large" }}
        />
        <FormControlLabel
          control={
            <Switch
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
          }
          label="Public Team"
        />

        <Autocomplete
          multiple
          options={options}
          loading={loading}
          getOptionLabel={(option) => option.name}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          slotProps={{
            option: {
              key: (option: User) => option.id,
            },
          }}
          value={selectedUsers}
          onChange={(_, newValue) => {
            setSelectedUsers(newValue);
          }}
          inputValue={inputValue}
          onInputChange={(_, newInputValue) => {
            setInputValue(newInputValue);
          }}
          renderOption={(props, option) => {
            const { key, ...optionProps } = props;
            return (
              <li key={option.id} {...optionProps}>
                {option.name}
              </li>
            );
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Search User"
              InputProps={{
                ...params?.InputProps,
                endAdornment: (
                  <>
                    {loading ? (
                      <CircularProgress color="inherit" size={20} />
                    ) : null}
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
        <Button
          onClick={handleCreate}
          variant="contained"
          disabled={!teamName || selectedUsers.length === 0}
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateTeamModal;
