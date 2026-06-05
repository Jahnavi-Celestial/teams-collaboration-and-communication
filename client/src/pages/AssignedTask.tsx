import { useQuery } from "@apollo/client/react";
import { Box, TextField, Typography, FormControl, Select, MenuItem, Stack, CircularProgress } from "@mui/material";
import { GetAllAssignedTask } from "../graphql/queries";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import TaskCard from "../components/TaskCard";
import type { User } from "../components/CreateTeamModal";

export interface Task{
  id: string,
  subject: string,
  assigned_by: User,
  assigned_to: User,
  status: string
  teamId: string,
  deadline: string,
  created_at: string,
  updated_at: string
}

const AssignedTask = ({fromTeam, teamId}: {fromTeam: string, teamId: string | undefined}) => {
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  const { userId } = useAuth();

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400); 

    return () => {
      clearTimeout(handler);
    };
  }, [search]);
  
  const { data, loading, refetch } = useQuery(GetAllAssignedTask, {
    variables: { 
      userId, 
      teamId: teamId!== undefined ? teamId : null, 
      searchTerm: debouncedSearch || null, 
      status: status || null 
    }
  });

  useEffect(()=>{
    refetch()
  }, [data])

  if (loading) {
    return (
      <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 }}>
        <CircularProgress sx={{ color: "#3d77cf" }} />
        <Typography sx={{ fontSize: "20px", color: "#3d77cf" }}>Loading Tasks...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", p: { xs: 2, sm: 4 }, boxSizing: "border-box" }}>
      {
        fromTeam !== "team" &&
        <Typography variant="h4" sx={{ mb: 3, fontWeight: "bold" }}>
            Assigned Tasks
        </Typography>
      }
      
      <Box sx={{ display: 'flex', flexDirection: { xs: "column", sm: "row" }, gap: 2, mb: 4 }}>
        <TextField
          label="Search Task"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: 1, width: "100%" }}
        />

        <FormControl sx={{ flex: 1, width: "100%" }}>
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            displayEmpty
          >
            <MenuItem value="">All Status</MenuItem>
            <MenuItem value="PENDING">Pending</MenuItem>
            <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
            <MenuItem value="COMPLETED">Completed</MenuItem>
            <MenuItem value="MISSED_DEADLINE">Missed Deadline</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Stack spacing={2}>
        {data?.getAllAssignedTask?.map((task: Task) => (
          <TaskCard task={task} key={task.id} myProp="assigned"/>
        ))}
        {data?.getAllAssignedTask?.length === 0 && (
          <Typography sx={{ color: "#3d77cf", textAlign: "center", mt: 4 }}>
            No tasks found.
          </Typography>
        )}
      </Stack>
    </Box>
  );
};

export default AssignedTask;
