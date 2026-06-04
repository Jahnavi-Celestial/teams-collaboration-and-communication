import { Box, Card, CardActionArea, CardContent, Typography } from "@mui/material";
import AddTaskIcon from "@mui/icons-material/AddTask";
import AssignmentIcon from "@mui/icons-material/Assignment";

interface TaskDashboardProps {
  onOpenCreateModal: () => void;
  onSelectViewTasks: () => void;
}

const TaskDashboard = ({ onOpenCreateModal, onSelectViewTasks}: TaskDashboardProps) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        gap: 3,
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
      }}
    >
      <Card sx={{ width: 280, height: 200, boxShadow: 3, borderRadius: 3 }}>
        <CardActionArea onClick={onOpenCreateModal} sx={{ p: 2, textAlign: "center" }}>
          <AddTaskIcon sx={{ fontSize: 50, color: "#3d77cf", mb: 1 }} />
          <CardContent>
            <Typography variant="h5">
              Create Task
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Assign new items and track milestones.
            </Typography>
          </CardContent>
        </CardActionArea>
      </Card>

      <Card sx={{ width: 280, height: 200, boxShadow: 3, borderRadius: 3 }}>
        <CardActionArea onClick={onSelectViewTasks} sx={{ p: 2, textAlign: "center" }}>
          <AssignmentIcon sx={{ fontSize: 50, color: "#2e7d32", mb: 1 }} />
          <CardContent>
            <Typography variant="h6">
              View Tasks
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Check status of workspace goals.
            </Typography>
          </CardContent>
        </CardActionArea>
      </Card>
    </Box>
  );
};

export default TaskDashboard;
