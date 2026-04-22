// "use client";

// import React from "react";
// import Link from "next/link";

// const ProductCard = ({ product, viewMode }) => {
//   return (
//     <Link key={product.id} href={`/pages/productdetail`}>
//       <div
//         className={`bg-gray-900 border border-gray-400 rounded-lg overflow-hidden shadow-lg ${
//           viewMode === "list" ? "flex items-center space-x-4" : ""
//         }`}
//       >
//         <div className={`w-full h-48 flex justify-center items-center bg-gray-800`}>
//           <img
//             src={product.imageUrl}  // Use the imageUrl passed from backend
//             alt={product.name}
//             className="max-h-full max-w-full object-contain"
//           />
//         </div>
//         <div className="p-4">
//           <h3 className="text-base font-semibold text-gray-100">{product.name}</h3>
//           <div className="flex items-center mt-2">
//             <span className="text-red-600 font-bold text-lg">Rs {product.price}</span>
//             {product.originalPrice > 0 && (
//               <span className="text-gray-400 line-through ml-2">Rs {product.originalPrice}</span>
//             )}
//           </div>
//           <button className="w-full mt-4 bg-red-600 text-gray-100 py-2 rounded-md hover:bg-red-700">
//             Buy
//           </button>
//         </div>
//       </div>
//     </Link>
//   );
// };

// export default ProductCard;
import { Link } from "react-router-dom";
import ProductVisual from "@/components/ui/ProductVisual";

const ProductCard = ({ product, viewMode }) => {
  return (
    <Link to={`/productdetail/${product.productId}`}>
      <div
        className={`bg-gray-900 border border-gray-400 rounded-lg overflow-hidden shadow-lg transition-colors hover:border-red-500 ${
          viewMode === "list" ? "flex items-center space-x-4" : ""
        }`}
      >
        <div className="w-full h-48 bg-gray-800">
          <ProductVisual
            name={product.name}
            make={product.make}
            category={product.category}
            imageUrl={product.imageUrl}
            className="relative h-full w-full overflow-hidden"
            imageClassName="h-full w-full object-contain bg-gray-800 p-4"
          />
        </div>
        <div className="p-4">
          <div className="mb-2 flex flex-wrap gap-2 text-xs uppercase tracking-wide text-gray-400">
            {product.make && <span>{product.make}</span>}
            {product.category && <span>{product.category}</span>}
          </div>
          <h3 className="text-base font-semibold text-gray-100">{product.name}</h3>
          <div className="flex items-center mt-2">
            <span className="text-red-600 font-bold text-lg">Rs {product.price}</span>
            {product.originalPrice > 0 && (
              <span className="text-gray-400 line-through ml-2">Rs {product.originalPrice}</span>
            )}
          </div>
          <button className="w-full mt-4 bg-red-600 text-gray-100 py-2 rounded-md hover:bg-red-700">
            Buy
          </button>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
