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
