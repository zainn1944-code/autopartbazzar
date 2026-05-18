"use client";

import React from "react";

const SORT_OPTIONS = [
  { value: "latest", label: "Latest" },
  { value: "name", label: "Name: A–Z" },
  { value: "priceLow", label: "Price ↑" },
  { value: "priceHigh", label: "Price ↓" },
];

export default function SortingOptions({ sortBy, setSortBy, setViewMode, viewMode }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Sort select */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Sort</span>
        <div className="relative">
          <select
            id="sortBy"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="appearance-none rounded-xl border border-white/8 bg-[#16161d] pl-3 pr-8 py-2 text-sm font-medium text-gray-200 outline-none transition focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500"
            fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>

      {/* View toggle */}
      <div className="flex overflow-hidden rounded-xl border border-white/8 bg-[#16161d]">
        {["list", "grid"].map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold uppercase tracking-widest transition-all duration-200
              ${viewMode === mode
                ? "bg-red-600 text-white shadow-[inset_0_0_12px_rgba(0,0,0,0.2)]"
                : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
          >
            {mode === "list" ? (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            )}
            {mode}
          </button>
        ))}
      </div>
    </div>
  );
}
