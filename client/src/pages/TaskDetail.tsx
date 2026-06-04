import { useMutation, useQuery } from '@apollo/client/react';
import { Container, Typography, Box, Button } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { GetTaskDetail } from '../graphql/queries';
import { DELETE_TASK } from '../graphql/mutations';

const TaskDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate()

    const { data, loading, error } = useQuery(GetTaskDetail, {
        variables: { taskId: id },
        skip: !id
    });

    const taskdata = data?.getTaskDetail;

    const formattedDate = (isoString?: string) => {
        if (!isoString) return "N/A";
        try {
            return new Intl.DateTimeFormat('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            }).format(new Date(isoString));
        } catch {
            return "N/A";
        }
    };

    const [deleteAction] = useMutation(DELETE_TASK)

    const handleDeleteTask = () => {
        deleteAction({variables: {taskId: id}})
        navigate(-1)
    }

    if (loading) {
        return (
            <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", gap: 2, alignItems: "center", justifyContent: "center", color: "#3d77cf" }}>
                <Typography variant="h5">Loading...</Typography>
            </Box>
        );
    }

    if (error || !taskdata) {
        return (
            <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography color="error" variant="h6">
                    {error ? `Error: ${error.message}` : "Task not found"}
                </Typography>
            </Box>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ minHeight: "90vh", py: { xs: 3, md: 5 }, px: { xs: 2, sm: 3 }, display: "flex", flexDirection: "column", gap: 4 }}>
            <Box sx={{ width: "100%", display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "stretch", sm: "center" }, gap: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', fontSize: { xs: '1.75rem', sm: '2.125rem' }, wordBreak: "break-word" }}>
                    {taskdata.subject?.toUpperCase()}
                </Typography>

                <Box sx={{ minWidth: "150px", borderRadius: 2, bgcolor: "#4f90f3b1", p: 2, textAlign: "center", boxShadow: 1, alignSelf: { xs: "flex-start", sm: "auto" } }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Status</Typography>
                    <Typography variant="body2">{taskdata.status}</Typography>
                </Box>
            </Box>

            <Box sx={{ width: "100%", maxWidth: "800px", display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Typography variant="h6" sx={{ mb: 1, wordBreak: "break-word" }}>
                    Description: {taskdata.description || "No description provided."}
                </Typography>
                <Typography variant="body1"><strong>Task from team:</strong> {taskdata.team?.name?.toUpperCase()}</Typography>
                <Typography variant="body1"><strong>Assigned By:</strong> {taskdata.assigned_by?.name}</Typography>
                <Typography variant="body1"><strong>Assigned To:</strong> {taskdata.assigned_to?.name}</Typography>
                <Typography variant="body1"><strong>Assigned On:</strong> {formattedDate(taskdata.created_at)}</Typography>
                <Typography variant="body1"><strong>Deadline:</strong> {formattedDate(taskdata.deadline)}</Typography>
            </Box>

            <Box sx={{ mt: 'auto', pt: 2 }}>
                <Button variant="contained" size="large" sx={{ px: 4, py: 1.5, width: { xs: "100%", sm: "auto" } }} onClick={handleDeleteTask}>
                    Delete Task
                </Button>
            </Box>

            {taskdata.status === "MISSED_DEADLINE" && (
                <Box sx={{ mt: 'auto', pt: 2 }}>
                    <Button variant="contained" size="large" sx={{ px: 4, py: 1.5, width: { xs: "100%", sm: "auto" } }}>
                        Change Deadline
                    </Button>
                </Box>
            )}
        </Container>
    );
};

export default TaskDetail;