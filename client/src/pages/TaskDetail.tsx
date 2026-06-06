import { useState, useEffect } from "react";
import { useApolloClient, useMutation, useQuery } from "@apollo/client/react";
import {
  Container,
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { GetTaskDetail } from "../graphql/queries";
import { DELETE_TASK } from "../graphql/mutations";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";

const TaskDetail = () => {
  const client = useApolloClient();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const { socket } = useChat();

  const [isRequestModalOpen, setIsRequestModalOpen] = useState<boolean>(false);
  const [justificationMsg, setJustificationMsg] = useState<string>("");

  const [isDeadlineModalOpen, setIsDeadlineModalOpen] = useState<boolean>(false);
  const [newDeadlineInput, setNewDeadlineInput] = useState<string>("");

  const { data, loading, error, refetch } = useQuery(GetTaskDetail, {
    variables: { taskId: id },
    skip: !id,
    fetchPolicy: "network-only",
  });

  useEffect(()=>{
    refetch()
  },[data])

  useEffect(() => {
    if (!id) return;

    socket.on("extension_submitted_success", (payload: { taskId: string }) => {
      if (payload.taskId === id) {
        setIsRequestModalOpen(false);
        setJustificationMsg("");
        refetch();
      }
    });

    socket.on("task_status_live_changed_success", (payload: { taskId: string }) => {
        if (payload.taskId === id) {
          refetch();
        }
      },
    );

    socket.on("task_status_live_changed", (payload: { taskId: string }) => {
      if (payload.taskId === id) {
        refetch();
      }
    });

    socket.on("task_deadline_updated_broadcast", (payload: { taskId: string }) => {
        if (payload.taskId === id) {
          refetch();
        }
      },
    );

    return () => {
      socket.off("extension_submitted_success");
      socket.off("task_status_live_changed_success");
      socket.off("task_status_live_changed");
      socket.off("task_deadline_updated_broadcast");
    };
  }, [socket, id, navigate]);

  const taskdata = data?.getTaskDetail;

  const formattedDate = (isoString?: string) => {
    if (!isoString) return "N/A";
    try {
      return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(new Date(isoString));
    } catch {
      return "N/A";
    }
  };

  const [deleteAction] = useMutation(DELETE_TASK, {
    onCompleted: async()=>{
      await client.refetchQueries({
      include: "active", 
    });
    }
  });

  const handleDeleteTask = () => {
    deleteAction({ variables: { taskId: id } });
    navigate("/");
  };

  const handleSendExtensionRequest = () => {
    if (!id || !justificationMsg.trim()) return;
    socket.emit("submit_deadline_extension", {
      taskId: id,
      message: justificationMsg,
    });
  };

  const handleStatusLiveSwitch = (
    targetStatus: "IN_PROGRESS" | "COMPLETED",
  ) => {
    if (!id) return;
    socket.emit("live_update_task_status", {
      taskId: id,
      status: targetStatus,
    });
    setTimeout(() => refetch(), 300);
  };

  const getTodayString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const isSelectedDateInvalid = () => {
    if (!newDeadlineInput) return true;
    return newDeadlineInput < getTodayString();
  };

  const handleSubmitNewDeadline = () => {
    if (!id || !newDeadlineInput) return;

    const isoDeadlineStr = new Date(newDeadlineInput).toISOString();

    socket.emit("update_task_deadline_live", {
      taskId: id,
      newDeadline: isoDeadlineStr,
    });
    setIsDeadlineModalOpen(false);

    setTimeout(() => {
      refetch();
    }, 400);
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#3d77cf",
        }}
      >
        <Typography variant="h5">Loading...</Typography>
      </Box>
    );
  }

  if (error || !taskdata) {
    setTimeout(() => {
      navigate("/", { replace: true });
    }, 1500);

    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography color="error" variant="h6">
          This task has been deleted by the creator/admin or error. Redirecting to dashboard...
        </Typography>
      </Box>
    );
  }

  const isAssignedToMe = String(taskdata.assigned_to?.id) === String(userId);
  const iCreatedThisTask = String(taskdata.assigned_by?.id) === String(userId);
  const isMissed = taskdata.status === "MISSED_DEADLINE";

  return (
    <Container
      maxWidth="lg"
      sx={{
        minHeight: "90vh",
        py: { xs: 3, md: 5 },
        px: { xs: 2, sm: 3 },
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <Box
        sx={{
          width: "100%",
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          p: 3,
          borderRadius: 3,
          bgcolor: "#fcfcfc",
          justifyContent: "space-between",
          alignItems: { xs: "stretch", sm: "center" },
          gap: 3,
          boxShadow: "0px 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontWeight: "bold",
            fontSize: { xs: "1.75rem", sm: "2.125rem" },
            wordBreak: "break-word",
          }}
        >
          {taskdata.subject?.toUpperCase()}
        </Typography>
        <Box
          sx={{
            minWidth: "150px",
            borderRadius: 2,
            bgcolor: isMissed ? "#fce8e6" : "#4f90f3b1",
            color: isMissed ? "#c62828" : "inherit",
            p: 2,
            textAlign: "center",
            boxShadow: 1,
            alignSelf: { xs: "flex-start", sm: "auto" },
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
            Status
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: "bold" }}>
            {taskdata.status}
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          width: "100%",
          maxWidth: "800px",
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
        }}
      >
        <Typography variant="h6" sx={{ mb: 1, wordBreak: "break-word" }}>
          Description: {taskdata.description || "No description provided."}
        </Typography>
        <Typography variant="body1">
          <strong>Task from team:</strong> {taskdata.team?.name?.toUpperCase()}
        </Typography>
        <Typography variant="body1">
          <strong>Assigned By:</strong> {taskdata.assigned_by?.name}
        </Typography>
        <Typography variant="body1">
          <strong>Assigned To:</strong> {taskdata.assigned_to?.name}
        </Typography>
        <Typography variant="body1">
          <strong>Assigned On:</strong> {formattedDate(taskdata.created_at)}
        </Typography>
        <Typography variant="body1">
          <strong>Deadline:</strong>{" "}
          {taskdata.deadline
            ? new Date(taskdata.deadline).toLocaleDateString()
            : "N/A"}
        </Typography>
      </Box>

      <Box
        sx={{
          mt: "auto",
          pt: 2,
          display: "flex",
          gap: 2,
          flexWrap: "wrap",
          flexDirection: { xs: "column", sm: "row" },
        }}
      >
        {
            iCreatedThisTask && 
            <Button
                variant="contained"
                color="error"
                size="large"
                sx={{ px: 4, py: 1.5 }}
                onClick={handleDeleteTask}
            >
                Delete Task
            </Button>
        }

        {isAssignedToMe && !isMissed && taskdata.status !== "COMPLETED" && (
          <>
            <Button
              variant="contained"
              color="primary"
              size="large"
              sx={{ px: 4, py: 1.5 }}
              onClick={() => handleStatusLiveSwitch("IN_PROGRESS")}
            >
              Mark In-Progress
            </Button>
            <Button
              variant="contained"
              color="success"
              size="large"
              sx={{ px: 4, py: 1.5 }}
              onClick={() => handleStatusLiveSwitch("COMPLETED")}
            >
              Mark Completed
            </Button>
          </>
        )}

        {isMissed && iCreatedThisTask && (
          <Button
            variant="contained"
            size="large"
            sx={{ px: 4, py: 1.5, bgcolor: "#3d77cf" }}
            onClick={() => setIsDeadlineModalOpen(true)}
          >
            Change Deadline
          </Button>
        )}

        {isMissed && isAssignedToMe && !iCreatedThisTask && (
          <Button
            variant="contained"
            color="warning"
            size="large"
            sx={{ px: 4, py: 1.5 }}
            onClick={() => setIsRequestModalOpen(true)}
          >
            Request Deadline Increase
          </Button>
        )}
      </Box>

      <Dialog
        open={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Request Deadline Extension</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            State the reason why you need an extension.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            placeholder="Type justification here..."
            value={justificationMsg}
            onChange={(e) => setJustificationMsg(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsRequestModalOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSendExtensionRequest}
            variant="contained"
            color="primary"
            disabled={!justificationMsg.trim()}
          >
            Submit Request
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isDeadlineModalOpen}
        onClose={() => setIsDeadlineModalOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Modify Task Deadline</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            type="date"
            variant="outlined"
            value={newDeadlineInput}
            onChange={(e) => setNewDeadlineInput(e.target.value)}
            slotProps={{
                inputLabel: {
                    shrink: true
                },
                htmlInput: {
                    min: getTodayString()
                }
            }}
            error={isSelectedDateInvalid() && !!newDeadlineInput}
            helperText={
              isSelectedDateInvalid() && !!newDeadlineInput
                ? "Cannot select a past date"
                : ""
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeadlineModalOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSubmitNewDeadline}
            variant="contained"
            color="primary"
            disabled={isSelectedDateInvalid()}
          >
            Update Deadline
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TaskDetail;