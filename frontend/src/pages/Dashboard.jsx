import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import StatsPanel from "../components/StatsPanel";
import ExecutionTable from "../components/ExecutionTable";
import NotificationFeed from "../components/NotificationFeed";
import { useNotifications } from "../context/NotificationContext";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentExecutions, setRecentExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { notifications } = useNotifications();

  async function loadDashboardData() {
    try {
      const statsData = await api.executions.stats();
      const execsData = await api.executions.list({ page_size: 8 });
      setStats(statsData);
      setRecentExecutions(execsData.items);
    } catch (err) {
      console.error("Failed to load dashboard statistics", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Reload data when any real-time WebSocket event arrives
  useEffect(() => {
    if (notifications.length > 0) {
      loadDashboardData();
    }
  }, [notifications]);

  if (loading) {
    return <div style={styles.loading}>Spinning up control dashboard...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.mainContent}>
        <StatsPanel stats={stats} />
        
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Recent Task Executions</h2>
          <ExecutionTable executions={recentExecutions} />
        </div>
      </div>
      
      <div style={styles.feedWrapper}>
        <NotificationFeed />
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    gap: "24px",
    padding: "32px",
    marginLeft: "300px",
    marginTop: "20px",
  },
  mainContent: {
    flexGrow: 1,
    display: "flex",
    flexDirection: "column",
    gap: "32px",
    width: "calc(100% - 344px)",
  },
  feedWrapper: {
    width: "320px",
    flexShrink: 0,
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: 700,
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
