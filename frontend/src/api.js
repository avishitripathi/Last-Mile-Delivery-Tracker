const API_BASE = import.meta.env.VITE_API_URL || "";

async function request(path, options = {}) {
  const token = localStorage.getItem("lastmile_token");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  const contentType =
    response.headers.get("content-type") || "";

  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      (data &&
        typeof data === "object" &&
        (data.message || data.error)) ||
      (typeof data === "string" && data) ||
      `Request failed (${response.status})`;

    throw new Error(message);
  }

  return data;
}

export const api = {

  health: () =>
    request("/api/health"),

  login: (body) =>
    request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(body)
    }),

  register: (body) =>
    request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(body)
    }),

  me: () =>
    request("/api/auth/me"),

  zones: () =>
    request("/api/zones"),

  rateCards: () =>
    request("/api/ratecards"),

  agents: () =>
    request("/api/agents"),

  adminSummary: () =>
    request("/api/admin/summary"),

  quote: (body) =>
    request("/api/orders/quote", {
      method: "POST",
      body: JSON.stringify(body)
    }),

  orders: (params = "") =>
    request(
      `/api/orders${params ? `?${params}` : ""}`
    ),

  order: (id) =>
    request(`/api/orders/${id}`),

  createOrder: (body) =>
    request("/api/orders", {
      method: "POST",
      body: JSON.stringify(body)
    }),

  updateOrderStatus: (id, status) =>
    request(`/api/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    }),

  assignOrder: (id, agentId) =>
    request(`/api/orders/${id}/assign`, {
      method: "PATCH",
      body: JSON.stringify({ agentId })
    }),

  reschedule: (id, body) =>
    request(`/api/orders/${id}/reschedule`, {
      method: "POST",
      body: JSON.stringify(body)
    })
};

export function unwrap(data) {
  if (!data) return data;

  return data.data ??
    data.result ??
    data;
}