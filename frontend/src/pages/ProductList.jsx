import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axiosInstance from "@/api/axiosInstance";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import AdvancedSearch from "@/components/ui/ListAdvancedSearch";
import ProductGrid from "@/components/ui/ListProductGrid";
import SortingOptions from "@/components/ui/ListSortingOptions";

const DEFAULT_FILTERS = {
  keyword: "",
  sale: false,
  freeShipping: false,
  category: "",
  minPrice: "",
  maxPrice: "",
  make: "",
  city: "",
};

function readFilters(params) {
  return {
    keyword: params.get("q") || "",
    sale: params.get("sale") === "true",
    freeShipping: params.get("freeShipping") === "true",
    category: params.get("category") || "",
    minPrice: params.get("minPrice") || "",
    maxPrice: params.get("maxPrice") || "",
    make: params.get("make") || "",
    city: params.get("city") || "",
  };
}

function buildSearchParams(filters, sortBy, page) {
  const params = new URLSearchParams();
  if (filters.keyword) params.set("q", filters.keyword);
  if (filters.sale) params.set("sale", "true");
  if (filters.freeShipping) params.set("freeShipping", "true");
  if (filters.category) params.set("category", filters.category);
  if (filters.make) params.set("make", filters.make);
  if (filters.city) params.set("city", filters.city);
  if (filters.minPrice) params.set("minPrice", filters.minPrice);
  if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
  if (sortBy && sortBy !== "latest") params.set("sortBy", sortBy);
  if (page > 1) params.set("page", String(page));
  return params;
}

export default function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState(() => readFilters(searchParams));
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "latest");
  const [viewMode, setViewMode] = useState("grid");
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [loading, setLoading] = useState(true);      // initial page load only
  const [searching, setSearching] = useState(false);  // live search indicator
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState({
    page: 1,
    pageSize: 9,
    total: 0,
    totalPages: 1,
    availableFilters: {
      categories: [],
      makes: [],
      cities: [],
    },
  });

  // 300 ms debounce on keyword — fast enough to feel live, light on the server
  const [debouncedKeyword, setDebouncedKeyword] = useState(filters.keyword);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedKeyword(filters.keyword), 300);
    return () => clearTimeout(t);
  }, [filters.keyword]);

  const isFirstLoad = React.useRef(true);

  useEffect(() => {
    const controller = new AbortController();
    const first = isFirstLoad.current;

    const fetchProducts = async () => {
      // First load → full spinner; subsequent → subtle searching indicator only
      if (first) {
        setLoading(true);
        isFirstLoad.current = false;
      } else {
        setSearching(true);
      }
      setError(null);

      try {
        const params = { page, pageSize: 9, sortBy };
        if (debouncedKeyword) params.q = debouncedKeyword;
        if (filters.sale) params.sale = true;
        if (filters.freeShipping) params.freeShipping = true;
        if (filters.category) params.category = filters.category;
        if (filters.make) params.make = filters.make;
        if (filters.city) params.city = filters.city;
        if (filters.minPrice) params.minPrice = Number(filters.minPrice);
        if (filters.maxPrice) params.maxPrice = Number(filters.maxPrice);

        const { data } = await axiosInstance.get("/products", {
          params,
          signal: controller.signal,
        });
        setProducts(data.products || []);
        setMeta(
          data.meta || {
            page,
            pageSize: 9,
            total: data.products?.length || 0,
            totalPages: 1,
            availableFilters: { categories: [], makes: [], cities: [] },
          }
        );
      } catch (requestError) {
        if (requestError.name === "CanceledError" || requestError.name === "AbortError") return;
        setError(requestError.response?.data?.detail || requestError.message);
      } finally {
        setLoading(false);
        setSearching(false);
      }
    };

    fetchProducts();
    setSearchParams(
      buildSearchParams({ ...filters, keyword: debouncedKeyword }, sortBy, page),
      { replace: true }
    );

    return () => controller.abort();
  }, [debouncedKeyword, filters.sale, filters.freeShipping, filters.category, filters.make, filters.city, filters.minPrice, filters.maxPrice, page, sortBy]); // eslint-disable-line react-hooks/exhaustive-deps

  const availableFilters = meta.availableFilters || {
    categories: [],
    makes: [],
    cities: [],
  };

  const range = useMemo(() => {
    if (meta.total === 0) return { start: 0, end: 0 };
    const start = (meta.page - 1) * meta.pageSize + 1;
    const end = Math.min(meta.total, start + products.length - 1);
    return { start, end };
  }, [meta.page, meta.pageSize, meta.total, products.length]);

  const hasActiveFilters = Boolean(
    filters.keyword ||
      filters.sale ||
      filters.freeShipping ||
      filters.category ||
      filters.minPrice ||
      filters.maxPrice ||
      filters.make ||
      filters.city
  );

  const emptyMessage = hasActiveFilters
    ? "No products match the current filters."
    : "No products have been added yet.";

  const updateFilters = (updater) => {
    setPage(1);
    setFilters((current) =>
      typeof updater === "function" ? updater(current) : updater
    );
  };

  const resetFilters = () => {
    setPage(1);
    setSortBy("latest");
    setFilters(DEFAULT_FILTERS);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-[#080810]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-red-500" />
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Loading Parts…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-[#080810] text-red-500">
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 p-6">{error}</p>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-100 dark:bg-[#080810] selection:bg-red-500/30">

        {/* ── Hero banner ── */}
        <div className="relative overflow-hidden border-b border-white/5">
          {/* Background layers */}
          <div className="absolute inset-0 bg-gray-100 dark:bg-[#080810]" />
          <div className="absolute inset-0 bg-gradient-to-br from-red-950/30 via-[#0d0d1a] to-[#080810]" />
          {/* Subtle grid lines */}
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: "linear-gradient(#ffffff 1px,transparent 1px),linear-gradient(90deg,#ffffff 1px,transparent 1px)", backgroundSize: "40px 40px" }} />

          <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-red-500">AutoPart Bazzar</p>
            <h1 className="bg-gradient-to-r from-white via-gray-200 to-gray-500 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl">
              Performance Parts Catalog
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-gray-400">
              Premium inventory of high-performance components — filter by make, category, and city.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid items-start gap-10 lg:grid-cols-[320px_minmax(0,1fr)]">
            <div className="sticky top-24 z-10 lg:min-w-0">
              <AdvancedSearch
                filters={filters}
                setFilters={updateFilters}
                availableFilters={availableFilters}
                onReset={resetFilters}
                isSearching={searching}
              />
            </div>

            <div className="min-w-0">
              <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                {/* Showing count */}
                <div className="flex items-center gap-2 rounded-xl border border-white/6 bg-white/[0.03] px-4 py-2 text-xs font-medium text-gray-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                  Showing{" "}
                  <span className="font-bold text-white">{range.start}–{range.end}</span>
                  {" "}of{" "}
                  <span className="font-bold text-white">{meta.total}</span>
                  {" "}parts
                </div>
                <Link
                  to="/compare"
                  className="text-xs border border-red-500/40 text-red-400 hover:bg-red-600/20 px-3 py-1.5 rounded-lg transition"
                >
                  Compare Products
                </Link>
                <SortingOptions
                  sortBy={sortBy}
                  setSortBy={(value) => {
                    setPage(1);
                    setSortBy(value);
                  }}
                  setViewMode={setViewMode}
                  viewMode={viewMode}
                />
              </div>

              <ProductGrid products={products} viewMode={viewMode} emptyMessage={emptyMessage} isSearching={searching} />

              {meta.totalPages > 1 && (
                <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-2xl border border-white/8 bg-[#0f0f14] px-6 py-4 sm:flex-row">
                  <p className="text-xs font-medium text-gray-500">
                    Page{" "}
                    <span className="font-bold text-white">{meta.page}</span>
                    {" "}of{" "}
                    <span className="font-bold text-white">{meta.totalPages}</span>
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                      disabled={meta.page <= 1}
                      className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" d="M15 19l-7-7 7-7" />
                      </svg>
                      Previous
                    </button>
                    <button
                      onClick={() => setPage((current) => Math.min(meta.totalPages, current + 1))}
                      disabled={meta.page >= meta.totalPages}
                      className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-700 to-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_16px_rgba(220,38,38,0.3)] transition-all hover:from-red-600 hover:to-red-500 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      Next
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
