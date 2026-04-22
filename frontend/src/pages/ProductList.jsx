import React, { useState, useEffect } from "react";
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

  // ✅ Fetch products from the backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await axiosInstance.get("/products");
        setProducts(data.products || []);
      } catch (error) {
        setError(error.response?.data?.detail || error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // ✅ Apply filters
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

  // ✅ Apply sorting
  const sortedProducts = [...filteredProducts].sort((a, b) =>
    sortBy === "priceLow" ? a.price - b.price : b.price - a.price
  );

  // ✅ Limit products displayed
  const productsToDisplay = sortedProducts.slice(0, productsToShow);

  // ✅ Load more products
  const handleSeeMore = () => setProductsToShow((prev) => prev + 6);

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Loading...</p>
      </div>
    );

  if (error)
    return (
      <div className="flex justify-center items-center min-h-screen text-red-500">
        <p>{error}</p>
      </div>
    );

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex space-x-6">
          <div className="w-1/4">
            <AdvancedSearch
              filters={filters}
              setFilters={setFilters}
              products={products}
            />
          </div>
          <div className="flex-1">
            <SortingOptions
              sortBy={sortBy}
              setSortBy={setSortBy}
              setViewMode={setViewMode}
              viewMode={viewMode}
            />
            <ProductGrid products={productsToDisplay} viewMode={viewMode} />
            {productsToDisplay.length < sortedProducts.length && (
              <div className="text-right mt-6">
                <button
                  onClick={handleSeeMore}
                  className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-700 transition-all"
                >
                  See More
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Home;

