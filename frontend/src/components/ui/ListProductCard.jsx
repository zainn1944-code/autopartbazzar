import { Link } from "react-router-dom";
import ProductVisual from "@/components/ui/ProductVisual";

const ProductCard = ({ product, viewMode }) => {
  return (
    <Link to={`/productdetail/${product.productId}`} className="group block h-full">
      <div
        className={`relative overflow-hidden rounded-3xl border border-white/5 bg-[#0a0a0a] shadow-lg transition-all duration-500 hover:border-red-500/50 hover:bg-[#111] hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(239,68,68,0.15)] ${
          viewMode === "list" ? "flex flex-col sm:flex-row" : "flex flex-col h-full"
        }`}
      >
        <div className={`relative ${viewMode === "list" ? "sm:w-72 shrink-0" : "w-full"} h-56 bg-black/40 overflow-hidden`}>
          {/* Subtle background glow effect on hover */}
          <div className="absolute inset-0 bg-gradient-to-tr from-red-600/0 to-transparent transition-colors duration-500 group-hover:from-red-600/10 z-0" />
          
          <ProductVisual
            name={product.name}
            make={product.make}
            category={product.category}
            imageUrl={product.imageUrl}
            className="relative z-10 h-full w-full"
            imageClassName="h-full w-full object-contain p-6 transition-transform duration-700 ease-out group-hover:scale-110 drop-shadow-2xl"
          />
        </div>
        
        <div className="flex flex-1 flex-col p-6 relative z-10">
          <div className="mb-3 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">
            {product.make && <span className="text-gray-400">{product.make}</span>}
            {product.make && product.category && <span>•</span>}
            {product.category && <span className="text-gray-400">{product.category}</span>}
          </div>
          
          <h3 className="text-lg font-bold text-gray-100 mb-1 line-clamp-2 leading-tight group-hover:text-white transition-colors">
            {product.name}
          </h3>
          
          {product.city && <p className="text-xs text-gray-500 mb-4">{product.city}</p>}
          
          <div className="mt-auto pt-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-2xl font-extrabold text-white flex items-baseline gap-1">
                <span className="text-sm font-semibold text-red-500">Rs</span>
                {product.price.toLocaleString()}
              </div>
              {product.originalPrice > 0 && (
                <div className="text-xs font-medium text-gray-500 line-through mt-0.5">
                  Rs {product.originalPrice.toLocaleString()}
                </div>
              )}
            </div>
            
            <button className="w-full sm:w-auto rounded-xl bg-white/5 border border-white/10 px-6 py-2.5 text-sm font-semibold text-white transition-all duration-300 group-hover:bg-red-600 group-hover:border-red-500 group-hover:shadow-[0_0_15px_rgba(220,38,38,0.4)] active:scale-95">
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
