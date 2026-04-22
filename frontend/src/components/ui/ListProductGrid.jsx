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
