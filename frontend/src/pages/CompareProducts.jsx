import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "@/api/axiosInstance";
import Navbar from "@/components/ui/navbar.jsx";

const MAX_COMPARE = 3;

function CompareSlot({ product, onRemove, onAdd, allProducts, loading }) {
  const [searchQ, setSearchQ] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const search = async (q) => {
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    try {
      const { data } = await axiosInstance.get("/products", { params: { q, pageSize: 6 } });
      setResults(data.products || []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => search(searchQ), 300);
    return () => clearTimeout(t);
  }, [searchQ]);

  if (product) {
    return (
      <div className="flex-1 min-w-[220px] bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex flex-col">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-40 w-full object-contain rounded mb-3 bg-gray-50 dark:bg-gray-700"
          />
        ) : (
          <div className="h-40 w-full bg-gray-100 dark:bg-gray-700 rounded mb-3 flex items-center justify-center text-gray-400 text-sm">
            No Image
          </div>
        )}
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-2 line-clamp-2">{product.name}</h3>
        <table className="text-xs text-gray-600 dark:text-gray-400 w-full mb-4 mt-auto">
          <tbody>
            <tr><td className="py-0.5 font-medium text-gray-700 dark:text-gray-300 pr-2">Price</td><td className="text-red-600 font-bold">Rs {product.price?.toLocaleString()}</td></tr>
            <tr><td className="py-0.5 font-medium pr-2">Category</td><td>{product.category}</td></tr>
            <tr><td className="py-0.5 font-medium pr-2">Make</td><td>{product.make || "—"}</td></tr>
            <tr><td className="py-0.5 font-medium pr-2">City</td><td>{product.city || "—"}</td></tr>
            <tr><td className="py-0.5 font-medium pr-2">Stock</td><td>{product.stockQuantity ?? "—"}</td></tr>
            <tr><td className="py-0.5 font-medium pr-2">Sale</td><td>{product.sale ? "Yes" : "No"}</td></tr>
            <tr><td className="py-0.5 font-medium pr-2">Free Ship</td><td>{product.freeShipping ? "Yes" : "No"}</td></tr>
          </tbody>
        </table>
        <div className="flex gap-2 mt-auto">
          <Link
            to={`/productdetail/${product.productId}`}
            className="flex-1 text-center text-xs bg-red-600 hover:bg-red-700 text-white py-1.5 rounded font-medium transition"
          >
            View
          </Link>
          <button
            onClick={() => onRemove(product.productId)}
            className="flex-1 text-xs border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 py-1.5 rounded transition"
          >
            Remove
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-[220px] bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex flex-col items-center justify-start">
      <p className="text-gray-400 text-sm mb-3">Add a product to compare</p>
      <input
        value={searchQ}
        onChange={(e) => setSearchQ(e.target.value)}
        placeholder="Search products..."
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 mb-2"
      />
      {searching && <p className="text-xs text-gray-400">Searching...</p>}
      {results.length > 0 && (
        <ul className="w-full space-y-1">
          {results
            .filter((r) => !allProducts.find((p) => p?.productId === r.productId))
            .map((r) => (
              <li key={r.productId}>
                <button
                  onClick={() => { onAdd(r); setSearchQ(""); setResults([]); }}
                  className="w-full text-left px-2 py-1.5 text-xs hover:bg-red-50 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300 transition"
                >
                  {r.name} — Rs {r.price?.toLocaleString()}
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}

export default function CompareProducts() {
  const [slots, setSlots] = useState([null, null, null]);

  const addToSlot = (product) => {
    setSlots((prev) => {
      const emptyIdx = prev.findIndex((s) => s === null);
      if (emptyIdx === -1) return prev;
      const next = [...prev];
      next[emptyIdx] = product;
      return next;
    });
  };

  const removeFromSlot = (productId) => {
    setSlots((prev) => prev.map((s) => (s?.productId === productId ? null : s)));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Compare Products</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          Add up to {MAX_COMPARE} products to compare their details side by side.
        </p>

        <div className="flex flex-wrap gap-4">
          {slots.map((product, idx) => (
            <CompareSlot
              key={idx}
              product={product}
              onRemove={removeFromSlot}
              onAdd={addToSlot}
              allProducts={slots}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
