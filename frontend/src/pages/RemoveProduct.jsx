import React, { useState } from "react";
import axiosInstance from "@/api/axiosInstance";

const getErrorMessage = (error, fallback) =>
  error.response?.data?.detail || fallback;

const RemoveProductPage = () => {
  const [productId, setProductId] = useState("");
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [customAlert, setCustomAlert] = useState(null);

  const showCustomAlert = (message, type) => {
    setCustomAlert({ message, type });
    setTimeout(() => setCustomAlert(null), 3000);
  };

  const handleFetchProduct = async () => {
    const trimmedProductId = productId.trim();
    if (!trimmedProductId) {
      showCustomAlert("Please enter a Product ID.", "error");
      return;
    }

    setLoading(true);
    try {
      const { data } = await axiosInstance.get(`/products/${trimmedProductId}`);
      setProduct(data);
      setShowConfirm(false);
    } catch (error) {
      setProduct(null);
      showCustomAlert(
        getErrorMessage(error, "Error fetching product. Please try again."),
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveProduct = async () => {
    const trimmedProductId = productId.trim();
    setShowConfirm(false);
    setLoading(true);

    try {
      const { data } = await axiosInstance.delete("/products", {
        data: { productId: trimmedProductId },
      });
      showCustomAlert(data.message || "Product removed successfully!", "success");
      setProduct(null);
      setProductId("");
    } catch (error) {
      showCustomAlert(
        getErrorMessage(error, "Error deleting product. Please try again."),
        "error"
      );
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
      {customAlert && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center z-50">
          <div
            className={`p-6 rounded-lg shadow-lg text-white ${
              customAlert.type === "success" ? "bg-green-500" : "bg-red-500"
            }`}
          >
            <p className="text-lg font-bold">{customAlert.message}</p>
          </div>
        </div>
      )}

      <form className="space-y-6 text-white w-full max-w-md bg-opacity-70 bg-black p-6 rounded shadow-lg">
        <h1 className="text-3xl font-bold text-gradient mb-6">Remove Product</h1>

        <div>
          <label className="block mb-2 text-lg font-medium text-gradient">
            Product ID
          </label>
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
            onClick={handleFetchProduct}
            className="mt-4 w-full p-2 bg-red-500 text-white font-semibold rounded hover:bg-red-600 transition-all"
            disabled={loading || !productId.trim()}
          >
            {loading ? "Fetching..." : "Fetch Product"}
          </button>
        </div>

        {product && (
          <div className="mt-6">
            <h2 className="text-2xl font-semibold mb-4">Product Details</h2>
            <p><strong>Name:</strong> {product.name}</p>
            <p><strong>Price:</strong> Rs {product.price}</p>
            <p><strong>Category:</strong> {product.category}</p>
            {product.make && <p><strong>Make:</strong> {product.make}</p>}
            {product.city && <p><strong>City:</strong> {product.city}</p>}
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              className="mt-6 w-full p-2 bg-red-500 text-white font-semibold rounded hover:bg-red-600 transition-all"
            >
              Remove Product
            </button>
          </div>
        )}
      </form>

      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
          <div className="bg-white p-6 rounded shadow-lg text-center">
            <h3 className="text-xl font-semibold mb-4">Confirm Deletion</h3>
            <p>Are you sure you want to remove this product?</p>
            <div className="mt-6 flex justify-center space-x-4">
              <button
                onClick={handleRemoveProduct}
                className="p-2 bg-red-500 text-white rounded font-semibold hover:bg-red-600 transition-all"
              >
                Yes, Remove
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="p-2 bg-gray-300 text-black rounded font-semibold hover:bg-gray-400 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RemoveProductPage;
