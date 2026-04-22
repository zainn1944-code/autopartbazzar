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

  const handleSeeMore = () => setProductsToShow((prev) => prev + 6);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-black">
        <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-gray-100">Browse Parts</h1>
          <p className="mt-2 text-sm text-gray-400">
            Explore live inventory from the backend and narrow it down by make, city, category, and price.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <div className="lg:min-w-0">
            <AdvancedSearch
              filters={filters}
              setFilters={setFilters}
              products={products}
            />
          </div>

          <div className="min-w-0">
            <SortingOptions
              sortBy={sortBy}
              setSortBy={setSortBy}
              setViewMode={setViewMode}
              viewMode={viewMode}
            />
            <div className="mb-4 text-sm text-gray-400">
              Showing {productsToDisplay.length} of {sortedProducts.length} matching products
            </div>
            <ProductGrid products={productsToDisplay} viewMode={viewMode} />
            {productsToDisplay.length < sortedProducts.length && (
              <div className="mt-6 text-right">
                <button
                  onClick={handleSeeMore}
                  className="rounded bg-red-500 px-4 py-2 text-white transition-all hover:bg-red-700"
                >
                  See More
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
