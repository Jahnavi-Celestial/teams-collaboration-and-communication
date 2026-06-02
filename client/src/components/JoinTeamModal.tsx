import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Autocomplete,
  CircularProgress,
} from "@mui/material";
import { useMutation, useQuery } from "@apollo/client/react";
import { GetAllPublicTeams } from "../graphql/queries";
import { JoinTeams } from "../graphql/mutations";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface Team {
  id: string;
  name: string;
}

const JoinTeamModal = ({ open, onClose }: Props) => {
  const [selectedTeams, setSelectedTeams] = useState<Team[]>([]);
  
  const [inputValue, setInputValue] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const { data, loading } = useQuery(GetAllPublicTeams, {
    variables: { searchTerm },
    skip: !open, 
  });

  const [joinTeams] = useMutation(JoinTeams, {
    update(cache) {
        cache.evict({ fieldName: "getTeams" });
        cache.gc();
    },
    onCompleted: () => {
      onClose();
      setSelectedTeams([]);
      setInputValue("");
      alert("Successfully Joined Selected Teams!");
    },
    onError: (error) => {
      onClose();
      alert(error.message);
    },
  });

  const handleJoin = ():void => {
    if (selectedTeams.length === 0) return;
    joinTeams({ variables: { teamIds: selectedTeams.map((t) => t.id) } });
  };

  const options = data?.getAllPublicTeams || [];

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setSearchTerm(inputValue);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [inputValue]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Join Multiple Teams</DialogTitle>
      <DialogContent>
        <Autocomplete
          multiple
          options={options}
          loading={loading}
          getOptionLabel={(option) => option.name}
          slotProps={{
            option: {
              key: (option: Team) => option.id,
            }
          }}
          value={selectedTeams}
          onChange={(_, newValue) => {
            setSelectedTeams(newValue);
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
              label="Search & Select Teams"
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
          onClick={handleJoin}
          variant="contained"
          disabled={selectedTeams.length === 0}
        >
          Join Teams
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default JoinTeamModal;
