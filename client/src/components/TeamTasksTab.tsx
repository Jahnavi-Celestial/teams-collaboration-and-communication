import React, { useState } from "react";
import { Box, Typography, Button, Card, CardActionArea, CardContent } from "@mui/material";
import { useMutation, useQuery } from "@apollo/client/react";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import TaskDashboard from "./TaskDashboard";
import CreateTaskModal, { type TeamMemberNode } from "./CreateTaskModal";
import { GetMembersOfTeam } from "../graphql/queries";
import { CREATE_TASK } from "../graphql/mutations";
import AssignedTask from "../pages/AssignedTask";
import CreatedTask from "../pages/CreatedTask";
import { useAuth } from "../context/AuthContext";

interface TeamTasksTabProps {
  teamId: string | undefined;
}

type TaskViewMode = "selection" | "view";
type TaskSubViewMode = "none" | "assigned" | "created";

const TeamTasksTab: React.FC<TeamTasksTabProps> = ({ teamId }) => {
  const {userId} = useAuth()
  const [viewMode, setViewMode] = useState<TaskViewMode>("selection");
  const [subView, setSubView] = useState<TaskSubViewMode>("none");
  const [openModal, setOpenModal] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState<string>("");

  const { data: membersData, loading: membersLoading } = useQuery(GetMembersOfTeam, {
    variables: { teamId: teamId || "", searchTerm },
    skip: !teamId || !openModal,
  });

  const [createTask, { loading: creatingTask }] = useMutation(CREATE_TASK);

  const teamMembersList: TeamMemberNode[] = membersData?.getMembersOfTeam.filter(m=> (m.user.id !== userId)) || [];

  const handleCreateTaskSubmit = async (formData: {
    subject: string;
    description: string;
    assignedToUserId: string;
    deadline: string;
  }) => {
    if (!teamId) return;
    try {
      await createTask({
        variables: {
          teamId,
          ...formData,
        },
      });
      setViewMode("view");
    } catch (err) {
      console.error("Task creation error:", err);
    }
  };

  const handleBackToDashboard = () => {
    setViewMode("selection");
    setSubView("none"); 
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3, width: "100%", height: "100%", bgcolor: "#f8f9fa" }}>
      {viewMode === "selection" && (
        <TaskDashboard
          onOpenCreateModal={() => setOpenModal(true)}
          onSelectViewTasks={() => setViewMode("view")}
        />
      )}

      {viewMode === "view" && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h5">
              {subView !== "none" && `${subView === "assigned" ? "Assigned" : "Created"} Tasks`}
            </Typography>
            <Button variant="outlined" color="primary" onClick={handleBackToDashboard}>
              Back to Dashboard
            </Button>
          </Box>

          {subView === "none" && (
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 3,
                alignItems: "center",
                justifyContent: "center",
                minHeight: "40vh",
                mt: 2,
              }}
            >
              <Card sx={{ width: 260, height: 200, boxShadow: 2, borderRadius: 3 }}>
                <CardActionArea onClick={() => setSubView("assigned")} sx={{ p: 2, textAlign: "center" }}>
                  <AssignmentIndIcon sx={{ fontSize: 45, color: "#e65100", mb: 1 }} />
                  <CardContent>
                    <Typography variant="h6">
                      Assigned Tasks
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tasks allocated to you by team.
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>

              <Card sx={{ width: 260, height: 200, boxShadow: 2, borderRadius: 3 }}>
                <CardActionArea onClick={() => setSubView("created")} sx={{ p: 2, textAlign: "center" }}>
                  <AssignmentTurnedInIcon sx={{ fontSize: 45, color: "#1565c0", mb: 1 }} />
                  <CardContent>
                    <Typography variant="h6">
                      Created Tasks
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tasks you generated for team members.
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Box>
          )}

          {subView === "assigned" && (
            <Box sx={{ p: 4, border: "2px dashed #ccc", borderRadius: 2, textAlign: "center", bgcolor: "#ffffff", height: "60vh", overflow: "scroll" }}>
              <Button size="small" variant="text" sx={{ mt: 2 }} onClick={() => setSubView("none")}>
                Go Back to Sub-options
              </Button>
              <AssignedTask fromTeam="team" teamId={teamId}/>
            </Box>
          )}

          {subView === "created" && (
            <Box sx={{ p: 4, border: "2px dashed #ccc", borderRadius: 2, textAlign: "center", bgcolor: "#ffffff", height: "60vh", overflow: "scroll" }}>
              <Button size="small" variant="text" sx={{ mt: 2 }} onClick={() => setSubView("none")}>
                Go Back to Sub-options
              </Button>
              <CreatedTask fromTeam="team" teamId={teamId}/>
            </Box>
          )}
        </Box>
      )}

      <CreateTaskModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        teamMembers={teamMembersList}
        membersLoading={membersLoading}
        creatingTask={creatingTask}
        onSubmit={handleCreateTaskSubmit}
        setSearchTerm={setSearchTerm}
      />
    </Box>
  );
};

export default TeamTasksTab;