import { useCallback, useEffect, useState } from "react";
import axiosInstance from "@/api/axiosInstance";

/**
 * Persists 3D configurator builds to /builds on the backend. Auth-required —
 * all endpoints return 401 when not logged in. We swallow auth errors silently
 * so the caller can choose to show a login CTA instead of an error toast.
 */
export function useSavedBuilds() {
  const [builds, setBuilds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unauthorized, setUnauthorized] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axiosInstance.get("/builds");
      setBuilds(data || []);
      setUnauthorized(false);
    } catch (err) {
      if (err?.response?.status === 401) {
        setUnauthorized(true);
        setBuilds([]);
      } else {
        setError(err?.response?.data?.detail || err?.message || "Failed to load builds");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const saveBuild = useCallback(async (payload) => {
    setError(null);
    try {
      const { data } = await axiosInstance.post("/builds", payload);
      setBuilds(prev => [data, ...prev]);
      return data;
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || "Failed to save build";
      setError(msg);
      throw new Error(msg);
    }
  }, []);

  const deleteBuild = useCallback(async (id) => {
    setError(null);
    try {
      await axiosInstance.delete(`/builds/${id}`);
      setBuilds(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || "Failed to delete build";
      setError(msg);
      throw new Error(msg);
    }
  }, []);

  return { builds, loading, error, unauthorized, refresh, saveBuild, deleteBuild };
}
