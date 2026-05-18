"use client";

import React from "react";
import ProductCard from "@/components/ui/ListProductCard";

const ProductGrid = ({
  products,
  viewMode,
  emptyMessage = "No products match the current filters.",
  isSearching = false,
}) => {
  if (products.length === 0 && !isSearching) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center">
        <svg className="mb-4 w-10 h-10 text-gray-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
        </svg>
        <p className="text-sm font-medium text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`transition-opacity duration-200 ${isSearching ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
      <div
        className={`grid gap-5 ${
          viewMode === "grid"
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            : "grid-cols-1"
        }`}
      >
        {products.map((product) => (
          <ProductCard key={product.productId} product={product} viewMode={viewMode} />
        ))}
      </div>
    </div>
  );
};

export default ProductGrid;
