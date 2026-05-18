import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "@/api/axiosInstance";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/ui/navbar.jsx";

export default function AdminUsers() {
  const { isAdmin, user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!isAdmin) { navigate("/home"); return; }
    fetchUsers();
  }, [isAdmin, navigate]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get("/admin/users");
      setUsers(data.users || []);
    } catch {
      // handled silently
    } finally {
      setLoading(false);
    }
  };

  const handleBan = async (userId, shouldBan) => {
    setActioning(userId);
    try {
      const endpoint = shouldBan ? `/admin/users/${userId}/ban` : `/admin/users/${userId}/unban`;
      await axiosInstance.post(endpoint);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_banned: shouldBan } : u))
      );
    } catch (err) {
      alert(err.response?.data?.detail || "Action failed");
    } finally {
      setActioning(null);
    }
  };

  const filtered = users.filter((u) =>
    search
      ? u.email.toLowerCase().includes(search.toLowerCase()) ||
        (u.name || "").toLowerCase().includes(search.toLowerCase())
      : true
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">User Management</h1>

        <div className="flex flex-wrap gap-3 mb-6">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 w-72"
          />
          <span className="text-sm text-gray-500 dark:text-gray-400 self-center">
            {filtered.length} users
          </span>
        </div>

        {loading ? (
          <p className="text-gray-500 dark:text-gray-400">Loading users...</p>
        ) : (
          <div className="overflow-x-auto rounded-xl shadow">
            <table className="w-full text-sm bg-white dark:bg-gray-800">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-left">
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr
                    key={u.id}
                    className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750"
                  >
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 font-mono">{u.id}</td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white">{u.name || "—"}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{u.email}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{u.phone}</td>
                    <td className="px-4 py-3">
                      {u.is_banned ? (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                          Banned
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {u.id === currentUser?.id ? (
                        <span className="text-xs text-gray-400 italic">You</span>
                      ) : (
                        <button
                          onClick={() => handleBan(u.id, !u.is_banned)}
                          disabled={actioning === u.id}
                          className={`px-3 py-1 rounded text-xs font-semibold transition disabled:opacity-50 ${
                            u.is_banned
                              ? "bg-green-600 hover:bg-green-700 text-white"
                              : "bg-red-600 hover:bg-red-700 text-white"
                          }`}
                        >
                          {actioning === u.id ? "..." : u.is_banned ? "Unban" : "Ban"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
