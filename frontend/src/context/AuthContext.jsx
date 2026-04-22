import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { jwtDecode } from "jwt-decode";
import axiosInstance from "@/api/axiosInstance";

const AuthContext = createContext(null);

function readStoredUser(token) {
  if (!token) return null;
  try {
    const d = jwtDecode(token);
    if (d.exp * 1000 < Date.now()) return null;
    return {
      id: String(d.sub),
      email: d.email,
      role: d.role || "user",
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("access_token"));
  const [user, setUser] = useState(() => readStoredUser(localStorage.getItem("access_token")));
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const t = localStorage.getItem("access_token");
    const u = readStoredUser(t);
    if (t && !u) {
      localStorage.removeItem("access_token");
      setToken(null);
      setUser(null);
    } else {
      setToken(t);
      setUser(u);
    }
    setStatus("ready");
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await axiosInstance.post("/auth/login", { email, password });
    const access = data.access_token;
    localStorage.setItem("access_token", access);
    setToken(access);
    setUser(readStoredUser(access));
  }, []);

  const register = useCallback(async (payload) => {
    await axiosInstance.post("/auth/register", payload);
  }, []);

  const logout = useCallback(() => {
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
