import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import ExecutionTable from "../components/ExecutionTable";
import { useNotifications } from "../context/NotificationContext";

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useNotifications();

  async function loadDetails() {
    try {
      const taskData = await api.tasks.get(id);
      const execsData = await api.executions.list({ task_id: id });
      setTask(taskData);
      setExecutions(execsData.items);
    } catch (err) {
      addToast(err.message || "Failed to load details", "failed");
      navigate("/tasks");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDetails();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this task config? This action is irreversible.")) return;
    try {
      await api.tasks.delete(id);
      addToast("Task config successfully purged.", "success");
      navigate("/tasks");
    } catch (err) {
      addToast(err.message || "Delete failed", "failed");
    }
  };

  const handleTrigger = async () => {
    try {
      await api.tasks.trigger(id);
      addToast("Task execution queued.", "success");
      loadDetails();
    } catch (err) {
      addToast(err.message || "Trigger failed", "failed");
    }
  };

  if (loading) {
    return <div style={styles.loading}>Connecting to execution records database...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.titleArea}>
          <Link to="/tasks" style={styles.backBtn}>← Back to Task Rules</Link>
          <h2 style={styles.title}>{task.name}</h2>
          <span style={styles.taskId}>UUID: {task.id}</span>
        </div>
        <div style={styles.actions}>
          <button onClick={handleTrigger} disabled={!task.is_enabled} className="btn btn-primary">
            ⚡ Trigger Exec
          </button>
          <button onClick={handleDelete} className="btn btn-danger">
            🗑️ Delete Config
          </button>
        </div>
      </div>

      <div style={styles.mainGrid}>
        <div style={styles.card} className="glass-panel">
          <h3 style={styles.cardTitle}>Configuration Settings</h3>
          <div style={styles.detailRow}>
            <span style={styles.label}>Execution Class</span>
            <span style={styles.val}>{task.task_type.toUpperCase()}</span>
          </div>
          {task.task_type === "http" ? (
            <>
              <div style={styles.detailRow}>
                <span style={styles.label}>Endpoint Url</span>
                <span style={styles.val}><code style={styles.code}>{task.http_method} {task.http_url}</code></span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.label}>Timeout Interval</span>
                <span style={styles.val}>{task.http_timeout}s</span>
              </div>
            </>
          ) : (
            <>
              <div style={styles.detailRow}>
                <span style={styles.label}>Shell Script</span>
                <span style={styles.val}><code style={styles.code}>{task.shell_command}</code></span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.label}>Timeout Limit</span>
                <span style={styles.val}>{task.shell_timeout}s</span>
              </div>
            </>
          )}
          <div style={styles.detailRow}>
            <span style={styles.label}>Trigger Rule</span>
            <span style={styles.val}>
              {task.schedule_type === "manual" ? "Manual Dispatch" : 
               task.schedule_type === "cron" ? `Cron [${task.cron_expression}]` :
               task.schedule_type === "interval" ? `Every ${task.interval_seconds}s` : "One-Time"}
            </span>
          </div>
          <div style={styles.detailRow}>
            <span style={styles.label}>Retry Maximum</span>
            <span style={styles.val}>{task.max_retries} attempts (Delay: {task.retry_delay_seconds}s)</span>
          </div>
        </div>

        <div style={styles.card} className="glass-panel">
          <h3 style={styles.cardTitle}>Aggregated Performance</h3>
          <div style={styles.statsGrid}>
            <div style={styles.statBox}>
              <span style={styles.statLabel}>Total Executions</span>
              <span style={styles.statVal}>{task.execution_count || 0}</span>
            </div>
            <div style={styles.statBox}>
              <span style={styles.statLabel}>Succeeded</span>
              <span style={{ ...styles.statVal, color: "var(--status-success)" }}>
                {task.success_count || 0}
              </span>
            </div>
            <div style={styles.statBox}>
              <span style={styles.statLabel}>Failed Runs</span>
              <span style={{ ...styles.statVal, color: "var(--status-failed)" }}>
                {task.failure_count || 0}
              </span>
            </div>
            <div style={styles.statBox}>
              <span style={styles.statLabel}>Efficiency</span>
              <span style={styles.statVal}>
                {task.execution_count > 0 ? 
                  `${((task.success_count / task.execution_count) * 100).toFixed(1)}%` : "100%"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.tableSection}>
        <h3 style={styles.tableTitle}>Task Execution History</h3>
        <ExecutionTable executions={executions} />
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "32px",
    marginLeft: "300px",
    marginTop: "20px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "32px",
  },
  titleArea: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  backBtn: {
    fontSize: "12px",
    color: "var(--color-primary)",
    fontWeight: 600,
    textDecoration: "none",
    marginBottom: "8px",
    display: "inline-block",
  },
  title: {
    fontSize: "24px",
    fontWeight: 800,
  },
  taskId: {
    fontSize: "11px",
    color: "var(--text-muted)",
    fontFamily: var(--font-mono),
  },
  actions: {
    display: "flex",
    gap: "12px",
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
    marginBottom: "32px",
  },
  card: {
    padding: "24px",
  },
  cardTitle: {
    fontSize: "16px",
    fontWeight: 700,
    marginBottom: "20px",
    borderBottom: "1px solid var(--border-color)",
    paddingBottom: "10px",
  },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 0",
    borderBottom: "1px solid rgba(255, 255, 255, 0.03)",
    fontSize: "14px",
  },
  label: {
    color: "var(--text-secondary)",
  },
  val: {
    fontWeight: 500,
  },
  code: {
    fontFamily: var(--font-mono),
    color: "var(--color-accent)",
    background: "rgba(6, 182, 212, 0.08)",
    padding: "2px 6px",
    borderRadius: "4px",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
  },
  statBox: {
    background: "rgba(10, 10, 18, 0.4)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius-md)",
    padding: "16px",
    textAlign: "center",
  },
  statLabel: {
    display: "block",
    fontSize: "11px",
    color: "var(--text-muted)",
    textTransform: "uppercase",
    fontWeight: 600,
  },
  statVal: {
    display: "block",
    fontSize: "20px",
    fontWeight: 800,
    marginTop: "6px",
  },
  tableSection: {
    marginTop: "32px",
  },
  tableTitle: {
    fontSize: "16px",
    fontWeight: 700,
    marginBottom: "16px",
  },
  loading: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "80vh",
    fontSize: "16px",
    color: "var(--text-secondary)",
  },
};
export const styles_global_var = styles;
