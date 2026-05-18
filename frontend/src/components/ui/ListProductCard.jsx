import { Link } from "react-router-dom";
import ProductVisual from "@/components/ui/ProductVisual";

function sourceSiteName(sourceName) {
  if (!sourceName) return "Source";
  const lower = sourceName.toLowerCase();
  if (lower.includes("daraz")) return "Daraz";
  if (lower.includes("olx")) return "OLX";
  if (lower.includes("pakwheels")) return "PakWheels";
  return sourceName.split(" ")[0];
}

export default function ProductCard({ product, viewMode }) {
  const isList = viewMode === "list";

  return (
    <Link to={`/productdetail/${product.productId}`} className="group block h-full">
      <div
        className={`relative overflow-hidden rounded-2xl border border-gray-200 dark:border-white/8 bg-white dark:bg-[#0f0f14] shadow-xl transition-all duration-500
          hover:-translate-y-1.5 hover:border-red-500/40 hover:shadow-[0_16px_40px_rgba(220,38,38,0.18)]
          ${isList ? "flex flex-col sm:flex-row" : "flex h-full flex-col"}`}
      >
        {/* ── Image area: full bleed, no padding ── */}
        <div
          className={`relative overflow-hidden bg-[#16161d]
            ${isList ? "shrink-0 sm:w-64 sm:h-auto h-52" : "w-full aspect-[4/3]"}`}
        >
          {/* Gradient shimmer overlay on hover */}
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />

          {/* Sale badge */}
          {product.originalPrice > 0 && (
            <span className="absolute top-3 left-3 z-20 rounded-full bg-red-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-lg">
              Sale
            </span>
          )}
          {product.isLiveListing && (
            <span className="absolute left-3 top-11 z-20 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-lg">
              Live
            </span>
          )}
          {product.stockQuantity === 0 && product.isLiveListing && (
            <span className="absolute top-3 right-3 z-20 rounded-full bg-gray-700 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-gray-300 shadow-lg">
              Unavailable
            </span>
          )}
          {product.stockQuantity === 0 && !product.isLiveListing && (
            <span className="absolute top-3 right-3 z-20 rounded-full bg-gray-700 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-gray-300 shadow-lg">
              Out of Stock
            </span>
          )}
          {product.stockQuantity > 0 && product.stockQuantity <= 3 && (
            <span className="absolute top-3 right-3 z-20 rounded-full bg-orange-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-lg">
              Low Stock
            </span>
          )}

          <ProductVisual
            name={product.name}
            make={product.make}
            category={product.category}
            imageUrl={product.imageUrl}
            className="absolute inset-0 z-0 h-full w-full"
            imageClassName="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
          />
        </div>

        {/* ── Content area ── */}
        <div className="relative z-10 flex flex-1 flex-col p-5">
          {/* Make / Category breadcrumb */}
          <div className="mb-2 flex flex-wrap items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest">
            {product.make && (
              <span className="rounded-full bg-white/8 px-2 py-0.5 text-gray-400">
                {product.make}
              </span>
            )}
            {product.make && product.category && (
              <span className="text-gray-600">›</span>
            )}
            {product.category && (
              <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-red-400">
                {product.category}
              </span>
            )}
            {product.sourceName && (
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-400">
                {product.sourceName}
              </span>
            )}
          </div>

          {/* Product name */}
          <h3 className="mb-1 line-clamp-2 text-base font-bold leading-snug text-gray-800 dark:text-gray-100 transition-colors group-hover:text-red-600 dark:group-hover:text-white">
            {product.name}
          </h3>

          {/* City */}
          {product.city && (
            <p className="mb-3 text-[11px] text-gray-500 flex items-center gap-1">
              <svg className="inline w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {product.city}
            </p>
          )}

          {/* Divider */}
          <div className="mt-auto pt-3 border-t border-white/6">
            <div className="flex items-end justify-between gap-3">
              {/* Price */}
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xs font-semibold text-red-500">Rs</span>
                  <span className="text-xl font-extrabold text-white tracking-tight">
                    {product.price.toLocaleString()}
                  </span>
                </div>
                {product.originalPrice > 0 && (
                  <div className="mt-0.5 text-xs text-gray-500 line-through">
                    Rs {product.originalPrice.toLocaleString()}
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="flex flex-col gap-1.5">
                {product.isLiveListing && product.sourceUrl ? (
                  <a
                    href={product.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white text-center
                      transition-all duration-300 hover:bg-red-500 active:scale-95 whitespace-nowrap flex items-center gap-1 justify-center"
                  >
                    Buy on {sourceSiteName(product.sourceName)}
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                ) : null}
                <button
                  className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-gray-300
                    transition-all duration-300 hover:border-red-500/60 hover:bg-red-600/20 hover:text-white
                    active:scale-95 whitespace-nowrap"
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
