import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "@/api/axiosInstance";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/ui/navbar.jsx";

export default function UserProfile() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", phone: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    axiosInstance
      .get("/users/me")
      .then(({ data }) => {
        setForm({ name: data.name || "", phone: data.phone || "" });
      })
      .catch(() => setMessage({ type: "error", text: "Failed to load profile" }))
      .finally(() => setLoading(false));
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await axiosInstance.put("/users/me", {
        name: form.name || null,
        phone: form.phone || null,
      });
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.detail || "Update failed" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">My Profile</h1>

        {loading ? (
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input
                value={user?.email || ""}
                disabled
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Enter your full name"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="Enter your phone number"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            {message && (
              <p className={`text-sm font-medium ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>
                {message.text}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
