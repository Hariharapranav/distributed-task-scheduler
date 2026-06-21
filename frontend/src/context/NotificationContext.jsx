import React, { createContext, useState, useEffect, useContext } from "react";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [ws, setWs] = useState(null);

  useEffect(() => {
    if (!user) {
      if (ws) ws.close();
      return;
    }

    const token = localStorage.getItem("access_token");
    const wsScheme = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${wsScheme}//${window.location.host}/ws/events?token=${token}`;
    
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log("WebSocket Connection Established");
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.event_type) {
          // Add notification to state feed
          setNotifications((prev) => [
            {
              id: Math.random().toString(36).substring(7),
              timestamp: new Date().toISOString(),
              ...data,
            },
            ...prev.slice(0, 49), // Keep last 50
          ]);
        }
      } catch (err) {
        console.error("Failed to parse WebSocket event payload", err);
      }
    };

    socket.onerror = (err) => {
      console.error("WebSocket Connection Error", err);
    };

    socket.onclose = () => {
      console.log("WebSocket Connection Closed");
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, [user]);

  const addToast = (message, type = "success") => {
    setNotifications((prev) => [
      {
        id: Math.random().toString(36).substring(7),
        timestamp: new Date().toISOString(),
        event_type: type,
        message,
      },
      ...prev,
    ]);
  };

  return (
    <NotificationContext.Provider value={{ notifications, ws, addToast }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
