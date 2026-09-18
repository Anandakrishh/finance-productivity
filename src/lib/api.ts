export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  currency?: string;
}

const TOKEN_KEY = "pulse_auth_token";
const USER_KEY = "pulse_auth_user";

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || "";

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Ignore storage quota errors
  }
}

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: AuthUser | null) {
  try {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  } catch {
    // Ignore storage quota errors
  }
}

export async function apiRequest<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const url = `${API_BASE}${path}`;
  const res = await fetch(url, { ...options, headers });

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const message = (isJson && data?.error) || res.statusText || "Request failed";
    throw new Error(message);
  }

  return data as T;
}

export const api = {
  auth: {
    async register(email: string, password: string, displayName?: string) {
      const data = await apiRequest<{ token: string; user: AuthUser }>(
        "/api/auth/register",
        {
          method: "POST",
          body: JSON.stringify({ email, password, displayName }),
        }
      );
      setStoredToken(data.token);
      setStoredUser(data.user);
      return data;
    },

    async createUser(email: string, password: string, displayName?: string) {
      return await apiRequest<{ ok: boolean; user: AuthUser }>(
        "/api/auth/create-user",
        {
          method: "POST",
          body: JSON.stringify({ email, password, displayName }),
        }
      );
    },

    async login(email: string, password: string) {
      const data = await apiRequest<{ token: string; user: AuthUser }>(
        "/api/auth/login",
        {
          method: "POST",
          body: JSON.stringify({ email, password }),
        }
      );
      setStoredToken(data.token);
      setStoredUser(data.user);
      return data;
    },

    async getMe() {
      const data = await apiRequest<{ user: AuthUser }>("/api/auth/me");
      setStoredUser(data.user);
      return data.user;
    },

    async resetPassword(email: string) {
      return await apiRequest<{ message: string }>("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    },

    logout() {
      setStoredToken(null);
      setStoredUser(null);
    },
  },

  data: {
    async getAll() {
      return await apiRequest<{
        tasks: any[];
        goals: any[];
        habits: any[];
        transactions: any[];
        assets: any[];
        liabilities: any[];
        budgets: any[];
        savingsGoals: any[];
        investments: any[];
        calendarEvents: any[];
        emis: any[];
      }>("/api/data");
    },

    async replaceTable(table: string, rows: Record<string, unknown>[]) {
      return await apiRequest<{ ok: boolean; count: number }>(
        `/api/data/${table}`,
        {
          method: "PUT",
          body: JSON.stringify({ rows }),
        }
      );
    },
  },
};
