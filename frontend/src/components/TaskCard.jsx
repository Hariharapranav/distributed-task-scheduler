import React from "react";
import { Link } from "react-router-dom";

export default function TaskCard({ task, onTrigger, onToggle }) {
  const getBadgeClass = (status) => {
    switch (status) {
      case "success": return "badge badge-success";
      case "failed": return "badge badge-failed";
      case "running": return "badge badge-running";
      case "retrying": return "badge badge-retrying";
      default: return "badge badge-pending";
    }
  };

  const getScheduleText = () => {
    if (task.schedule_type === "manual") return "Manual Trigger";
    if (task.schedule_type === "cron") return `Cron: ${task.cron_expression}`;
    if (task.schedule_type === "interval") return `Every ${task.interval_seconds}s`;
    return "One Time";
  };

  return (
    <div style={styles.card} className="glass-panel">
      <div style={styles.header}>
        <div style={styles.titleArea}>
          <Link to={`/tasks/${task.id}`} style={styles.name}>{task.name}</Link>
          <span style={styles.type}>{task.task_type.toUpperCase()}</span>
        </div>
        <div style={styles.toggleContainer}>
          <input
            type="checkbox"
            checked={task.is_enabled}
            onChange={() => onToggle(task)}
            style={styles.checkbox}
          />
        </div>
      </div>
      
      <p style={styles.description}>{task.description || "No description provided."}</p>

      <div style={styles.metaGrid}>
        <div>
          <span style={styles.label}>Schedule</span>
          <span style={styles.value}>{getScheduleText()}</span>
        </div>
        <div>
          <span style={styles.label}>Last Run</span>
          <span style={styles.value}>
            {task.last_run_at ? new Date(task.last_run_at).toLocaleString() : "Never"}
          </span>
        </div>
      </div>

      <div style={styles.actions}>
        <button
          onClick={() => onTrigger(task.id)}
          disabled={!task.is_enabled}
          className="btn btn-primary"
          style={styles.runBtn}
        >
          ⚡ Run Now
        </button>
        <Link to={`/tasks/${task.id}`} className="btn btn-secondary" style={styles.detailBtn}>
          View History
        </Link>
      </div>
    </div>
  );
}

const styles = {
  card: {
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  titleArea: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  name: {
    fontSize: "18px",
    fontWeight: 700,
    color: "var(--text-primary)",
  },
  type: {
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "0.05em",
    color: "var(--color-accent)",
    background: "rgba(6, 182, 212, 0.1)",
    padding: "2px 6px",
    borderRadius: "4px",
    alignSelf: "flex-start",
  },
  toggleContainer: {
    display: "flex",
    alignItems: "center",
  },
  checkbox: {
    width: "40px",
    height: "20px",
    cursor: "pointer",
  },
  description: {
    fontSize: "14px",
    color: "var(--text-secondary)",
    lineHeight: 1.5,
    minHeight: "42px",
  },
  metaGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    padding: "12px 0",
    borderTop: "1px solid var(--border-color)",
    borderBottom: "1px solid var(--border-color)",
  },
  label: {
    display: "block",
    fontSize: "11px",
    color: "var(--text-muted)",
    textTransform: "uppercase",
    fontWeight: 600,
  },
  value: {
    display: "block",
    fontSize: "13px",
    color: "var(--text-primary)",
    marginTop: "2px",
  },
  actions: {
    display: "flex",
    gap: "12px",
  },
  runBtn: {
    flexGrow: 1,
  },
  detailBtn: {
    flexGrow: 1,
  },
};
