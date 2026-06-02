import { createBrowserRouter, Navigate } from "react-router-dom";
import ChatRoom from "../pages/ChatRoom";
import Dashboard from "../pages/Dashboard";
import SignIn from "../pages/SignIn";
import Tasks from "../pages/Tasks";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";

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
        path: "tasks",
        element: <Tasks />,
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/"/>,
  },
]);
