import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await register(email, username, password, fullName);
      navigate("/");
    } catch (err) {
      setError(err.message || "Registration failed.");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card} className="glass-panel">
        <h2 style={styles.title} className="text-gradient">Create Account</h2>
        <p style={styles.subtitle}>Get started with TaskFlow scheduler.</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="form-input"
              required
            />
          </div>

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
              minLength={8}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={styles.submitBtn}>
            Register
          </button>
        </form>

        <p style={styles.footer}>
          Already have an account? <Link to="/login" style={styles.link}>Sign In</Link>
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
