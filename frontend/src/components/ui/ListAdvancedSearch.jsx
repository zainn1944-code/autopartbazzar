"use client";

import React, { useEffect, useState } from "react";

const AdvancedSearch = ({ filters, setFilters, products = [] }) => {
  const [dynamicHeading, setDynamicHeading] = useState("Show Results By:");
  const categories = [...new Set(products.map((product) => product.category).filter(Boolean))].sort();
  const makes = [...new Set(products.map((product) => product.make).filter(Boolean))].sort();
  const cities = [...new Set(products.map((product) => product.city).filter(Boolean))].sort();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Update the heading dynamically based on the keyword input
  useEffect(() => {
    if (filters.keyword) {
      setDynamicHeading(`Showing results for: "${filters.keyword}"`);
    } else {
      setDynamicHeading("Show Results By:");
    }
  }, [filters.keyword]);

  return (
    <div className="w-full rounded-2xl border border-gray-800 bg-[#0a0a0a] p-4 text-gray-400 shadow-[0_20px_60px_rgba(0,0,0,0.35)] lg:sticky lg:top-24">
      <h2 className="text-lg font-bold text-gray-100 mb-6">{dynamicHeading}</h2>

      {/* Search by Keyword */}
      <div className="mb-4">
        <label className="block font-medium text-gray-100 mb-2">Search by Keyword</label>
        <input
          type="text"
          name="keyword"
          value={filters.keyword}
          onChange={handleChange}
          placeholder="e.g. lights, tyres, etc."
          className="w-full border border-gray-400 bg-gray-900 text-gray-100 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      {/* Discounted Products */}
      <div className="mb-4">
        <label className="block font-medium text-gray-100">
          <input
            type="checkbox"
            name="sale"
            checked={filters.sale}
            onChange={handleChange}
            className="mr-2"
          />
          Discounted Products
        </label>
      </div>

      {/* Free Shipping */}
      <div className="mb-4">
        <label className="block font-medium text-gray-100">
          <input
            type="checkbox"
            name="freeShipping"
            checked={filters.freeShipping}
            onChange={handleChange}
            className="mr-2"
          />
          Free Shipping
        </label>
      </div>

      {/* Category */}
      <div className="mb-4">
        <label className="block font-medium text-gray-100 mb-2">Category</label>
        <select
          name="category"
          value={filters.category}
          onChange={handleChange}
          className="w-full border border-gray-400 bg-gray-900 text-gray-100 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="">All</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {/* Price Range */}
      <div className="mb-4">
        <label className="block font-medium text-gray-100 mb-2">Price Range</label>
        <div className="flex space-x-2">
          <input
            type="number"
            name="minPrice"
            value={filters.minPrice}
            onChange={handleChange}
            placeholder="Min"
            className="w-1/2 border border-gray-400 bg-gray-900 text-gray-100 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <input
            type="number"
            name="maxPrice"
            value={filters.maxPrice}
            onChange={handleChange}
            placeholder="Max"
            className="w-1/2 border border-gray-400 bg-gray-900 text-gray-100 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
      </div>

      {/* Make */}
      <div className="mb-4">
        <label className="block font-medium text-gray-100 mb-2">Make</label>
        <select
          name="make"
          value={filters.make}
          onChange={handleChange}
          className="w-full border border-gray-400 bg-gray-900 text-gray-100 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="">All</option>
          {makes.map((make) => (
            <option key={make} value={make}>
              {make}
            </option>
          ))}
        </select>
      </div>

      {/* City */}
      <div className="mb-4">
        <label className="block font-medium text-gray-100 mb-2">City</label>
        <select
          name="city"
          value={filters.city}
          onChange={handleChange}
          className="w-full border border-gray-400 bg-gray-900 text-gray-100 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="">All</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default AdvancedSearch;
