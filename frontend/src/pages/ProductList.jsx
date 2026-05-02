import React, { useEffect, useState } from "react";
import axiosInstance from "@/api/axiosInstance";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import AdvancedSearch from "@/components/ui/ListAdvancedSearch";
import ProductGrid from "@/components/ui/ListProductGrid";
import SortingOptions from "@/components/ui/ListSortingOptions";

const Home = () => {
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({
    keyword: "",
    sale: false,
    freeShipping: false,
    category: "",
    minPrice: 0,
    maxPrice: 0,
    make: "",
    city: "",
  });
  const [sortBy, setSortBy] = useState("priceLow");
  const [viewMode, setViewMode] = useState("grid");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [productsToShow, setProductsToShow] = useState(6);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await axiosInstance.get("/products");
        setProducts(data.products || []);
      } catch (requestError) {
        setError(requestError.response?.data?.detail || requestError.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = products.filter((product) => {
    return (
      (!filters.keyword ||
        product.name.toLowerCase().includes(filters.keyword.toLowerCase())) &&
      (!filters.sale || product.sale) &&
      (!filters.freeShipping || product.freeShipping) &&
      (!filters.category || product.category === filters.category) &&
      (!filters.make || product.make === filters.make) &&
      (!filters.city || product.city === filters.city) &&
      (filters.minPrice === 0 || product.price >= filters.minPrice) &&
      (filters.maxPrice === 0 || product.price <= filters.maxPrice)
    );
  });

  const sortedProducts = [...filteredProducts].sort((a, b) =>
    sortBy === "priceLow" ? a.price - b.price : b.price - a.price
  );

  const productsToDisplay = sortedProducts.slice(0, productsToShow);
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
  const emptyMessage =
    products.length === 0
      ? "No products have been added yet."
      : hasActiveFilters
        ? "No products match the current filters."
        : "No products are available right now.";

  const handleSeeMore = () => setProductsToShow((prev) => prev + 6);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] text-red-500">
        <p className="bg-red-500/10 p-6 rounded-xl border border-red-500/20">{error}</p>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#050505] selection:bg-red-500/30">
        {/* Premium Header */}
        <div className="relative border-b border-white/5 bg-black">
          <div className="absolute inset-0 bg-gradient-to-r from-red-900/20 via-black to-black" />
          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500 sm:text-5xl">
              Performance Parts Catalog
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-gray-400">
              Explore our premium inventory of high-performance components. Filter by make, category, and city to find exactly what your build needs.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[320px_minmax(0,1fr)] items-start">
            {/* Sidebar Filters */}
            <div className="lg:min-w-0 sticky top-24 z-10">
              <AdvancedSearch
                filters={filters}
                setFilters={setFilters}
                products={products}
              />
            </div>

            {/* Main Product Area */}
            <div className="min-w-0">
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                  Showing <span className="text-white font-bold">{productsToDisplay.length}</span> of <span className="text-white font-bold">{sortedProducts.length}</span> parts
                </div>
                <SortingOptions
                  sortBy={sortBy}
                  setSortBy={setSortBy}
                  setViewMode={setViewMode}
                  viewMode={viewMode}
                />
              </div>

              <ProductGrid
                products={productsToDisplay}
                viewMode={viewMode}
                emptyMessage={emptyMessage}
              />
              
              {productsToDisplay.length < sortedProducts.length && (
                <div className="mt-12 text-center">
                  <button
                    onClick={handleSeeMore}
                    className="rounded-xl border border-white/10 bg-white/5 px-8 py-4 font-semibold text-white transition-all hover:bg-white/10 hover:border-white/20 active:scale-95"
                  >
                    Load More Parts
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Home;
