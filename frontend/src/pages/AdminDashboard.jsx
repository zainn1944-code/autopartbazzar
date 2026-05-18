import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import axiosInstance from "@/api/axiosInstance";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

const chartOptions = {
  responsive: true,
  plugins: {
    legend: {
      labels: {
        color: "#e5e7eb",
      },
    },
  },
  scales: {
    x: {
      ticks: {
        color: "#d1d5db",
      },
      grid: {
        color: "rgba(255,255,255,0.08)",
      },
    },
    y: {
      beginAtZero: true,
      ticks: {
        color: "#d1d5db",
        precision: 0,
      },
      grid: {
        color: "rgba(255,255,255,0.08)",
      },
    },
  },
};

const buildChartData = (labels, values, label, borderColor, backgroundColor) => ({
  labels: labels.length > 0 ? labels : ["No products"],
  datasets: [
    {
      label,
      data: values.length > 0 ? values : [0],
      borderColor,
      backgroundColor,
      pointBackgroundColor: borderColor,
      tension: 0.35,
      fill: true,
    },
  ],
});

function LiveSyncPanel() {
  const [syncStatus, setSyncStatus] = useState(null);
  const [triggering, setTriggering] = useState(false);
  const [pollTimer, setPollTimer] = useState(null);

  const fetchStatus = async () => {
    try {
      const { data } = await axiosInstance.get("/admin/sync/status");
      setSyncStatus(data);
      return data;
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleTrigger = async () => {
    setTriggering(true);
    setSyncStatus((prev) => ({ ...prev, status: "running", triggeredBy: "admin-manual" }));
    try {
      const { data } = await axiosInstance.post("/admin/sync/trigger");
      setSyncStatus(data);
    } catch (err) {
      setSyncStatus((prev) => ({
        ...prev,
        status: "error",
        errors: [err?.response?.data?.detail || "Trigger failed"],
      }));
    } finally {
      setTriggering(false);
    }
  };

  useEffect(() => {
    if (syncStatus?.status === "running") {
      const id = setTimeout(() => fetchStatus(), 3000);
      setPollTimer(id);
    } else if (pollTimer) {
      clearTimeout(pollTimer);
      setPollTimer(null);
    }
  }, [syncStatus?.status]);

  const statusColor = {
    idle: "text-gray-400",
    running: "text-yellow-400",
    completed: "text-green-400",
    completed_with_errors: "text-orange-400",
    skipped: "text-gray-500",
    error: "text-red-400",
  };

  const statusBg = {
    idle: "border-gray-700 bg-gray-800/40",
    running: "border-yellow-500/30 bg-yellow-500/10",
    completed: "border-green-500/30 bg-green-500/10",
    completed_with_errors: "border-orange-500/30 bg-orange-500/10",
    skipped: "border-gray-700 bg-gray-800/40",
    error: "border-red-500/30 bg-red-500/10",
  };

  const status = syncStatus?.status || "idle";

  return (
    <div id="sync-panel" className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Live Parts Sync</h2>
          <p className="text-xs text-gray-400 mt-0.5">Roz raat 1 AM ko auto-fetch hoti hai</p>
        </div>
        <button
          onClick={handleTrigger}
          disabled={triggering || status === "running"}
          className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {triggering || status === "running" ? "Syncing..." : "Trigger Now"}
        </button>
      </div>

      <div className={`rounded-xl border p-4 ${statusBg[status] || statusBg.idle}`}>
        <div className="flex items-center gap-2 mb-3">
          {(status === "running") && (
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-yellow-400" />
          )}
          <span className={`text-sm font-semibold uppercase tracking-widest ${statusColor[status] || "text-gray-400"}`}>
            {status.replace(/_/g, " ")}
          </span>
          {syncStatus?.syncedAt && (
            <span className="ml-auto text-xs text-gray-500">
              {new Date(syncStatus.syncedAt).toLocaleString()}
            </span>
          )}
        </div>

        {syncStatus && status !== "idle" && (
          <div className="grid grid-cols-3 gap-3 mb-3">
            {[
              { label: "Created", value: syncStatus.created ?? 0, color: "text-green-400" },
              { label: "Updated", value: syncStatus.updated ?? 0, color: "text-blue-400" },
              { label: "Skipped", value: syncStatus.skipped ?? 0, color: "text-gray-400" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-lg bg-black/20 px-3 py-2 text-center">
                <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {syncStatus?.feeds?.length > 0 && (
          <div className="space-y-1.5">
            {syncStatus.feeds.map((feed, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-black/20 px-3 py-2 text-xs">
                <span className="text-gray-300 font-medium truncate max-w-[60%]">{feed.name}</span>
                <div className="flex gap-2 text-gray-500 shrink-0">
                  <span className="text-green-400">+{feed.created}</span>
                  <span className="text-blue-400">~{feed.updated}</span>
                  {feed.error && <span className="text-red-400">ERR</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {syncStatus?.errors?.length > 0 && (
          <div className="mt-3 space-y-1">
            {syncStatus.errors.map((err, i) => (
              <p key={i} className="text-xs text-red-400">{err}</p>
            ))}
          </div>
        )}

        {(!syncStatus || status === "idle") && (
          <p className="text-xs text-gray-500">Abhi tak koi sync nahi hua. "Trigger Now" dabao.</p>
        )}
      </div>

      <p className="mt-3 text-[11px] text-gray-600">
        Scheduled: Daily at 01:00 AM &bull; Feed: dummyjson.com/products/category/automotive
      </p>
    </div>
  );
}

export default function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await axiosInstance.get("/products");
        setProducts(data.products || []);
      } catch (requestError) {
        setError(requestError.response?.data?.detail || "Failed to load inventory.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const categoryCounts = {};
  const cityCounts = {};
  const uniqueMakes = new Set();
  let saleCount = 0;
  let freeShippingCount = 0;
  let inventoryValue = 0;

  for (const product of products) {
    const category = product.category || "Uncategorized";
    const city = product.city || "Unassigned";

    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    cityCounts[city] = (cityCounts[city] || 0) + 1;

    if (product.make) {
      uniqueMakes.add(product.make);
    }
    if (product.sale) {
      saleCount += 1;
    }
    if (product.freeShipping) {
      freeShippingCount += 1;
    }
    inventoryValue += Number(product.price || 0);
  }

  const categoryLabels = Object.keys(categoryCounts).sort();
  const cityLabels = Object.keys(cityCounts).sort();
  const recentProducts = [...products].sort((left, right) => right.id - left.id).slice(0, 6);
  const categorySummary = categoryLabels.map((label) => ({
    label,
    count: categoryCounts[label],
  }));

  const summaryCards = [
    {
      icon: "fas fa-boxes-stacked",
      label: "Total Products",
      value: products.length,
    },
    {
      icon: "fas fa-tags",
      label: "Sale Items",
      value: saleCount,
    },
    {
      icon: "fas fa-truck-fast",
      label: "Free Shipping",
      value: freeShippingCount,
    },
    {
      icon: "fas fa-warehouse",
      label: "Inventory Value",
      value: `Rs ${inventoryValue.toLocaleString()}`,
    },
  ];

  const categoryChartData = buildChartData(
    categoryLabels,
    categoryLabels.map((label) => categoryCounts[label]),
    "Products by category",
    "rgba(239, 68, 68, 1)",
    "rgba(239, 68, 68, 0.22)"
  );

  const cityChartData = buildChartData(
    cityLabels,
    cityLabels.map((label) => cityCounts[label]),
    "Products by city",
    "rgba(56, 189, 248, 1)",
    "rgba(56, 189, 248, 0.22)"
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black px-4 text-center text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-black">
      <aside className="hidden h-screen w-64 shrink-0 border-r border-gray-800 bg-gray-950 text-white lg:block">
        <div className="p-6">
          <h3 className="text-2xl font-bold text-red-500">Autopart Bazaar</h3>
          <p className="mt-2 text-sm text-gray-400">Live inventory admin</p>
        </div>
        <nav className="px-4 pb-6">
          <ul className="space-y-2">
            <li>
              <Link
                to="/addproduct"
                className="block rounded-lg px-4 py-3 text-gray-300 transition-colors hover:bg-black hover:text-red-500"
              >
                Add product
              </Link>
            </li>
            <li>
              <Link
                to="/removeproduct"
                className="block rounded-lg px-4 py-3 text-gray-300 transition-colors hover:bg-black hover:text-red-500"
              >
                Remove product
              </Link>
            </li>
            <li>
              <Link
                to="/updateproduct"
                className="block rounded-lg px-4 py-3 text-gray-300 transition-colors hover:bg-black hover:text-red-500"
              >
                Update product
              </Link>
            </li>
            <li>
              <Link
                to="/admin/bulk-upload"
                className="block rounded-lg px-4 py-3 text-gray-300 transition-colors hover:bg-black hover:text-red-500"
              >
                Bulk Upload (CSV)
              </Link>
            </li>
            <li>
              <Link
                to="/admin/orders"
                className="block rounded-lg px-4 py-3 text-gray-300 transition-colors hover:bg-black hover:text-red-500"
              >
                Manage Orders
              </Link>
            </li>
            <li>
              <Link
                to="/admin/users"
                className="block rounded-lg px-4 py-3 text-gray-300 transition-colors hover:bg-black hover:text-red-500"
              >
                Manage Users
              </Link>
            </li>
            <li>
              <a
                href="#sync"
                className="block rounded-lg px-4 py-3 text-gray-300 transition-colors hover:bg-black hover:text-red-500"
                onClick={() => document.getElementById("sync-panel")?.scrollIntoView({ behavior: "smooth" })}
              >
                Live Parts Sync
              </a>
            </li>
          </ul>
        </nav>
      </aside>

      <div className="flex-1">
        <header className="border-b border-gray-800 bg-gray-950 px-6 py-5 text-white">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-red-500">Dashboard</h1>
              <p className="mt-1 text-sm text-gray-400">
                Inventory snapshot pulled live from `/products`.
              </p>
            </div>
            <div className="text-sm text-gray-400">
              Unique makes: <span className="text-white">{uniqueMakes.size}</span>
            </div>
          </div>
        </header>

        <main className="space-y-6 p-6">
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
            Revenue, returns, and delivery analytics are intentionally omitted until the backend exposes real endpoints for them.
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => (
              <div key={card.label} className="rounded-2xl border border-gray-800 bg-gray-900 p-5 shadow">
                <div className="flex items-center space-x-4">
                  <i className={`${card.icon} text-2xl text-red-500`}></i>
                  <div>
                    <p className="text-sm text-gray-400">{card.label}</p>
                    <p className="text-xl font-semibold text-white">{card.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
              <h2 className="mb-4 text-lg font-semibold text-white">Category Mix</h2>
              <Line data={categoryChartData} options={chartOptions} />
            </div>
            <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
              <h2 className="mb-4 text-lg font-semibold text-white">City Distribution</h2>
              <Line data={cityChartData} options={chartOptions} />
            </div>
          </div>

          <LiveSyncPanel />

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
            <div className="rounded-2xl border border-gray-800 bg-gray-900">
              <div className="flex items-center justify-between border-b border-gray-800 px-5 py-4">
                <h2 className="text-lg font-semibold text-white">Recent Products</h2>
                <span className="text-sm text-gray-400">{products.length} total</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-950 text-sm text-gray-400">
                    <tr>
                      <th className="px-5 py-3">Product ID</th>
                      <th className="px-5 py-3">Name</th>
                      <th className="px-5 py-3">Category</th>
                      <th className="px-5 py-3">City</th>
                      <th className="px-5 py-3">Price</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-white">
                    {recentProducts.length === 0 && (
                      <tr>
                        <td colSpan="5" className="px-5 py-6 text-center text-gray-400">
                          No products have been added yet.
                        </td>
                      </tr>
                    )}
                    {recentProducts.map((product) => (
                      <tr key={product.id} className="border-t border-gray-800">
                        <td className="px-5 py-3">{product.productId}</td>
                        <td className="px-5 py-3">{product.name}</td>
                        <td className="px-5 py-3">{product.category || "-"}</td>
                        <td className="px-5 py-3">{product.city || "-"}</td>
                        <td className="px-5 py-3">Rs {product.price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-800 bg-gray-900">
              <div className="border-b border-gray-800 px-5 py-4">
                <h2 className="text-lg font-semibold text-white">Category Summary</h2>
              </div>
              <div className="divide-y divide-gray-800">
                {categorySummary.length === 0 && (
                  <div className="px-5 py-6 text-sm text-gray-400">
                    No category data yet.
                  </div>
                )}
                {categorySummary.map((item) => (
                  <div key={item.label} className="flex items-center justify-between px-5 py-4">
                    <div>
                      <p className="text-sm font-medium text-white">{item.label}</p>
                      <p className="text-xs text-gray-400">Live product count</p>
                    </div>
                    <span className="rounded-full bg-red-500/15 px-3 py-1 text-sm text-red-300">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
