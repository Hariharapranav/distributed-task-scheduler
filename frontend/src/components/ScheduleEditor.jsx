import React from "react";

export default function ScheduleEditor({
  scheduleType,
  setScheduleType,
  cronExpression,
  setCronExpression,
  intervalSeconds,
  setIntervalSeconds,
  runAt,
  setRunAt,
}) {
  return (
    <div style={styles.container}>
      <div className="form-group">
        <label className="form-label">Schedule Type</label>
        <select
          value={scheduleType}
          onChange={(e) => setScheduleType(e.target.value)}
          className="form-input"
          style={styles.select}
        >
          <option value="manual">Manual Trigger Only</option>
          <option value="cron">Cron Expression (Linux format)</option>
          <option value="interval">Fixed Interval (Seconds)</option>
          <option value="one_time">One-Time Specific Date</option>
        </select>
      </div>

      {scheduleType === "cron" && (
        <div className="form-group">
          <label className="form-label">Cron Expression</label>
          <input
            type="text"
            value={cronExpression}
            onChange={(e) => setCronExpression(e.target.value)}
            placeholder="e.g. */5 * * * * (every 5 mins)"
            className="form-input"
            required
          />
          <span style={styles.helpText}>Format: minute hour day-of-month month day-of-week</span>
        </div>
      )}

      {scheduleType === "interval" && (
        <div className="form-group">
          <label className="form-label">Interval (Seconds)</label>
          <input
            type="number"
            value={intervalSeconds || ""}
            onChange={(e) => setIntervalSeconds(parseInt(e.target.value) || null)}
            placeholder="e.g. 60 (minimum 10)"
            min="10"
            className="form-input"
            required
          />
        </div>
      )}

      {scheduleType === "one_time" && (
        <div className="form-group">
          <label className="form-label">Run Date & Time</label>
          <input
            type="datetime-local"
            value={runAt}
            onChange={(e) => setRunAt(e.target.value)}
            className="form-input"
            required
          />
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
  },
  select: {
    cursor: "pointer",
  },
  helpText: {
    fontSize: "11px",
    color: "var(--text-muted)",
    marginTop: "6px",
    display: "block",
  },
};
export const styles_global_var = styles;
