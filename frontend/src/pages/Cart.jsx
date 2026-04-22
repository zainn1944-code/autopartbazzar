// "use client";

// import Footer from "@/components/ui/footer";
// import Navbar from "@/components/ui/navbar";
// import React, { useState } from "react";

// export default function ShoppingCart() {
//   const [cartItems, setCartItems] = useState([
//     {
//       id: 1,
//       name: "Engine Oil 5W-30",
//       description: "High-quality engine oil for optimal performance.",
//       price: 2499,
//       quantity: 1,
//       image: "/images/car2.jpg",
//     },
//     {
//       id: 2,
//       name: "Air Filter",
//       description: "Premium air filter for better engine efficiency.",
//       price: 1499,
//       quantity: 1,
//       image: "/images/truck.png",
//     },
//   ]);

//   const [formData, setFormData] = useState({
//     name: "",
//     phone: "",
//     email: "",
//     location: "",
//     address: "",
//     postalCode: "",
//   });

//   const [formErrors, setFormErrors] = useState({
//     name: "",
//     phone: "",
//     email: "",
//     location: "",
//     address: "",
//     postalCode: "",
//   });

//   const handleQuantityChange = (id, newQuantity) => {
//     setCartItems((prevItems) =>
//       prevItems.map((item) =>
//         item.id === id
//           ? { ...item, quantity: newQuantity > 0 ? newQuantity : 1 }
//           : item
//       )
//     );
//   };

//   const handleRemoveItem = (id) => {
//     setCartItems((prevItems) => prevItems.filter((item) => item.id !== id));
//   };

//   const handleFormChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prevData) => ({
//       ...prevData,
//       [name]: value,
//     }));
//   };

//   const validateForm = () => {
//     let errors = {};
//     const { name, phone, email, location, address, postalCode } = formData;

//     if (!name) errors.name = "Name is required.";
//     if (!phone || !/^\d{10}$/.test(phone)) errors.phone = "Valid phone number is required.";
//     if (!email || !/\S+@\S+\.\S+/.test(email)) errors.email = "Valid email is required.";
//     if (!location) errors.location = "Location is required.";
//     if (!address) errors.address = "Address is required.";
//     if (!postalCode || !/^\d{5}$/.test(postalCode)) errors.postalCode = "Valid postal code is required.";

//     setFormErrors(errors);
//     return Object.keys(errors).length === 0;
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (validateForm()) {
//       alert("Form submitted successfully!");
//     } else {
//       alert("Please fill in all required fields correctly.");
//     }
//   };

//   return (
//     <>
//       <Navbar />
//       <section className="h-full py-10" style={{ backgroundColor: "#0a0a0a" }}>
//         <div className="container mx-auto">
//           <div className="flex justify-center items-start gap-6">
//             {/* Left Column: Shopping Cart */}
//             <div className="w-full lg:w-7/12">
//               <hr className="my-4 border-gray-600" />
//               <div className="mb-6">
//                 <h2 className="text-2xl font-semibold text-white">Shopping Cart</h2>
//                 <p className="text-sm text-gray-400">
//                   You have {cartItems.length} items in your cart.
//                 </p>
//               </div>
//               {cartItems.map((item) => (
//                 <div
//                   key={item.id}
//                   className="bg-gray-900 rounded-lg shadow-md mb-6 p-4 flex justify-between items-center"
//                 >
//                   <div className="flex items-center">
//                     <img
//                       src={item.image}
//                       alt={item.name}
//                       className="w-16 h-16 rounded-lg"
//                     />
//                     <div className="ml-4">
//                       <h5 className="text-lg font-semibold text-white">{item.name}</h5>
//                       <p className="text-sm text-gray-400">{item.description}</p>
//                     </div>
//                   </div>
//                   <div className="flex items-center">
//                     <input
//                       type="number"
//                       min="1"
//                       value={item.quantity}
//                       className="w-12 border border-gray-600 rounded-lg text-center mr-4 bg-gray-700 text-white"
//                       onChange={(e) =>
//                         handleQuantityChange(item.id, parseInt(e.target.value, 10) || 1)
//                       }
//                     />
//                     <p className="text-lg font-semibold text-white mr-4">
//                       Rs {item.price * item.quantity}
//                     </p>
//                     <button
//                       className="text-gray-400 hover:text-red-600"
//                       onClick={() => handleRemoveItem(item.id)}
//                     >
//                       🗑️ {/* Trash bin emoji for remove button */}
//                     </button>
//                   </div>
//                 </div>
//               ))}
//               <h5 className="text-lg mb-4">
//                 <a
//                   href="/productlist"
//                   className="text-red-600 hover:underline flex items-center"
//                 >
//                   <i className="fas fa-long-arrow-alt-left mr-2"></i>
//                   Continue Shopping
//                 </a>
//               </h5>
//             </div>
//             {/* Right Column: Payment Summary */}
//             <div className="w-full lg:w-5/12">
//               <div className="bg-gray-900 text-white rounded-lg p-6 shadow-md">
//                 <h5 className="text-lg font-semibold mb-4">Payment Summary</h5>
//                 <div className="flex justify-between items-center mb-4">
//                   <p className="text-sm text-gray-400">Subtotal</p>
//                   <p>
//                     Rs{" "}
//                     {cartItems.reduce(
//                       (total, item) => total + item.price * item.quantity,
//                       0
//                     )}
//                   </p>
//                 </div>
//                 <div className="flex justify-between items-center mb-4">
//                   <p className="text-sm text-gray-400">Shipping</p>
//                   <p>Rs 250</p>
//                 </div>
//                 <div className="flex justify-between items-center text-lg font-semibold mb-4">
//                   <p>Total (Incl. taxes)</p>
//                   <p>
//                     Rs{" "}
//                     {cartItems.reduce(
//                       (total, item) => total + item.price * item.quantity,
//                       20
//                     )}
//                   </p>
//                 </div>
//                 <div className="mt-6">
//                   <h5 className="text-md font-semibold mb-2">Delivery Information</h5>
//                   <form className="space-y-4" onSubmit={handleSubmit}>
//                     <input
//                       type="text"
//                       name="name"
//                       value={formData.name}
//                       onChange={handleFormChange}
//                       placeholder="Your Name"
//                       className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400"
//                     />
//                     {formErrors.name && (
//                       <p className="text-sm text-red-600">{formErrors.name}</p>
//                     )}

//                     <input
//                       type="text"
//                       name="phone"
//                       value={formData.phone}
//                       onChange={handleFormChange}
//                       placeholder="Phone Number"
//                       className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400"
//                     />
//                     {formErrors.phone && (
//                       <p className="text-sm text-red-600">{formErrors.phone}</p>
//                     )}

//                     <input
//                       type="email"
//                       name="email"
//                       value={formData.email}
//                       onChange={handleFormChange}
//                       placeholder="Email"
//                       className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400"
//                     />
//                     {formErrors.email && (
//                       <p className="text-sm text-red-600">{formErrors.email}</p>
//                     )}

//                     <input
//                       type="text"
//                       name="location"
//                       value={formData.location}
//                       onChange={handleFormChange}
//                       placeholder="Location"
//                       className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400"
//                     />
//                     {formErrors.location && (
//                       <p className="text-sm text-red-600">{formErrors.location}</p>
//                     )}

//                     <input
//                       type="text"
//                       name="address"
//                       value={formData.address}
//                       onChange={handleFormChange}
//                       placeholder="Address"
//                       className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400"
//                     />
//                     {formErrors.address && (
//                       <p className="text-sm text-red-600">{formErrors.address}</p>
//                     )}

//                     <input
//                       type="text"
//                       name="postalCode"
//                       value={formData.postalCode}
//                       onChange={handleFormChange}
//                       placeholder="Postal Code"
//                       className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400"
//                     />
//                     {formErrors.postalCode && (
//                       <p className="text-sm text-red-600">{formErrors.postalCode}</p>
//                     )}
//                   </form>
//                 </div>
//                 <button className="w-full mt-6 bg-red-600 text-white p-3 rounded-lg hover:bg-red-700">
//                   Cash on Delivery Checkout
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>
//       <Footer />
//     </>
//   );
// }
import { useCart } from "@/context/CartContext.jsx";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import ProductVisual from "@/components/ui/ProductVisual";
import { useNavigate } from "react-router-dom";

export default function ShoppingCart() {
  const { cart, updateQuantity, removeFromCart } = useCart();
  const navigate = useNavigate();

  return (
    <>
      <Navbar />
      <section className="h-full py-10" style={{ backgroundColor: "#0a0a0a" }}>
        <div className="container mx-auto">
          <div className="flex justify-center items-start gap-6">
            {/* Cart Items */}
            <div className="w-full lg:w-7/12">
              <h2 className="text-2xl font-semibold text-white">Shopping Cart</h2>
              <p className="text-sm text-gray-400">
                You have {cart.length} items in your cart.
              </p>

              {cart.length === 0 ? (
                <p className="text-white mt-4">Your cart is empty.</p>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="bg-gray-900 rounded-lg shadow-md mb-6 p-4 flex justify-between items-center"
                  >
                    <div className="flex items-center">
                      <ProductVisual
                        name={item.name}
                        make={item.make}
                        category={item.category}
                        imageUrl={item.imageUrl}
                        compact
                        className="relative h-16 w-16 overflow-hidden rounded-lg"
                        imageClassName="h-16 w-16 rounded-lg bg-gray-800 object-cover"
                      />
                      <div className="ml-4">
                        <h5 className="text-lg font-semibold text-white">{item.name}</h5>
                        <p className="text-sm text-gray-400">
                          {item.description || [item.make, item.category].filter(Boolean).join(" | ")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        className="w-12 border border-gray-600 rounded-lg text-center mr-4 bg-gray-700 text-white"
                        onChange={(e) =>
                          updateQuantity(item.id, parseInt(e.target.value, 10) || 1)
                        }
                      />
                      <p className="text-lg font-semibold text-white mr-4">
                        Rs {item.price * item.quantity}
                      </p>
                      <button
                        className="text-gray-400 hover:text-red-600"
                        onClick={() => removeFromCart(item.id)}
                      >
                        🗑️ {/* Remove Item */}
                      </button>
                    </div>
                  </div>
                ))
              )}

              <h5 className="text-lg mb-4">
                <a href="/productlist" className="text-red-600 hover:underline">
                  ← Continue Shopping
                </a>
              </h5>
            </div>

            {/* Payment Summary */}
            <div className="w-full lg:w-5/12 bg-gray-900 text-white rounded-lg p-6 shadow-md">
              <h5 className="text-lg font-semibold mb-4">Payment Summary</h5>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-400">Subtotal</p>
                <p>Rs {cart.reduce((total, item) => total + item.price * item.quantity, 0)}</p>
              </div>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-400">Shipping</p>
                <p>Rs 250</p>
              </div>
              <div className="flex justify-between items-center text-lg font-semibold">
                <p>Total</p>
                <p>
                  Rs{" "}
                  {cart.reduce((total, item) => total + item.price * item.quantity, 250)}
                </p>
              </div>

              {/* 🔹 Updated Checkout Button to Navigate to Checkout Page */}
              <button
                className="w-full mt-6 bg-red-600 text-white p-3 rounded-lg hover:bg-red-700"
                onClick={() => navigate("/checkout")}
              >
                Checkout
              </button>

            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}


// export default function ShoppingCart() {
//   const { cart, updateQuantity, removeFromCart } = useCart();

//   console.log(cart); // Debugging: Check if image URLs exist

//   return (
//     <>
//       <Navbar />
//       <section className="h-full py-10" style={{ backgroundColor: "#0a0a0a" }}>
//         <div className="container mx-auto">
//           <div className="flex justify-center items-start gap-6">
//             {/* Cart Items */}
//             <div className="w-full lg:w-7/12">
//               <h2 className="text-2xl font-semibold text-white">Shopping Cart</h2>
//               <p className="text-sm text-gray-400">
//                 You have {cart.length} items in your cart.
//               </p>

//               {cart.length === 0 ? (
//                 <p className="text-white mt-4">Your cart is empty.</p>
//               ) : (
//                 cart.map((item) => (
//                   <div
//                     key={item.id}
//                     className="bg-gray-900 rounded-lg shadow-md mb-6 p-4 flex justify-between items-center"
//                   >
//                     <div className="flex items-center">
//                       <img
//                         src={item.imageUrl ? item.imageUrl : "/placeholder.png"} // Fix missing images
//                         alt={item.name}
//                         className="w-16 h-16 rounded-lg object-cover"
//                       />
//                       <div className="ml-4">
//                         <h5 className="text-lg font-semibold text-white">{item.name}</h5>
//                         <p className="text-sm text-gray-400">{item.description}</p>
//                       </div>
//                     </div>
//                     <div className="flex items-center">
//                       <input
//                         type="number"
//                         min="1"
//                         value={item.quantity}
//                         className="w-12 border border-gray-600 rounded-lg text-center mr-4 bg-gray-700 text-white"
//                         onChange={(e) =>
//                           updateQuantity(item.id, parseInt(e.target.value, 10) || 1)
//                         }
//                       />
//                       <p className="text-lg font-semibold text-white mr-4">
//                         Rs {item.price * item.quantity}
//                       </p>
//                       <button
//                         className="text-gray-400 hover:text-red-600"
//                         onClick={() => removeFromCart(item.id)}
//                       >
//                         🗑️ {/* Remove Item */}
//                       </button>
//                     </div>
//                   </div>
//                 ))
//               )}

//               <h5 className="text-lg mb-4">
//                 <a href="/productlist" className="text-red-600 hover:underline">
//                   ← Continue Shopping
//                 </a>
//               </h5>
//             </div>

//             {/* Payment Summary */}
//             <div className="w-full lg:w-5/12 bg-gray-900 text-white rounded-lg p-6 shadow-md">
//               <h5 className="text-lg font-semibold mb-4">Payment Summary</h5>
//               <div className="flex justify-between items-center mb-4">
//                 <p className="text-sm text-gray-400">Subtotal</p>
//                 <p>Rs {cart.reduce((total, item) => total + item.price * item.quantity, 0)}</p>
//               </div>
//               <div className="flex justify-between items-center mb-4">
//                 <p className="text-sm text-gray-400">Shipping</p>
//                 <p>Rs 250</p>
//               </div>
//               <div className="flex justify-between items-center text-lg font-semibold">
//                 <p>Total</p>
//                 <p>
//                   Rs{" "}
//                   {cart.reduce((total, item) => total + item.price * item.quantity, 250)}
//                 </p>
//               </div>
//               <button className="w-full mt-6 bg-red-600 text-white p-3 rounded-lg hover:bg-red-700">
//                 Checkout
//               </button>
//             </div>
//           </div>
//         </div>
//       </section>
//       <Footer />
//     </>
//   );
// }
