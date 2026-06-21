const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

export function getAuthToken() {
  return localStorage.getItem("access_token");
}

export function setAuthTokens(access: string, refresh: string) {
  localStorage.setItem("access_token", access);
  localStorage.setItem("refresh_token", refresh);
}

export function clearAuthTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

let refreshPromise: Promise<string | null> | null = null;

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    // Never send stale tokens to auth endpoints — prevents 401 loops
    const isPublicAuthEndpoint =
      endpoint.startsWith("/auth/login") ||
      endpoint.startsWith("/auth/register") ||
      (endpoint.startsWith("/auth/github/") && !endpoint.includes("connect")) ||
      endpoint.startsWith("/auth/google") ||
      endpoint === "/auth/github" ||
      endpoint === "/auth/send-otp/" ||
      endpoint === "/auth/verify-otp/";
    if (!isPublicAuthEndpoint) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  // Automatically set Content-Type to JSON if body is provided and not FormData
  if (options.body && !(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  let response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle 401 Unauthorized (token might be expired or missing)
  if (response.status === 401 && !endpoint.includes("/auth/")) {
    const refresh = localStorage.getItem("refresh_token");
    if (refresh) {
      if (!refreshPromise) {
        refreshPromise = fetch(`${API_BASE}/auth/refresh/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh }),
        })
          .then(async (refreshResponse) => {
            if (refreshResponse.ok) {
              const data = await refreshResponse.json();
              setAuthTokens(data.access, refresh);
              return data.access;
            } else {
              clearAuthTokens();
              window.location.href = "/login";
              return null;
            }
          })
          .catch(() => {
            clearAuthTokens();
            window.location.href = "/login";
            return null;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      const newAccess = await refreshPromise;
      if (newAccess) {
        // Retry original request
        headers["Authorization"] = `Bearer ${newAccess}`;
        response = await fetch(`${API_BASE}${endpoint}`, {
          ...options,
          headers,
        });
      }
    } else {
      clearAuthTokens();
      window.location.href = "/login";
    }
  }

  // Gamification hook: dispatch event on successful meaningful actions
  if (
    response.ok &&
    options.method &&
    ["POST", "PATCH", "PUT"].includes(options.method.toUpperCase()) &&
    !endpoint.includes("/auth/") &&
    !endpoint.includes("/chat/")
  ) {
    // Small delay to ensure any specific XP toast (e.g. daily login) shows first,
    // though the system handles multiple toasts gracefully.
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("growthos_action_performed"));
    }, 500);
  }

  return response;
}

export class APIError extends Error {
  status: number;
  response: any;
  constructor(message: string, status: number, response: any) {
    super(message);
    this.status = status;
    this.response = response;
    this.name = "APIError";
  }
}

async function handleResponse(res: Response) {
  if (!res.ok) {
    let errorData = null;
    try {
      errorData = await res.json();
    } catch (e) {
      // Not JSON
    }
    const message = errorData?.detail || errorData?.error || `Request failed: ${res.status}`;
    throw new APIError(message, res.status, { data: errorData });
  }

  // 204 No Content
  if (res.status === 204) return { data: null };

  const data = await res.json();
  return { data };
}

// Axios-like wrapper for compatibility with custom-paths components
export const apiClient = {
  async get(url: string) {
    const endpoint = url.replace(/^\/api/, "");
    const res = await apiFetch(endpoint);
    return handleResponse(res);
  },
  async post(url: string, body?: any) {
    const endpoint = url.replace(/^\/api/, "");
    const res = await apiFetch(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse(res);
  },
  async patch(url: string, body?: any) {
    const endpoint = url.replace(/^\/api/, "");
    const res = await apiFetch(endpoint, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse(res);
  },
  async delete(url: string) {
    const endpoint = url.replace(/^\/api/, "");
    const res = await apiFetch(endpoint, { method: "DELETE" });
    return handleResponse(res);
  },
};
