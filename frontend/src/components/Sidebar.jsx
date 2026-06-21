import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Sidebar() {
  const { logout } = useAuth();

  const menuItems = [
    { name: "Dashboard", path: "/", icon: "📊" },
    { name: "Tasks", path: "/tasks", icon: "⚙️" },
    { name: "Notifications", path: "/notifications", icon: "🔔" },
  ];

  return (
    <aside style={styles.sidebar} className="glass-panel">
      <div style={styles.brand}>
        <span style={styles.logo}>⚡</span>
        <h2 style={styles.brandName} className="text-gradient">TaskFlow</h2>
      </div>

      <nav style={styles.nav}>
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            style={({ isActive }) => ({
              ...styles.navLink,
              ...(isActive ? styles.navLinkActive : {}),
            })}
          >
            <span style={styles.icon}>{item.icon}</span>
            {item.name}
          </NavLink>
        ))}
      </nav>

      <button style={styles.logoutBtn} onClick={logout} className="btn btn-secondary">
        🚪 Sign Out
      </button>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: "260px",
    height: "calc(100vh - 40px)",
    position: "fixed",
    top: "20px",
    left: "20px",
    display: "flex",
    flexDirection: "column",
    padding: "24px",
    zIndex: 10,
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "40px",
  },
  logo: {
    fontSize: "28px",
  },
  brandName: {
    fontSize: "22px",
    fontWeight: 800,
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    flexGrow: 1,
  },
  navLink: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    borderRadius: "var(--radius-md)",
    fontSize: "14px",
    fontWeight: 500,
    color: "var(--text-secondary)",
    transition: "all 0.2s ease",
  },
  navLinkActive: {
    background: "rgba(99, 102, 241, 0.15)",
    color: "var(--text-primary)",
    borderLeft: "4px solid var(--color-primary)",
  },
  icon: {
    fontSize: "18px",
  },
  logoutBtn: {
    marginTop: "auto",
    width: "100%",
  },
};
