import React from "react";
import { useNotifications } from "../context/NotificationContext";

export default function NotificationFeed() {
  const { notifications } = useNotifications();

  return (
    <div style={styles.container} className="glass-panel">
      <div style={styles.header}>
        <h3 style={styles.title}>Real-Time Activity</h3>
        <span style={styles.count}>{notifications.length}</span>
      </div>
      <div style={styles.feed}>
        {notifications.length === 0 ? (
          <p style={styles.empty}>System fully idle. No incoming events.</p>
        ) : (
          notifications.map((n) => (
            <div key={n.id} style={styles.item}>
              <div style={styles.meta}>
                <span style={styles.time}>{new Date(n.timestamp).toLocaleTimeString()}</span>
                <span style={{
                  ...styles.statusDot,
                  backgroundColor: n.event_type === "success" ? "var(--status-success)" : "var(--status-failed)"
                }} />
              </div>
              <p style={styles.message}>
                {n.message || `Task run event published: ${n.event_type}`}
              </p>
              {n.task_id && (
                <span style={styles.taskId}>ID: {n.task_id.substring(0, 8)}</span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: "320px",
    height: "calc(100vh - 120px)",
    display: "flex",
    flexDirection: "column",
    padding: "24px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    borderBottom: "1px solid var(--border-color)",
    paddingBottom: "12px",
  },
  title: {
    fontSize: "16px",
    fontWeight: 700,
  },
  count: {
    background: "var(--color-primary)",
    color: "white",
    fontSize: "11px",
    fontWeight: 700,
    padding: "2px 8px",
    borderRadius: "10px",
  },
  feed: {
    flexGrow: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  item: {
    padding: "12px",
    background: "rgba(10, 10, 18, 0.4)",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--border-color)",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  meta: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  time: {
    fontSize: "11px",
    color: "var(--text-muted)",
  },
  statusDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
  },
  message: {
    fontSize: "13px",
    color: "var(--text-primary)",
    lineHeight: 1.4,
  },
  taskId: {
    fontSize: "10px",
    color: "var(--text-muted)",
    fontFamily: "var(--font-mono)",
  },
  empty: {
    textAlign: "center",
    color: "var(--text-muted)",
    fontSize: "13px",
    marginTop: "20px",
  },
};
