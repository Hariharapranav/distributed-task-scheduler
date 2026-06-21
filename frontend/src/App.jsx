import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";

import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import TaskDetail from "./pages/TaskDetail";
import Notifications from "./pages/Notifications";

function ProtectedLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={styles.loading}>Accessing authorization registry...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <NotificationProvider>
      <div style={styles.layout}>
        <Sidebar />
        <div style={styles.content}>
          <Navbar />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/tasks/:id" element={<TaskDetail />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </NotificationProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

const styles = {
  layout: {
    display: "flex",
    minHeight: "100vh",
    background: "var(--bg-main)",
  },
  content: {
    flexGrow: 1,
    display: "flex",
    flexDirection: "column",
  },
  loading: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    fontSize: "16px",
    color: "var(--text-secondary)",
    background: "var(--bg-main)",
  },
};
export const styles_global_var = styles;
