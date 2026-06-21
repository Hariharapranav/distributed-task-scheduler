import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function StatsPanel({ stats }) {
  const chartData = [
    { name: "Mon", executions: 12 },
    { name: "Tue", executions: 19 },
    { name: "Wed", executions: 15 },
    { name: "Thu", executions: 22 },
    { name: "Fri", executions: 30 },
    { name: "Sat", executions: 18 },
    { name: "Sun", executions: stats?.total_executions || 0 },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.grid}>
        <div style={styles.card} className="glass-panel">
          <span style={styles.icon}>⚡</span>
          <div style={styles.info}>
            <span style={styles.label}>Total Executions</span>
            <h3 style={styles.value}>{stats?.total_executions || 0}</h3>
          </div>
        </div>

        <div style={styles.card} className="glass-panel">
          <span style={styles.icon}>✅</span>
          <div style={styles.info}>
            <span style={styles.label}>Success Rate</span>
            <h3 style={styles.value}>{stats?.success_rate || 100}%</h3>
          </div>
        </div>

        <div style={styles.card} className="glass-panel">
          <span style={styles.icon}>⏱️</span>
          <div style={styles.info}>
            <span style={styles.label}>Avg Duration</span>
            <h3 style={styles.value}>
              {stats?.avg_duration_ms ? `${(stats.avg_duration_ms / 1000).toFixed(2)}s` : "0s"}
            </h3>
          </div>
        </div>

        <div style={styles.card} className="glass-panel">
          <span style={styles.icon}>⚠️</span>
          <div style={styles.info}>
            <span style={styles.label}>Failures</span>
            <h3 style={styles.value}>{stats?.failure_count || 0}</h3>
          </div>
        </div>
      </div>

      <div style={styles.chartContainer} className="glass-panel">
        <h3 style={styles.chartTitle}>Task Execution History</h3>
        <div style={styles.chartWrapper}>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorExecs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} />
              <YAxis stroke="var(--text-secondary)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border-color)",
                  borderRadius: "8px",
                  color: "white"
                }}
              />
              <Area
                type="monotone"
                dataKey="executions"
                stroke="var(--color-primary)"
                fillOpacity={1}
                fill="url(#colorExecs)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
  },
  card: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
    padding: "24px",
  },
  icon: {
    fontSize: "32px",
  },
  info: {
    display: "flex",
    flexDirection: "column",
  },
  label: {
    fontSize: "12px",
    color: "var(--text-secondary)",
    textTransform: "uppercase",
    fontWeight: 600,
  },
  value: {
    fontSize: "24px",
    fontWeight: 800,
    marginTop: "4px",
  },
  chartContainer: {
    padding: "24px",
  },
  chartTitle: {
    fontSize: "16px",
    fontWeight: 700,
    marginBottom: "20px",
  },
  chartWrapper: {
    width: "100%",
  },
};
export const styles_global_var = styles;
