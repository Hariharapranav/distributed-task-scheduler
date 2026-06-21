import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message || "Failed to log in.");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card} className="glass-panel">
        <h2 style={styles.title} className="text-gradient">Welcome to TaskFlow</h2>
        <p style={styles.subtitle}>Sign in to manage your distributed tasks.</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={styles.submitBtn}>
            Sign In
          </button>
        </form>

        <p style={styles.footer}>
          Don't have an account? <Link to="/register" style={styles.link}>Register</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--bg-main)",
  },
  card: {
    width: "100%",
    maxWidth: "420px",
    padding: "40px",
  },
  title: {
    fontSize: "24px",
    fontWeight: 800,
    textAlign: "center",
    marginBottom: "8px",
  },
  subtitle: {
    fontSize: "14px",
    color: "var(--text-secondary)",
    textAlign: "center",
    marginBottom: "32px",
  },
  error: {
    background: "var(--status-failed-bg)",
    border: "1px solid var(--status-failed)",
    color: "#fca5a5",
    padding: "12px",
    borderRadius: "var(--radius-md)",
    fontSize: "13px",
    marginBottom: "20px",
    textAlign: "center",
  },
  submitBtn: {
    width: "100%",
    height: "44px",
    marginTop: "8px",
  },
  footer: {
    fontSize: "13px",
    color: "var(--text-secondary)",
    textAlign: "center",
    marginTop: "24px",
  },
  link: {
    color: "var(--color-primary)",
    fontWeight: 600,
  },
};
export const styles_global_var = styles;
