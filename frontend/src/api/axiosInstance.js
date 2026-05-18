import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export const axiosInstance = axios.create({
  baseURL,
  withCredentials: true, // sends the httpOnly refresh_token cookie on every request
  headers: { "Content-Type": "application/json" },
});

// Attach access token to every request
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Shared refresh promise — prevents multiple simultaneous refresh calls
let _refreshPromise = null;

async function silentRefresh() {
  if (_refreshPromise) return _refreshPromise;
  _refreshPromise = axios
    .post(`${baseURL}/auth/refresh`, {}, { withCredentials: true })
    .then(({ data }) => {
      localStorage.setItem("access_token", data.access_token);
      return data.access_token;
    })
    .finally(() => { _refreshPromise = null; });
  return _refreshPromise;
}

// On 401: attempt one silent refresh, then retry the original request
axiosInstance.interceptors.response.use(
  (res) => res,
  async (err) => {
    const url = err.config?.url || "";
    const isAuthEndpoint =
      url.includes("/auth/login") ||
      url.includes("/auth/register") ||
      url.includes("/auth/refresh");

    if (err.response?.status === 401 && !isAuthEndpoint && !err.config._retried) {
      try {
        const newToken = await silentRefresh();
        err.config._retried = true;
        err.config.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(err.config);
      } catch {
        localStorage.removeItem("access_token");
        if (!window.location.pathname.startsWith("/login")) {
          window.location.assign("/login");
        }
      }
    }
    return Promise.reject(err);
  }
);

export default axiosInstance;
