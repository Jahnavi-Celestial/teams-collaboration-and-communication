import { Box, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

interface TaskCardProps {
  task: {
    id: string;
    subject: string;
    created_at: string;
    assigned_by: {
      name: string;
    };
    assigned_to: {
      name: string;
    };
  };
  myProp: string
}

const TaskCard = ({ task, myProp }: TaskCardProps) => {
  const navigate = useNavigate();

  const formattedDate = task?.created_at 
    ? new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(new Date(task.created_at))
    : "N/A";

  return (
    <Box 
      onClick={() => navigate(`/taskDetail/${task.id}`)}
      sx={{
        bgcolor: "#9fbce779", 
        p: 2,
        borderRadius: 2,
        boxShadow: 1,
        cursor: "pointer",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: 3,
        }
      }}
    >
      <Box sx={{ 
        display: "flex", 
        flexDirection: { xs: "column", sm: "row" }, 
        justifyContent: "space-between",
        alignItems: { xs: "flex-start", sm: "center" },
        gap: 1 
      }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: "600" }}>
            Subject: {task.subject}
          </Typography>
          {
            myProp === "assigned" ? (
                <Typography variant="body2" color="text.secondary">
                    Assigned By: {task.assigned_by?.name || "Unknown"}
                </Typography>
            ) : (
                <Typography variant="body2" color="text.secondary">
                    Assigned To: {task.assigned_to?.name || "Unknown"}
                </Typography>
            )
          }
        </Box>
        <Typography variant="caption" sx={{ color: "text.secondary", alignSelf: { xs: "flex-end", sm: "center" } }}>
          Assigned On: {formattedDate}
        </Typography>
      </Box>
    </Box>
  );
};

export default TaskCard;
