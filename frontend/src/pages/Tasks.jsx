import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import TaskCard from "../components/TaskCard";
import Modal from "../components/Modal";
import ScheduleEditor from "../components/ScheduleEditor";
import { useNotifications } from "../context/NotificationContext";

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { addToast } = useNotifications();

  // Task form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [taskType, setTaskType] = useState("http");
  const [httpMethod, setHttpMethod] = useState("POST");
  const [httpUrl, setHttpUrl] = useState("");
  const [shellCommand, setShellCommand] = useState("");
  
  // Scheduling state
  const [scheduleType, setScheduleType] = useState("manual");
  const [cronExpression, setCronExpression] = useState("");
  const [intervalSeconds, setIntervalSeconds] = useState(60);
  const [runAt, setRunAt] = useState("");

  async function fetchTasks() {
    try {
      const data = await api.tasks.list();
      setTasks(data.items);
    } catch (err) {
      console.error("Failed to fetch tasks", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name,
        description,
        task_type: taskType,
        schedule_type: scheduleType,
        http_method: taskType === "http" ? httpMethod : undefined,
        http_url: taskType === "http" ? httpUrl : undefined,
        shell_command: taskType === "shell" ? shellCommand : undefined,
        cron_expression: scheduleType === "cron" ? cronExpression : undefined,
        interval_seconds: scheduleType === "interval" ? intervalSeconds : undefined,
        run_at: scheduleType === "one_time" ? runAt : undefined,
      };

      await api.tasks.create(payload);
      addToast(`Task "${name}" successfully registered.`, "success");
      setIsModalOpen(false);
      resetForm();
      fetchTasks();
    } catch (err) {
      addToast(err.message || "Failed to create task", "failed");
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setTaskType("http");
    setHttpMethod("POST");
    setHttpUrl("");
    setShellCommand("");
    setScheduleType("manual");
    setCronExpression("");
    setIntervalSeconds(60);
    setRunAt("");
  };

  const handleTriggerTask = async (id) => {
    try {
      await api.tasks.trigger(id);
      addToast("Manual execution queued.", "success");
    } catch (err) {
      addToast(err.message || "Trigger failed", "failed");
    }
  };

  const handleToggleTask = async (task) => {
    try {
      await api.tasks.update(task.id, { is_enabled: !task.is_enabled });
      addToast(`Task status updated.`, "success");
      fetchTasks();
    } catch (err) {
      addToast(err.message || "Update failed", "failed");
    }
  };

  if (loading) {
    return <div style={styles.loading}>Accessing registry repositories...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Configured Schedulers</h2>
          <p style={styles.subtitle}>Define automatic workflows or trigger manual scripts</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
          ✚ Create Task
        </button>
      </div>

      <div style={styles.grid}>
        {tasks.length === 0 ? (
          <div style={styles.empty} className="glass-panel">
            <span style={styles.emptyIcon}>📝</span>
            <h3>No Tasks Registered</h3>
            <p>Create your first task schedule to begin orchestrating workflows.</p>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onTrigger={handleTriggerTask}
              onToggle={handleToggleTask}
            />
          ))
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register Task Config">
        <form onSubmit={handleCreateTask} style={styles.form}>
          <div className="form-group">
            <label className="form-label">Task Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-input"
              style={styles.textarea}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Execution Type</label>
            <select
              value={taskType}
              onChange={(e) => setTaskType(e.target.value)}
              className="form-input"
            >
              <option value="http">HTTP Request (Webhook)</option>
              <option value="shell">Shell Command</option>
            </select>
          </div>

          {taskType === "http" && (
            <div style={styles.row}>
              <div className="form-group" style={{ width: "120px" }}>
                <label className="form-label">Method</label>
                <select
                  value={httpMethod}
                  onChange={(e) => setHttpMethod(e.target.value)}
                  className="form-input"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>
              <div className="form-group" style={{ flexGrow: 1 }}>
                <label className="form-label">Target URL</label>
                <input
                  type="url"
                  value={httpUrl}
                  onChange={(e) => setHttpUrl(e.target.value)}
                  placeholder="https://api.domain.com/webhook"
                  className="form-input"
                  required
                />
              </div>
            </div>
          )}

          {taskType === "shell" && (
            <div className="form-group">
              <label className="form-label">Shell Command</label>
              <input
                type="text"
                value={shellCommand}
                onChange={(e) => setShellCommand(e.target.value)}
                placeholder="e.g. echo 'Run script' && python update.py"
                className="form-input"
                required
              />
            </div>
          )}

          <ScheduleEditor
            scheduleType={scheduleType}
            setScheduleType={setScheduleType}
            cronExpression={cronExpression}
            setCronExpression={setCronExpression}
            intervalSeconds={intervalSeconds}
            setIntervalSeconds={setIntervalSeconds}
            runAt={runAt}
            setRunAt={setRunAt}
          />

          <button type="submit" className="btn btn-primary" style={styles.submitBtn}>
            Save Task
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
    gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
    gap: "24px",
  },
  empty: {
    gridColumn: "1 / -1",
    padding: "64px 32px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
  },
  emptyIcon: {
    fontSize: "48px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
  },
  textarea: {
    height: "80px",
    resize: "none",
  },
  row: {
    display: "flex",
    gap: "16px",
  },
  submitBtn: {
    width: "100%",
    height: "44px",
    marginTop: "16px",
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
