import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { jwtDecode } from "jwt-decode";
import axiosInstance from "@/api/axiosInstance";

const AuthContext = createContext(null);
const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function readStoredUser(token) {
  if (!token) return null;
  try {
    const d = jwtDecode(token);
    if (d.exp * 1000 < Date.now()) return null;
    return { id: String(d.sub), email: d.email, role: d.role || "user" };
  } catch {
    return null;
  }
}

// Read from localStorage once at module load — avoids useState lazy-init running twice in StrictMode
const _initToken = localStorage.getItem("access_token");
const _initUser  = readStoredUser(_initToken);

export function AuthProvider({ children }) {
  // If token is still valid: start ready immediately (no flash, no loading)
  // If token expired/missing: start loading so we can try silent refresh
  const [token,  setToken]  = useState(_initUser ? _initToken : null);
  const [user,   setUser]   = useState(_initUser);
  const [status, setStatus] = useState(_initUser ? "ready" : "loading");

  const refreshedRef = useRef(false); // guard against StrictMode double-fire

  useEffect(() => {
    // Valid token already set — nothing to do
    if (_initUser) return;

    // Clean up any stale expired token
    if (_initToken) localStorage.removeItem("access_token");

    // Only run once even in React StrictMode
    if (refreshedRef.current) return;
    refreshedRef.current = true;

    fetch(`${API_BASE}/auth/refresh`, {
      method:      "POST",
      credentials: "include",
      headers:     { "Content-Type": "application/json" },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        const newToken = data.access_token;
        const newUser  = readStoredUser(newToken);
        if (newUser) {
          localStorage.setItem("access_token", newToken);
          setToken(newToken);
          setUser(newUser);
        }
      })
      .catch(() => { /* no valid session — user must log in */ })
      .finally(() => setStatus("ready"));
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await axiosInstance.post("/auth/login", { email, password });
    const access   = data.access_token;
    const nextUser = readStoredUser(access);
    localStorage.setItem("access_token", access);
    setToken(access);
    setUser(nextUser);
    return nextUser;
  }, []);

  const register = useCallback(async (payload) => {
    await axiosInstance.post("/auth/register", payload);
  }, []);

  const logout = useCallback(async () => {
    try { await axiosInstance.post("/auth/logout"); } catch { /* ignore */ }
    localStorage.removeItem("access_token");
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      status,
      isAuthenticated: Boolean(token && user),
      isAdmin: user?.role === "admin",
      login,
      register,
      logout,
    }),
    [token, user, status, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
