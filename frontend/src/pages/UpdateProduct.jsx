import React, { useState } from "react";
import axiosInstance from "@/api/axiosInstance";

const getErrorMessage = (error, fallback) =>
  error.response?.data?.detail || fallback;

const UpdateProductPage = () => {
  const [productId, setProductId] = useState("");
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const showAlert = (message, type = "error") => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 3000);
  };

  const fetchProduct = async () => {
    const trimmedProductId = productId.trim();
    if (!trimmedProductId) {
      showAlert("Please enter a Product ID.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await axiosInstance.get(`/products/${trimmedProductId}`);
      setProduct(data);
    } catch (error) {
      setProduct(null);
      showAlert(getErrorMessage(error, "Error fetching product. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setProduct((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedProductId = productId.trim();
    if (!trimmedProductId || !product) {
      showAlert("Fetch a product before trying to update it.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await axiosInstance.put("/products", {
        ...product,
        productId: trimmedProductId,
      });
      showAlert(data.message || "Product updated successfully.", "success");
    } catch (error) {
      showAlert(getErrorMessage(error, "Error updating product. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-start justify-start p-12"
      style={{
        backgroundImage: `url('/Images/car1.jpg')`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {alert && (
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 z-50">
          <div
            className={`p-4 rounded-lg shadow-lg text-white ${
              alert.type === "success" ? "bg-green-500" : "bg-red-500"
            }`}
          >
            <p className="text-lg font-bold">{alert.message}</p>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6 text-white w-full max-w-md bg-opacity-70 bg-black p-6 rounded shadow-lg"
      >
        <h1 className="text-3xl font-bold text-gradient mb-6">Update Product</h1>

        <div>
          <label className="block mb-2 text-lg font-medium">Product ID</label>
          <input
            type="text"
            name="productId"
            value={productId}
            onChange={(event) => setProductId(event.target.value)}
            className="w-full p-2 bg-transparent border border-gray-500 rounded text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="Enter Product ID"
            required
          />
          <p className="mt-2 text-sm text-gray-400">
            Use the numeric database ID or the product&apos;s stored `productId`.
          </p>
          <button
            type="button"
            onClick={fetchProduct}
            className="mt-4 w-full p-2 bg-red-500 text-white font-semibold rounded hover:bg-red-600 transition-all"
            disabled={loading}
          >
            {loading ? "Fetching..." : "Fetch Product"}
          </button>
        </div>

        {product && (
          <>
            <div>
              <label className="block mb-2 text-lg font-medium">Product Name</label>
              <input
                type="text"
                name="name"
                value={product.name || ""}
                onChange={handleChange}
                className="w-full p-2 bg-transparent border border-gray-500 rounded text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Enter product name"
                required
              />
            </div>

            <div>
              <label className="block mb-2 text-lg font-medium">Price</label>
              <input
                type="number"
                name="price"
                min="0"
                step="0.01"
                value={product.price ?? ""}
                onChange={handleChange}
                className="w-full p-2 bg-transparent border border-gray-500 rounded text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Enter price"
                required
              />
            </div>

            <div>
              <label className="block mb-2 text-lg font-medium">Original Price</label>
              <input
                type="number"
                name="originalPrice"
                min="0"
                step="0.01"
                value={product.originalPrice ?? ""}
                onChange={handleChange}
                className="w-full p-2 bg-transparent border border-gray-500 rounded text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Enter original price"
              />
            </div>

            <div>
              <label className="block mb-2 text-lg font-medium">Category</label>
              <select
                name="category"
                value={product.category || ""}
                onChange={handleChange}
                className="w-full p-2 bg-transparent border border-gray-500 rounded text-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              >
                <option value="" className="text-black">Select Category</option>
                <option value="Tyres" className="text-black">Tyres</option>
                <option value="Bumpers" className="text-black">Bumpers</option>
                <option value="Electrical" className="text-black">Electrical</option>
                <option value="Brakes" className="text-black">Brakes</option>
                <option value="Filters" className="text-black">Filters</option>
                <option value="Engine" className="text-black">Engine</option>
              </select>
            </div>

            <div>
              <label className="block mb-2 text-lg font-medium">Make</label>
              <input
                type="text"
                name="make"
                value={product.make || ""}
                onChange={handleChange}
                className="w-full p-2 bg-transparent border border-gray-500 rounded text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Enter make"
              />
            </div>

            <div>
              <label className="block mb-2 text-lg font-medium">City</label>
              <input
                type="text"
                name="city"
                value={product.city || ""}
                onChange={handleChange}
                className="w-full p-2 bg-transparent border border-gray-500 rounded text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Enter city"
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="sale"
                  checked={Boolean(product.sale)}
                  onChange={handleChange}
                  className="mr-2"
                />
                On Sale
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="freeShipping"
                  checked={Boolean(product.freeShipping)}
                  onChange={handleChange}
                  className="mr-2"
                />
                Free Shipping
              </label>
            </div>

            <button
              type="submit"
              className="w-full p-2 mt-6 bg-red-500 text-white font-semibold rounded hover:bg-red-600 transition-all"
              disabled={loading}
            >
              {loading ? "Updating..." : "Update Product"}
            </button>
          </>
        )}
      </form>
    </div>
  );
};

export default UpdateProductPage;
