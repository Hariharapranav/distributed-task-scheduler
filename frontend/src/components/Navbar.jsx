import React from "react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user } = useAuth();

  return (
    <header style={styles.header} className="glass-panel">
      <div style={styles.left}>
        <h1 style={styles.title}>System Control</h1>
        <p style={styles.subtitle}>Welcome back, {user?.full_name || user?.username || "Operator"}</p>
      </div>
      <div style={styles.right}>
        <div style={styles.statusIndicator}>
          <span style={styles.pulse} className="animate-pulse"></span>
          <span style={styles.statusText}>Engine Running</span>
        </div>
        <div style={styles.avatar}>
          {user?.username ? user.username[0].toUpperCase() : "U"}
        </div>
      </div>
    </header>
  );
}

const styles = {
  header: {
    height: "80px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 32px",
    marginLeft: "300px",
    marginTop: "20px",
    marginRight: "20px",
  },
  left: {
    display: "flex",
    flexDirection: "column",
  },
  title: {
    fontSize: "18px",
    fontWeight: 700,
  },
  subtitle: {
    fontSize: "12px",
    color: "var(--text-secondary)",
  },
  right: {
    display: "flex",
    alignItems: "center",
    gap: "24px",
  },
  statusIndicator: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(16, 185, 129, 0.1)",
    border: "1px solid rgba(16, 185, 129, 0.2)",
    padding: "6px 12px",
    borderRadius: "var(--radius-sm)",
  },
  pulse: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "var(--status-success)",
  },
  statusText: {
    fontSize: "12px",
    fontWeight: 600,
    color: "var(--status-success)",
  },
  avatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    fontWeight: 700,
    color: "white",
    border: "2px solid var(--border-color)",
  },
};
