import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "@/api/axiosInstance";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/ui/navbar.jsx";

const STATUS_OPTIONS = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

const STATUS_COLORS = {
  Pending: "bg-yellow-100 text-yellow-800",
  Processing: "bg-blue-100 text-blue-800",
  Shipped: "bg-purple-100 text-purple-800",
  Delivered: "bg-green-100 text-green-800",
  Cancelled: "bg-red-100 text-red-800",
};

export default function AdminOrders() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!isAdmin) { navigate("/home"); return; }
    fetchOrders();
  }, [isAdmin, navigate]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get("/orders/all");
      setOrders(data.orders || []);
    } catch {
      // handled silently
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, status) => {
    setUpdating(orderId);
    try {
      await axiosInstance.patch(`/orders/${orderId}/status`, { status });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update status");
    } finally {
      setUpdating(null);
    }
  };

  const filtered = orders.filter((o) => {
    const matchStatus = filterStatus ? o.status === filterStatus : true;
    const matchSearch = search
      ? o.id.toString().includes(search) ||
        o.user?.email?.toLowerCase().includes(search.toLowerCase())
      : true;
    return matchStatus && matchSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Order Management</h1>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order ID or email..."
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 w-64"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <span className="text-sm text-gray-500 dark:text-gray-400 self-center">
            {filtered.length} orders
          </span>
        </div>

        {loading ? (
          <p className="text-gray-500 dark:text-gray-400">Loading orders...</p>
        ) : filtered.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No orders found.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl shadow">
            <table className="w-full text-sm bg-white dark:bg-gray-800">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-left">
                  <th className="px-4 py-3">Order #</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Update Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr
                    key={order.id}
                    className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750"
                  >
                    <td className="px-4 py-3 font-mono font-semibold text-gray-900 dark:text-white">
                      #{order.id}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      <div>{order.user?.name || "—"}</div>
                      <div className="text-xs text-gray-400">{order.user?.email}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {order.items?.length || 0} item(s)
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                      Rs {order.totalAmount?.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-700"}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                        disabled={updating === order.id}
                        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
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
