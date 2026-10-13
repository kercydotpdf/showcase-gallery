const BASE = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

if (!BASE) {
  console.error("VITE_API_URL is missing. Check client/.env or the Vercel project settings.");
}

const TOKEN_KEY = "elms_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

/**
 * Small fetch wrapper. Throws an Error with a human-readable `.message`
 * whenever the server answers with a non-2xx status.
 */
export default async function api(path, { method = "GET", body, signal } = {}) {
  const token = getToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch {
    throw new Error("Cannot reach the server. Is the backend running?");
  }

  let data;
  try {
    const text = await res.text();
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!res.ok) {
    const message = (data && data.message) || `Request failed (${res.status})`;
    const error = new Error(message);
    error.status = res.status;

    if (res.status === 401 && token) {
      clearToken();
      window.location.href = "/login";
    }
    throw error;
  }

  return data;
}
