"use client";

import React from "react";

const SortingOptions = ({ sortBy, setSortBy, setViewMode, viewMode }) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-2">
        <label htmlFor="sortBy" className="text-gray-100">
          Sort By:
        </label>
        <select
          id="sortBy"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="border border-gray-400 bg-gray-900 text-gray-100 rounded px-3 py-1"
        >
          <option value="priceLow">Price: Low to High</option>
          <option value="priceHigh">Price: High to Low</option>
        </select>
      </div>
      <div className="flex items-center space-x-4 text-white">
        <button
          className={`p-2 ${viewMode === "list" ? "bg-red-600" : "bg-gray-900"} rounded`}
          onClick={() => setViewMode("list")}
        >
          LIST
        </button>
        <button
          className={`p-2 ${viewMode === "grid" ? "bg-red-600" : "bg-gray-900"} rounded`}
          onClick={() => setViewMode("grid")}
        >
          GRID
        </button>
      </div>
    </div>
  );
};

export default SortingOptions;
