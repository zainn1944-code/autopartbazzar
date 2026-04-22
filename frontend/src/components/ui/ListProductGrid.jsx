// "use client";

// import React from "react";
// import ProductCard from '@/components/ui/ListProductCard'; // Correct the import to match the component name

// const ProductGrid = ({ products, viewMode }) => {
//   return (
//     <div
//       className={`grid gap-6 ${
//         viewMode === "grid"
//           ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
//           : "grid-cols-1"
//       }`}
//     >
//       {products.map((product) => (
//         <ProductCard
//           key={product.productId} // Corrected key to `productId`
//           product={product} // Passing entire product object
//           viewMode={viewMode}
//         />
//       ))}
//     </div>
//   );
// };

// export default ProductGrid;
"use client";

import React from "react";
import ProductCard from '@/components/ui/ListProductCard'; // ✅ Corrected import path

const ProductGrid = ({ products, viewMode }) => {
  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-700 bg-gray-900/60 px-6 py-12 text-center text-gray-300">
        No products match the current filters.
      </div>
    );
  }

  return (
    <div
      className={`grid gap-6 ${
        viewMode === "grid"
          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          : "grid-cols-1"
      }`}
    >
      {products.map((product) => (
        <ProductCard key={product.productId} product={product} viewMode={viewMode} />
      ))}
    </div>
  );
};

export default ProductGrid;
