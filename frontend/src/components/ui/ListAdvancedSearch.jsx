"use client";

import React from "react";

export default function AdvancedSearch({
  filters,
  setFilters,
  availableFilters = { categories: [], makes: [], cities: [] },
  onReset,
  isSearching = false,
}) {
  const dynamicHeading = filters.keyword
    ? `Results for: "${filters.keyword}"`
    : "Filter Parts";

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
            ? value.replace(/[^\d.]/g, "")
            : value,
    }));
  };

  const inputClass =
    "w-full rounded-xl border border-white/8 bg-[#16161d] px-3 py-2.5 text-sm text-gray-100 placeholder-gray-600 outline-none transition focus:border-red-500/60 focus:ring-1 focus:ring-red-500/40";

  const selectClass =
    "w-full rounded-xl border border-white/8 bg-[#16161d] px-3 py-2.5 text-sm text-gray-100 outline-none transition focus:border-red-500/60 focus:ring-1 focus:ring-red-500/40 appearance-none";

  const labelClass = "mb-1.5 block text-xs font-bold uppercase tracking-widest text-gray-500";

  return (
    <div className="w-full rounded-2xl border border-white/8 bg-[#0f0f14] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.5)] lg:sticky lg:top-24">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between gap-4 border-b border-white/6 pb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-0.5">Catalog</p>
          <h2 className="text-base font-bold text-gray-100">{dynamicHeading}</h2>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400 transition hover:bg-red-600 hover:border-red-600 hover:text-white"
        >
          Reset
        </button>
      </div>

      {/* Keyword */}
      <div className="mb-4">
        <label className={labelClass}>Search</label>
        <div className="relative">
          {/* Search icon or spinner */}
          {isSearching ? (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5">
              <svg className="animate-spin text-red-500 w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            </span>
          ) : (
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
            </svg>
          )}
          <input
            type="text"
            name="keyword"
            value={filters.keyword}
            onChange={handleChange}
            placeholder="e.g. Honda, lights, tyres…"
            className={`${inputClass} pl-9`}
            autoComplete="off"
          />
          {/* Subtle right-side clear button when keyword is set */}
          {filters.keyword && (
            <button
              type="button"
              onClick={() => setFilters((prev) => ({ ...prev, keyword: "" }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-400 transition"
              aria-label="Clear search"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Toggles */}
      <div className="mb-4 grid grid-cols-2 gap-2">
        {[
          { name: "sale", label: "On Sale" },
          { name: "freeShipping", label: "Free Ship" },
        ].map(({ name, label }) => (
          <label
            key={name}
            className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all
              ${filters[name]
                ? "border-red-500/60 bg-red-600/15 text-red-400"
                : "border-white/8 bg-[#16161d] text-gray-400 hover:border-white/20"
              }`}
          >
            <input
              type="checkbox"
              name={name}
              checked={filters[name]}
              onChange={handleChange}
              className="sr-only"
            />
            <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px]
              ${filters[name] ? "border-red-500 bg-red-600 text-white" : "border-white/20 text-transparent"}`}>
              ✓
            </span>
            {label}
          </label>
        ))}
      </div>

      {/* Category */}
      <div className="mb-4">
        <label className={labelClass}>Category</label>
        <div className="relative">
          <select name="category" value={filters.category} onChange={handleChange} className={selectClass}>
            <option value="">All Categories</option>
            {availableFilters.categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>

      {/* Price Range */}
      <div className="mb-4">
        <label className={labelClass}>Price Range (Rs)</label>
        <div className="flex gap-2">
          <input type="number" name="minPrice" value={filters.minPrice} onChange={handleChange}
            placeholder="Min" className={inputClass} />
          <input type="number" name="maxPrice" value={filters.maxPrice} onChange={handleChange}
            placeholder="Max" className={inputClass} />
        </div>
      </div>

      {/* Make */}
      <div className="mb-4">
        <label className={labelClass}>Make</label>
        <div className="relative">
          <select name="make" value={filters.make} onChange={handleChange} className={selectClass}>
            <option value="">All Makes</option>
            {availableFilters.makes.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>

      {/* City */}
      <div className="mb-1">
        <label className={labelClass}>City</label>
        <div className="relative">
          <select name="city" value={filters.city} onChange={handleChange} className={selectClass}>
            <option value="">All Cities</option>
            {availableFilters.cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>
    </div>
  );
}
