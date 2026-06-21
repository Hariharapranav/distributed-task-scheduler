const API_BASE_URL = "/api";

export async function request(endpoint, options = {}) {
  const token = localStorage.getItem("access_token");
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Attempt Token Refresh
    const refreshToken = localStorage.getItem("refresh_token");
    if (refreshToken) {
      try {
        const refreshResp = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
        if (refreshResp.ok) {
          const data = await refreshResp.json();
          localStorage.setItem("access_token", data.access_token);
          localStorage.setItem("refresh_token", data.refresh_token);
          
          // Re-issue original request with new token
          headers["Authorization"] = `Bearer ${data.access_token}`;
          const retryResp = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
          });
          if (retryResp.ok) return retryResp.json();
        }
      } catch (err) {
        console.error("Token refresh failed", err);
      }
    }
    
    // Clear credentials and force login redirect
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.location.href = "/login";
    throw new Error("Session expired. Please log in again.");
  }

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.detail || "An unexpected error occurred.");
  }

  if (response.status === 24) return null;
  return response.json();
}

export const api = {
  auth: {
    register: (body) => request("/auth/register", { method: "POST", body: JSON.stringify(body) }),
    login: (body) => request("/auth/login", { method: "POST", body: JSON.stringify(body) }),
    me: () => request("/auth/me"),
  },
  tasks: {
    list: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/tasks?${q}`);
    },
    create: (body) => request("/tasks", { method: "POST", body: JSON.stringify(body) }),
    get: (id) => request(`/tasks/${id}`),
    update: (id, body) => request(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    delete: (id) => request(`/tasks/${id}`, { method: "DELETE" }),
    trigger: (id) => request(`/tasks/${id}/trigger`, { method: "POST" }),
  },
  executions: {
    list: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/executions?${q}`);
    },
    get: (id) => request(`/executions/${id}`),
    stats: (days = 7) => request(`/executions/stats?days=${days}`),
  },
  notifications: {
    listRules: () => request("/notifications/rules"),
    createRule: (body) => request("/notifications/rules", { method: "POST", body: JSON.stringify(body) }),
    updateRule: (id, body) => request(`/notifications/rules/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    deleteRule: (id) => request(`/notifications/rules/${id}`, { method: "DELETE" }),
    listLogs: () => request("/notifications/logs"),
  },
};
