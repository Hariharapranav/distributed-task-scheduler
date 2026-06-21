import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import Modal from "../components/Modal";
import { useNotifications } from "../context/NotificationContext";

export default function Notifications() {
  const [rules, setRules] = useState([]);
  const [logs, setLogs] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { addToast } = useNotifications();

  // Rule Form State
  const [name, setName] = useState("");
  const [taskId, setTaskId] = useState(""); // "" means global (all tasks)
  const [channel, setChannel] = useState("email");
  const [emailAddress, setEmailAddress] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [notifyOnSuccess, setNotifyOnSuccess] = useState(false);
  const [notifyOnFailure, setNotifyOnFailure] = useState(true);

  async function loadData() {
    try {
      const rulesData = await api.notifications.listRules();
      const logsData = await api.notifications.listLogs();
      const tasksData = await api.tasks.list();
      
      setRules(rulesData);
      setLogs(logsData);
      setTasks(tasksData.items);
    } catch (err) {
      console.error("Failed to load notifications configs", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateRule = async (e) => {
    e.preventDefault();
    try {
      const channelConfig = channel === "email" 
        ? { email: emailAddress }
        : { url: webhookUrl, secret: webhookSecret, method: "POST" };

      const payload = {
        name,
        task_id: taskId || null,
        channel,
        notify_on_success: notifyOnSuccess,
        notify_on_failure: notifyOnFailure,
        channel_config: channelConfig,
      };

      await api.notifications.createRule(payload);
      addToast(`Notification rule "${name}" successfully registered.`, "success");
      setIsModalOpen(false);
      resetForm();
      loadData();
    } catch (err) {
      addToast(err.message || "Failed to create rule", "failed");
    }
  };

  const resetForm = () => {
    setName("");
    setTaskId("");
    setChannel("email");
    setEmailAddress("");
    setWebhookUrl("");
    setWebhookSecret("");
    setNotifyOnSuccess(false);
    setNotifyOnFailure(true);
  };

  const handleDeleteRule = async (ruleId) => {
    if (!window.confirm("Delete this notification rule?")) return;
    try {
      await api.notifications.deleteRule(ruleId);
      addToast("Rule removed.", "success");
      loadData();
    } catch (err) {
      addToast(err.message || "Delete failed", "failed");
    }
  };

  if (loading) {
    return <div style={styles.loading}>Accessing notification routers...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Notification Engine Router</h2>
          <p style={styles.subtitle}>Configure email alerts or dispatch webhooks for job completions</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
          ✚ Create Notification Rule
        </button>
      </div>

      <div style={styles.grid}>
        <div style={styles.section} className="glass-panel">
          <h3 style={styles.sectionTitle}>Active Notification Rules</h3>
          {rules.length === 0 ? (
            <p style={styles.empty}>No notification rules active.</p>
          ) : (
            rules.map((rule) => (
              <div key={rule.id} style={styles.ruleItem}>
                <div style={styles.ruleInfo}>
                  <span style={styles.ruleName}>{rule.name}</span>
                  <span style={styles.ruleMeta}>
                    Channel: {rule.channel.toUpperCase()} | Target: {rule.channel === "email" ? rule.channel_config.email : rule.channel_config.url}
                  </span>
                  <span style={styles.ruleConditions}>
                    Notify: {rule.notify_on_success ? "✅ Success" : ""} {rule.notify_on_failure ? "❌ Failure" : ""}
                  </span>
                </div>
                <button onClick={() => handleDeleteRule(rule.id)} className="btn btn-danger" style={styles.ruleDeleteBtn}>
                  Delete
                </button>
              </div>
            ))
          )}
        </div>

        <div style={styles.section} className="glass-panel">
          <h3 style={styles.sectionTitle}>Notification Dispatch Logs</h3>
          <div style={styles.logsList}>
            {logs.length === 0 ? (
              <p style={styles.empty}>No logs recorded.</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} style={styles.logItem}>
                  <div style={styles.logHeader}>
                    <span style={{
                      ...styles.logStatus,
                      color: log.status === "sent" ? "var(--status-success)" : "var(--status-failed)"
                    }}>
                      {log.status.toUpperCase()}
                    </span>
                    <span style={styles.logTime}>{new Date(log.sent_at).toLocaleString()}</span>
                  </div>
                  <p style={styles.logMsg}>{log.message || log.error}</p>
                  <span style={styles.logChannel}>Channel: {log.channel}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Notification Rule">
        <form onSubmit={handleCreateRule} style={styles.form}>
          <div className="form-group">
            <label className="form-label">Rule Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Failure Alerts for Production"
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Target Task scope</label>
            <select
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
              className="form-input"
            >
              <option value="">All Tasks (Global Rule)</option>
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>{task.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Dispatch Channel</label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="form-input"
            >
              <option value="email">Email</option>
              <option value="webhook">Webhook Endpoint</option>
            </select>
          </div>

          {channel === "email" ? (
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="operator@domain.com"
                className="form-input"
                required
              />
            </div>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">Webhook URL</label>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://company.slack.com/services/..."
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Signature Secret (Optional)</label>
                <input
                  type="text"
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  placeholder="HMAC SHA256 signature key"
                  className="form-input"
                />
              </div>
            </>
          )}

          <div style={styles.checkboxRow}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={notifyOnSuccess}
                onChange={(e) => setNotifyOnSuccess(e.target.checked)}
                style={styles.checkbox}
              />
              Notify on Success
            </label>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={notifyOnFailure}
                onChange={(e) => setNotifyOnFailure(e.target.checked)}
                style={styles.checkbox}
              />
              Notify on Failure
            </label>
          </div>

          <button type="submit" className="btn btn-primary" style={styles.submitBtn}>
            Save Rule
          </button>
        </form>
      </Modal>
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
    alignItems: "center",
    marginBottom: "32px",
  },
  title: {
    fontSize: "24px",
    fontWeight: 800,
  },
  subtitle: {
    fontSize: "14px",
    color: "var(--text-secondary)",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
  },
  section: {
    padding: "24px",
    minHeight: "400px",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: 700,
    marginBottom: "20px",
    borderBottom: "1px solid var(--border-color)",
    paddingBottom: "10px",
  },
  ruleItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px",
    background: "rgba(10, 10, 18, 0.4)",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--border-color)",
    marginBottom: "12px",
  },
  ruleInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  ruleName: {
    fontSize: "14px",
    fontWeight: 700,
  },
  ruleMeta: {
    fontSize: "12px",
    color: "var(--text-secondary)",
  },
  ruleConditions: {
    fontSize: "11px",
    color: "var(--text-muted)",
  },
  ruleDeleteBtn: {
    padding: "6px 12px",
  },
  logsList: {
    maxHeight: "500px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  logItem: {
    padding: "12px",
    background: "rgba(10, 10, 18, 0.4)",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--border-color)",
  },
  logHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "6px",
  },
  logStatus: {
    fontSize: "11px",
    fontWeight: 700,
  },
  logTime: {
    fontSize: "11px",
    color: "var(--text-muted)",
  },
  logMsg: {
    fontSize: "13px",
    color: "var(--text-primary)",
    lineHeight: 1.4,
  },
  logChannel: {
    fontSize: "10px",
    color: "var(--text-muted)",
    marginTop: "4px",
    display: "block",
  },
  form: {
    display: "flex",
    flexDirection: "column",
  },
  checkboxRow: {
    display: "flex",
    gap: "24px",
    margin: "8px 0 20px 0",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    cursor: "pointer",
  },
  checkbox: {
    width: "16px",
    height: "16px",
  },
  submitBtn: {
    width: "100%",
    height: "44px",
  },
  empty: {
    textAlign: "center",
    color: "var(--text-muted)",
    fontSize: "13px",
    marginTop: "20px",
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
