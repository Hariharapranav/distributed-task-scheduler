import React from "react";

export default function ExecutionTable({ executions }) {
  const getStatusBadge = (status) => {
    switch (status) {
      case "success": return <span className="badge badge-success">Success</span>;
      case "failed": return <span className="badge badge-failed">Failed</span>;
      case "running": return <span className="badge badge-running">Running</span>;
      case "retrying": return <span className="badge badge-retrying">Retrying</span>;
      default: return <span className="badge badge-pending">Pending</span>;
    }
  };

  return (
    <div style={styles.container} className="glass-panel">
      <table style={styles.table}>
        <thead>
          <tr style={styles.headerRow}>
            <th style={styles.th}>Execution ID</th>
            <th style={styles.th}>Trigger</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Started At</th>
            <th style={styles.th}>Duration</th>
            <th style={styles.th}>Retries</th>
          </tr>
        </thead>
        <tbody>
          {executions.length === 0 ? (
            <tr>
              <td colSpan="6" style={styles.empty}>No runs recorded yet.</td>
            </tr>
          ) : (
            executions.map((exec) => (
              <tr key={exec.id} style={styles.row}>
                <td style={styles.td}><code style={styles.code}>{exec.id.substring(0, 8)}...</code></td>
                <td style={styles.td}><span style={styles.triggerBadge}>{exec.trigger}</span></td>
                <td style={styles.td}>{getStatusBadge(exec.status)}</td>
                <td style={styles.td}>
                  {exec.started_at ? new Date(exec.started_at).toLocaleString() : "—"}
                </td>
                <td style={styles.td}>
                  {exec.duration_ms ? `${(exec.duration_ms / 1000).toFixed(2)}s` : "—"}
                </td>
                <td style={styles.td}>{exec.retry_count}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  container: {
    width: "100%",
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
  },
  headerRow: {
    borderBottom: "1px solid var(--border-color)",
  },
  th: {
    padding: "16px 24px",
    fontSize: "12px",
    fontWeight: 600,
    color: "var(--text-secondary)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  row: {
    borderBottom: "1px solid var(--border-color)",
    transition: "background-color 0.2s",
    cursor: "pointer",
  },
  td: {
    padding: "16px 24px",
    fontSize: "14px",
    color: "var(--text-primary)",
  },
  code: {
    fontFamily: var(--font-mono),
    color: "var(--color-accent)",
    background: "rgba(6, 182, 212, 0.08)",
    padding: "2px 6px",
    borderRadius: "4px",
  },
  triggerBadge: {
    textTransform: "capitalize",
    fontSize: "12px",
    fontWeight: 500,
  },
  empty: {
    padding: "32px",
    textAlign: "center",
    color: "var(--text-muted)",
  },
};
export const styles_global_var = styles;
