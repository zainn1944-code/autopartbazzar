import React, { useState } from "react";
import axiosInstance from "@/api/axiosInstance";

const AddProductForm = () => {
  const [product, setProduct] = useState({
    name: "",
    price: "",
    originalPrice: "",
    category: "",
    make: "",
    city: "",
    sale: false,
    freeShipping: false,
    image: null,
  });
  const [fileInputKey, setFileInputKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setProduct((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validateForm = () => {
    const { name, price, originalPrice, category } = product;

    if (!name || !price || !category) {
      return "Please fill in all required fields.";
    }

    if (Number(price) <= 0) {
      return "Price must be greater than 0.";
    }

    if (originalPrice && Number(price) > Number(originalPrice)) {
      return "Price must be less than or equal to the original price.";
    }

    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setSuccessMessage("");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const formDataToSend = new FormData();
      Object.entries(product).forEach(([key, value]) => {
        if (key !== "image") {
          formDataToSend.append(key, value);
        }
      });

      if (product.image) {
        formDataToSend.append("image", product.image);
      }

      const response = await axiosInstance.post("/products", formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const createdProductId = response.data.product?.productId;
      setSuccessMessage(
        createdProductId
          ? `Product ${createdProductId} added successfully.`
          : "Product added successfully."
      );
      setProduct({
        name: "",
        price: "",
        originalPrice: "",
        category: "",
        make: "",
        city: "",
        sale: false,
        freeShipping: false,
        image: null,
      });
      setFileInputKey((current) => current + 1);
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail || "An error occurred while adding the product."
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
      <form
        onSubmit={handleSubmit}
        className="space-y-6 text-white w-full max-w-md bg-opacity-70 bg-black p-6 rounded shadow-lg"
      >
        <h1 className="text-3xl font-bold text-gradient mb-6">Add Product</h1>

        <div className="rounded-lg border border-gray-700 bg-gray-900/70 p-4 text-sm text-gray-300">
          Product IDs are assigned by the backend when the item is saved.
          Uploaded images use S3 when AWS is configured; otherwise they are stored locally and served by the API.
        </div>

        {error && (
          <div className="rounded bg-red-500/15 p-3 text-red-300">{error}</div>
        )}

        {successMessage && (
          <div className="rounded bg-green-500/15 p-3 text-green-300">
            {successMessage}
          </div>
        )}

        <div>
          <label className="block mb-2 text-lg font-medium text-gradient">
            Product Name
          </label>
          <input
            type="text"
            name="name"
            value={product.name}
            onChange={handleChange}
            className="w-full p-2 bg-transparent border border-gray-500 rounded text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="Enter product name"
            required
          />
        </div>

        <div>
          <label className="block mb-2 text-lg font-medium text-gradient">
            Price
          </label>
          <input
            type="number"
            name="price"
            min="0"
            step="0.01"
            value={product.price}
            onChange={handleChange}
            className="w-full p-2 bg-transparent border border-gray-500 rounded text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="Enter price"
            required
          />
        </div>

        <div>
          <label className="block mb-2 text-lg font-medium text-gradient">
            Original Price (Optional)
          </label>
          <input
            type="number"
            name="originalPrice"
            min="0"
            step="0.01"
            value={product.originalPrice}
            onChange={handleChange}
            className="w-full p-2 bg-transparent border border-gray-500 rounded text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="Enter original price"
          />
        </div>

        <div>
          <label className="block mb-2 text-lg font-medium text-gradient">
            Category
          </label>
          <select
            name="category"
            value={product.category}
            onChange={handleChange}
            className="w-full p-2 bg-transparent border border-gray-500 rounded text-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500"
            required
          >
            <option value="" className="text-black">
              Select Category
            </option>
            <option value="Tyres" className="text-black">Tyres</option>
            <option value="Bumpers" className="text-black">Bumpers</option>
            <option value="Electrical" className="text-black">Electrical</option>
            <option value="Brakes" className="text-black">Brakes</option>
            <option value="Filters" className="text-black">Filters</option>
            <option value="Engine" className="text-black">Engine</option>
          </select>
        </div>

        <div>
          <label className="block mb-2 text-lg font-medium text-gradient">
            Make
          </label>
          <select
            name="make"
            value={product.make}
            onChange={handleChange}
            className="w-full p-2 bg-transparent border border-gray-500 rounded text-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="" className="text-black">Select Make</option>
            <option value="Honda" className="text-black">Honda</option>
            <option value="Toyota" className="text-black">Toyota</option>
            <option value="BMW" className="text-black">BMW</option>
          </select>
        </div>

        <div>
          <label className="block mb-2 text-lg font-medium text-gradient">
            City
          </label>
          <select
            name="city"
            value={product.city}
            onChange={handleChange}
            className="w-full p-2 bg-transparent border border-gray-500 rounded text-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="" className="text-black">Select City</option>
            <option value="Lahore" className="text-black">Lahore</option>
            <option value="Karachi" className="text-black">Karachi</option>
            <option value="Faisalabad" className="text-black">Faisalabad</option>
          </select>
        </div>

        <div>
          <label className="block mb-2 text-lg font-medium flex items-center text-gradient">
            <input
              type="checkbox"
              name="sale"
              checked={product.sale}
              onChange={handleChange}
              className="mr-2"
            />
            On Sale
          </label>
        </div>

        <div>
          <label className="block mb-2 text-lg font-medium flex items-center text-gradient">
            <input
              type="checkbox"
              name="freeShipping"
              checked={product.freeShipping}
              onChange={handleChange}
              className="mr-2"
            />
            Free Shipping
          </label>
        </div>

        <div>
          <label className="block mb-2 text-lg font-medium text-gradient">
            Product Image (Optional)
          </label>
          <input
            key={fileInputKey}
            type="file"
            name="image"
            accept="image/*"
            onChange={(event) =>
              setProduct((current) => ({
                ...current,
                image: event.target.files?.[0] || null,
              }))
            }
            className="w-full p-2 bg-transparent border border-gray-500 rounded text-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <button
          type="submit"
          className="w-full p-2 bg-red-500 text-white font-semibold rounded hover:bg-red-600 transition-all"
          disabled={loading}
        >
          {loading ? "Adding Product..." : "Add Product"}
        </button>
      </form>
    </div>
  );
};

export default AddProductForm;
