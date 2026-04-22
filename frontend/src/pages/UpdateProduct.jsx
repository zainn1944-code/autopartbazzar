// "use client";

// import React, { useState } from "react";

// const UpdateProductPage = () => {
//   const [productId, setProductId] = useState(""); // To fetch product by ID
//   const [product, setProduct] = useState(null); // Store fetched product data
//   const [loading, setLoading] = useState(false);
//   const [customAlert, setCustomAlert] = useState(null); // State for custom alert

//   // Validate productId (must be an integer greater than 0)
//   const isValidProductId = (id) => {
//     const numId = parseInt(id, 10);
//     return Number.isInteger(numId) && numId > 0;
//   };

//   // Fetch product by productId
//   const handleFetchProduct = async () => {
//     if (!isValidProductId(productId)) {
//       showCustomAlert("Product ID must be a positive integer greater than 0.", "error");
//       return;
//     }

//     setLoading(true);
//     try {
//       const res = await fetch(`/api/products/${productId}`);
//       const data = await res.json();

//       if (data.product) {
//         setProduct(data.product); // Set product data for update
//       } else {
//         showCustomAlert("Product not found. Please check the Product ID.", "error");
//         setProduct(null);
//       }
//     } catch (error) {
//       showCustomAlert("Error fetching product. Please try again.", "error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleChange = (e) => {
//     const { name, value, type, checked } = e.target;
//     setProduct((prev) => ({
//       ...prev,
//       [name]: type === "checkbox" ? checked : value,
//     }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!productId || !isValidProductId(productId)) {
//       showCustomAlert("Product ID must be a positive integer greater than 0.", "error");
//       return;
//     }

//     if (!product) {
//       showCustomAlert("No product data to update. Please fetch the product first.", "error");
//       return;
//     }

//     setLoading(true);
//     try {
//       const updatedProduct = { ...product, productId };

//       const res = await fetch("/api/updateproduct", {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(updatedProduct),
//       });

//       const data = await res.json();
//       if (res.ok) {
//         showCustomAlert(data.message, "success");
//       } else {
//         showCustomAlert(data.error || "Failed to update product.", "error");
//       }
//     } catch (error) {
//       showCustomAlert("Error updating product. Please try again.", "error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const showCustomAlert = (message, type) => {
//     setCustomAlert({ message, type });
//     setTimeout(() => setCustomAlert(null), 3000); // Automatically hide after 3 seconds
//   };

//   return (
//     <div
//       className="min-h-screen flex items-start justify-start p-12"
//       style={{
//         backgroundImage: `url('/images/car1.jpg')`,
//         backgroundRepeat: "no-repeat",
//         backgroundSize: "cover",
//         backgroundPosition: "center",
//       }}
//     >
//       {/* Custom Alert Box */}
//       {customAlert && (
//         <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center z-50">
//           <div
//             className={`p-6 rounded-lg shadow-lg text-white ${
//               customAlert.type === "success" ? "bg-green-500" : "bg-red-500"
//             }`}
//           >
//             <p className="text-lg font-bold">{customAlert.message}</p>
//           </div>
//         </div>
//       )}

//       <form
//         onSubmit={handleSubmit}
//         className="space-y-6 text-white w-full max-w-md bg-opacity-70 bg-black p-6 rounded shadow-lg"
//       >
//         <h1 className="text-3xl font-bold text-gradient mb-6">Update Product</h1>

//         {/* Fetch Product by ID */}
//         <div>
//           <label className="block mb-2 text-lg font-medium text-gradient">Product ID</label>
//           <input
//             type="text"
//             name="productId"
//             value={productId}
//             onChange={(e) => setProductId(e.target.value)}
//             className="w-full p-2 bg-transparent border border-gray-500 rounded text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
//             placeholder="Enter Product ID"
//             required
//           />
//           <button
//             type="button"
//             onClick={handleFetchProduct}
//             className="mt-4 w-full p-2 bg-red-500 text-white font-semibold rounded hover:bg-red-600 transition-all"
//             disabled={loading}
//           >
//             {loading ? "Fetching..." : "Fetch Product"}
//           </button>
//         </div>

//         {/* Update Product Form */}
//         {product && (
//           <>
//             <div>
//               <label className="block mb-2 text-lg font-medium text-gradient">Product Name</label>
//               <input
//                 type="text"
//                 name="name"
//                 value={product.name}
//                 onChange={handleChange}
//                 className="w-full p-2 bg-transparent border border-gray-500 rounded text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
//                 placeholder="Enter product name"
//                 required
//               />
//             </div>
//             <div>
//               <label className="block mb-2 text-lg font-medium text-gradient">Price</label>
//               <input
//                 type="number"
//                 name="price"
//                 value={product.price}
//                 onChange={handleChange}
//                 className="w-full p-2 bg-transparent border border-gray-500 rounded text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
//                 placeholder="Enter price"
//                 required
//               />
//             </div>
//             <div>
//               <label className="block mb-2 text-lg font-medium text-gradient">Original Price</label>
//               <input
//                 type="number"
//                 name="originalPrice"
//                 value={product.originalPrice}
//                 onChange={handleChange}
//                 className="w-full p-2 bg-transparent border border-gray-500 rounded text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
//                 placeholder="Enter original price"
//               />
//             </div>
//             <div>
//               <label className="block mb-2 text-lg font-medium text-gradient">Category</label>
//               <select
//                 name="category"
//                 value={product.category}
//                 onChange={handleChange}
//                 className="w-full p-2 bg-transparent border border-gray-500 rounded text-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500"
//                 required
//               >
//                 <option value="" className="text-black">Select Category</option>
//                 <option value="Engine" className="text-black">Engine</option>
//                 <option value="Filters" className="text-black">Filters</option>
//                 <option value="Brakes" className="text-black">Brakes</option>
//                 <option value="Electrical" className="text-black">Electrical</option>
//               </select>
//             </div>
//             <div>
//               <label className="block mb-2 text-lg font-medium text-gradient">Make</label>
//               <input
//                 type="text"
//                 name="make"
//                 value={product.make}
//                 onChange={handleChange}
//                 className="w-full p-2 bg-transparent border border-gray-500 rounded text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
//                 placeholder="Enter make"
//               />
//             </div>
//             <div>
//               <label className="block mb-2 text-lg font-medium text-gradient">City</label>
//               <input
//                 type="text"
//                 name="city"
//                 value={product.city}
//                 onChange={handleChange}
//                 className="w-full p-2 bg-transparent border border-gray-500 rounded text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
//                 placeholder="Enter city"
//               />
//             </div>
//             <div>
//               <label className="block mb-2 text-lg font-medium flex items-center text-gradient">
//                 <input
//                   type="checkbox"
//                   name="sale"
//                   checked={product.sale}
//                   onChange={handleChange}
//                   className="mr-2"
//                 />
//                 On Sale
//               </label>
//             </div>
//             <div>
//               <label className="block mb-2 text-lg font-medium flex items-center text-gradient">
//                 <input
//                   type="checkbox"
//                   name="freeShipping"
//                   checked={product.freeShipping}
//                   onChange={handleChange}
//                   className="mr-2"
//                 />
//                 Free Shipping
//               </label>
//             </div>

//             <button
//               type="submit"
//               className="w-full p-2 mt-6 bg-red-500 text-white font-semibold rounded hover:bg-red-600 transition-all"
//               disabled={loading}
//             >
//               {loading ? "Updating..." : "Update Product"}
//             </button>
//           </>
//         )}
//       </form>
//     </div>
//   );
// };

// export default UpdateProductPage;

import React, { useState } from "react";
import axiosInstance from "@/api/axiosInstance";

const UpdateProductPage = () => {
  const [productId, setProductId] = useState("");
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  // Validate productId (either a number > 0 or a MongoDB ObjectId)
  const isValidProductId = (id) => {
    return id && (id.match(/^[0-9a-fA-F]{24}$/) || /^[1-9]\d*$/.test(id));
  };

  // Display custom alert
  const showAlert = (message, type = "error") => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 3000);
  };

  // Fetch product by ID
  const fetchProduct = async () => {
    if (!isValidProductId(productId)) {
      showAlert("Invalid Product ID. Must be a positive number or valid MongoDB ID.");
      return;
    }

    setLoading(true);
    try {
      const { data, status } = await axiosInstance.get(`/products/${productId}`);

      if (status !== 200 || !data) {
        showAlert("Product not found. Please check the Product ID.");
        setProduct(null);
        return;
      }

      setProduct(data);
    } catch (error) {
      showAlert("Error fetching product. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle input change for product fields
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProduct((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle form submission (Update Product)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidProductId(productId) || !product) {
      showAlert("Invalid Product ID or missing product data.");
      return;
    }

    setLoading(true);
    try {
      const updatedProduct = { ...product, productId };
      const res = await axiosInstance.put("/products", updatedProduct);

      const data = res.data;
      if (res.status >= 200 && res.status < 300) {
        showAlert(data.message || "Product updated successfully.", "success");
      } else {
        showAlert(data.error || "Failed to update product.");
      }
    } catch (error) {
      showAlert("Error updating product. Please try again.");
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
      {/* Custom Alert Box */}
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

        {/* Fetch Product by ID */}
        <div>
          <label className="block mb-2 text-lg font-medium">Product ID</label>
          <input
            type="text"
            name="productId"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="w-full p-2 bg-transparent border border-gray-500 rounded text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="Enter Product ID"
            required
          />
          <button
            type="button"
            onClick={fetchProduct}
            className="mt-4 w-full p-2 bg-red-500 text-white font-semibold rounded hover:bg-red-600 transition-all"
            disabled={loading}
          >
            {loading ? "Fetching..." : "Fetch Product"}
          </button>
        </div>

        {/* Update Product Form */}
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
                value={product.price || ""}
                onChange={handleChange}
                className="w-full p-2 bg-transparent border border-gray-500 rounded text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Enter price"
                required
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
                <option value="Engine" className="text-black">Engine</option>
                <option value="Filters" className="text-black">Filters</option>
                <option value="Brakes" className="text-black">Brakes</option>
                <option value="Electrical" className="text-black">Electrical</option>
                <option value="Tyres" className="text-black">Tyres</option>
              </select>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="sale"
                  checked={product.sale || false}
                  onChange={handleChange}
                  className="mr-2"
                />
                On Sale
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="freeShipping"
                  checked={product.freeShipping || false}
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
