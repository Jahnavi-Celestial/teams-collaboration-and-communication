import { createBrowserRouter, Navigate } from "react-router-dom";
import ChatRoom from "../pages/ChatRoom";
import Dashboard from "../pages/Dashboard";
import SignIn from "../pages/SignIn";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import AssignedTask from "../pages/AssignedTask";
import CreatedTask from "../pages/CreatedTask";
import TaskDetail from "../pages/TaskDetail";

const ProtectedRoute = () => {
  const { user } = useAuth();
  
  if (!user) {
    return <SignIn />;
  }
  return <Layout />;
};

export const router = createBrowserRouter([
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard"/>,
      },
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "team/:teamId",
        element: <ChatRoom />,
      },
      {
        path: "assignedTask",
        element: <AssignedTask  fromTeam="normal"/>,
      },
      {
        path: "createdTask",
        element: <CreatedTask fromTeam="normal"/>,
      },
      {
        path: "/taskDetail/:id",
        element: <TaskDetail />,
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/"/>,
  },
]);
