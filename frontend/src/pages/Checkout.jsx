// "use client"; // Marking as client-side
// import Footer from "@/components/ui/footer";
// import Navbar from "@/components/ui/navbar";
// import { useState } from "react";
// export default function Checkout() {
//   // States for form data
//   const [shippingInfo, setShippingInfo] = useState({
//     firstName: "",
//     lastName: "",
//     address: "",
//     city: "",
//     state: "",
//     zip: "",
//   });

//   // Handle input change for shipping info
//   const handleShippingChange = (e) => {
//     const { name, value } = e.target;
//     setShippingInfo((prevState) => ({
//       ...prevState,
//       [name]: value,
//     }));
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     console.log("Shipping Info:", shippingInfo);
//     // Add your order processing logic here
//   };

//   return (
//     <div className="bg-black text-white">
//         <Navbar />
//       <div className="w-full max-w-3xl mx-auto p-8">
//         <div className="bg-gray-800 p-8 rounded-lg shadow-md border dark:border-white">
//           <h1 className="text-2xl font-bold text-white mb-4">Checkout</h1>

//           {/* Shipping Address Section */}
//           <form onSubmit={handleSubmit}>
//             <div className="mb-6">
//               <h2 className="text-xl font-semibold text-white mb-2">Shipping Address</h2>
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label htmlFor="first_name" className="block text-white mb-1">First Name</label>
//                   <input
//                     type="text"
//                     id="first_name"
//                     name="firstName"
//                     value={shippingInfo.firstName}
//                     onChange={handleShippingChange}
//                     className="w-full rounded-lg border py-2 px-3 bg-white text-white dark:bg-white dark:text-white dark:border-none"
//                   />
//                 </div>
//                 <div>
//                   <label htmlFor="last_name" className="block text-white mb-1">Last Name</label>
//                   <input
//                     type="text"
//                     id="last_name"
//                     name="lastName"
//                     value={shippingInfo.lastName}
//                     onChange={handleShippingChange}
//                     className="w-full rounded-lg border py-2 px-3 bg-white text-white dark:bg-white dark:text-white dark:border-none"
//                   />
//                 </div>
//               </div>

//               <div className="mt-4">
//                 <label htmlFor="address" className="block text-white mb-1">Address</label>
//                 <input
//                   type="text"
//                   id="address"
//                   name="address"
//                   value={shippingInfo.address}
//                   onChange={handleShippingChange}
//                   className="w-full rounded-lg border py-2 px-3 bg-white text-white dark:bg-white dark:text-white dark:border-none"
//                 />
//               </div>

//               <div className="mt-4">
//                 <label htmlFor="city" className="block text-white mb-1">City</label>
//                 <input
//                   type="text"
//                   id="city"
//                   name="city"
//                   value={shippingInfo.city}
//                   onChange={handleShippingChange}
//                   className="w-full rounded-lg border py-2 px-3 bg-white text-white dark:bg-white dark:text-white dark:border-none"
//                 />
//               </div>

//               <div className="grid grid-cols-2 gap-4 mt-4">
//                 <div>
//                   <label htmlFor="state" className="block text-white mb-1">State</label>
//                   <input
//                     type="text"
//                     id="state"
//                     name="state"
//                     value={shippingInfo.state}
//                     onChange={handleShippingChange}
//                     className="w-full rounded-lg border py-2 px-3 bg-white text-white dark:bg-white dark:text-white dark:border-none"
//                   />
//                 </div>
//                 <div>
//                   <label htmlFor="zip" className="block text-white mb-1">ZIP Code</label>
//                   <input
//                     type="text"
//                     id="zip"
//                     name="zip"
//                     value={shippingInfo.zip}
//                     onChange={handleShippingChange}
//                     className="w-full rounded-lg border py-2 px-3 bg-white text-white dark:bg-white dark:text-white dark:border-none"
//                   />
//                 </div>
//               </div>
//             </div>

//             {/* Message for Cash on Delivery */}
//             <div className="mt-4">
//               <p className="text-xl font-semibold text-white">Only cash on delivery is available</p>
//             </div>

//             {/* Submit Button */}
//             <div className="mt-8 flex justify-end">
//               <button
//                 type="submit"
//                 className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all"
//               >
//                 Place Order
//               </button>
//             </div>
//           </form>
//         </div>
//       </div>
//       <Footer />
//     </div>
//   );
// }
// "use client";
// import Footer from "@/components/ui/footer";
// import Navbar from "@/components/ui/navbar";
// import { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";

// export default function Checkout() {
//   const router = useRouter();

//   // States for form data
//   const [shippingInfo, setShippingInfo] = useState({
//     fullName: "",
//     phone: "",
//     address: "",
//     city: "",
//     postalCode: "",
//     country: "",
//   });

//   const [cartItems, setCartItems] = useState([]);

//   // Fetch cart items from localStorage or API
//   useEffect(() => {
//     const storedCart = JSON.parse(localStorage.getItem("cart")) || [];
//     setCartItems(storedCart);
//   }, []);

//   // Handle input change for shipping info
//   const handleShippingChange = (e) => {
//     const { name, value } = e.target;
//     setShippingInfo((prevState) => ({
//       ...prevState,
//       [name]: value,
//     }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (cartItems.length === 0) {
//       alert("Your cart is empty!");
//       return;
//     }

//     const orderData = {
//       user: "USER_ID_HERE", // Replace with actual logged-in user ID
//       items: cartItems.map((item) => ({
//         product: item.id,
//         quantity: item.quantity,
//         price: item.price,
//       })),
//       totalAmount: cartItems.reduce((total, item) => total + item.price * item.quantity, 0),
//       shippingAddress: shippingInfo,
//       status: "Pending",
//       paymentStatus: "Pending",
//       orderDate: new Date().toISOString(),
//     };

//     try {
//       const response = await fetch("/api/orders", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(orderData),
//       });

//       if (response.ok) {
//         alert("Order placed successfully!");
//         localStorage.removeItem("cart"); // Clear cart after order placement
//         router.push("/pages/OrderConfirmation"); // Redirect to confirmation page
//       } else {
//         alert("Failed to place order. Please try again.");
//       }
//     } catch (error) {
//       console.error("Error placing order:", error);
//       alert("An error occurred. Please try again later.");
//     }
//   };

//   return (
//     <div className="bg-black text-white">
//       <Navbar />
//       <div className="w-full max-w-3xl mx-auto p-8">
//         <div className="bg-gray-800 p-8 rounded-lg shadow-md border dark:border-white">
//           <h1 className="text-2xl font-bold text-white mb-4">Checkout</h1>

//           <form onSubmit={handleSubmit}>
//             <div className="mb-6">
//               <h2 className="text-xl font-semibold text-white mb-2">Shipping Address</h2>
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label htmlFor="fullName" className="block text-white mb-1">Full Name</label>
//                   <input
//                     type="text"
//                     id="fullName"
//                     name="fullName"
//                     value={shippingInfo.fullName}
//                     onChange={handleShippingChange}
//                     className="w-full rounded-lg border py-2 px-3 bg-white text-black"
//                     required
//                   />
//                 </div>
//                 <div>
//                   <label htmlFor="phone" className="block text-white mb-1">Phone</label>
//                   <input
//                     type="text"
//                     id="phone"
//                     name="phone"
//                     value={shippingInfo.phone}
//                     onChange={handleShippingChange}
//                     className="w-full rounded-lg border py-2 px-3 bg-white text-black"
//                     required
//                   />
//                 </div>
//               </div>

//               <div className="mt-4">
//                 <label htmlFor="address" className="block text-white mb-1">Address</label>
//                 <input
//                   type="text"
//                   id="address"
//                   name="address"
//                   value={shippingInfo.address}
//                   onChange={handleShippingChange}
//                   className="w-full rounded-lg border py-2 px-3 bg-white text-black"
//                   required
//                 />
//               </div>

//               <div className="grid grid-cols-2 gap-4 mt-4">
//                 <div>
//                   <label htmlFor="city" className="block text-white mb-1">City</label>
//                   <input
//                     type="text"
//                     id="city"
//                     name="city"
//                     value={shippingInfo.city}
//                     onChange={handleShippingChange}
//                     className="w-full rounded-lg border py-2 px-3 bg-white text-black"
//                     required
//                   />
//                 </div>
//                 <div>
//                   <label htmlFor="postalCode" className="block text-white mb-1">ZIP Code</label>
//                   <input
//                     type="text"
//                     id="postalCode"
//                     name="postalCode"
//                     value={shippingInfo.postalCode}
//                     onChange={handleShippingChange}
//                     className="w-full rounded-lg border py-2 px-3 bg-white text-black"
//                     required
//                   />
//                 </div>
//               </div>
//               <div className="mt-4">
//                 <label htmlFor="country" className="block text-white mb-1">Country</label>
//                 <input
//                   type="text"
//                   id="country"
//                   name="country"
//                   value={shippingInfo.country}
//                   onChange={handleShippingChange}
//                   className="w-full rounded-lg border py-2 px-3 bg-white text-black"
//                   required
//                 />
//               </div>
//             </div>
//             <div className="mt-4">
//               <p className="text-xl font-semibold text-white">Only cash on delivery is available</p>
//             </div>

//             <div className="mt-8 flex justify-end">
//               <button
//                 type="submit"
//                 className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all"
//               >
//                 Place Order
//               </button>
//             </div>
//           </form>
//         </div>
//       </div>
//       <Footer />
//     </div>
//   );
// }

import Footer from "@/components/ui/footer";
import Navbar from "@/components/ui/navbar";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "@/api/axiosInstance";

export default function Checkout() {
  const navigate = useNavigate();

  // States for form data
  const [shippingInfo, setShippingInfo] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
  });

  const [cartItems, setCartItems] = useState([]);

  // Fetch cart items from localStorage
  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem("cart")) || [];
    setCartItems(storedCart);
  }, []);

  // Handle input change for shipping info
  const handleShippingChange = (e) => {
    const { name, value } = e.target;
    setShippingInfo((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (cartItems.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    const orderData = {
      items: cartItems.map((item) => ({
        product: item.id,
        quantity: item.quantity,
        price: item.price,
      })),
      totalAmount: cartItems.reduce((total, item) => total + item.price * item.quantity, 0),
      shippingAddress: shippingInfo,
    };

    try {
      const response = await axiosInstance.post("/orders", orderData);
      if (response.status >= 200 && response.status < 300) {
        localStorage.setItem("orderDetails", JSON.stringify(response.data));
        localStorage.removeItem("cart");
        navigate("/order-confirmation");
      } else {
        alert("Failed to place order. Please try again.");
      }
    } catch (error) {
      console.error("Error placing order:", error);
      alert(error.response?.data?.detail || "An error occurred. Please try again later.");
    }
  };

  return (
    <div className="bg-black text-white min-h-screen">
      <Navbar />
      <div className="w-full max-w-3xl mx-auto p-8">
        <div className="bg-gray-800 p-8 rounded-lg shadow-md border dark:border-white">
          <h1 className="text-2xl font-bold text-white mb-4">Checkout</h1>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-2">Shipping Address</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="fullName" className="block text-white mb-1">Full Name</label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={shippingInfo.fullName}
                    onChange={handleShippingChange}
                    className="w-full rounded-lg border py-2 px-3 bg-white text-black"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-white mb-1">Phone</label>
                  <input
                    type="text"
                    id="phone"
                    name="phone"
                    value={shippingInfo.phone}
                    onChange={handleShippingChange}
                    className="w-full rounded-lg border py-2 px-3 bg-white text-black"
                    required
                  />
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="address" className="block text-white mb-1">Address</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={shippingInfo.address}
                  onChange={handleShippingChange}
                  className="w-full rounded-lg border py-2 px-3 bg-white text-black"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label htmlFor="city" className="block text-white mb-1">City</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={shippingInfo.city}
                    onChange={handleShippingChange}
                    className="w-full rounded-lg border py-2 px-3 bg-white text-black"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="postalCode" className="block text-white mb-1">ZIP Code</label>
                  <input
                    type="text"
                    id="postalCode"
                    name="postalCode"
                    value={shippingInfo.postalCode}
                    onChange={handleShippingChange}
                    className="w-full rounded-lg border py-2 px-3 bg-white text-black"
                    required
                  />
                </div>
              </div>
              <div className="mt-4">
                <label htmlFor="country" className="block text-white mb-1">Country</label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  value={shippingInfo.country}
                  onChange={handleShippingChange}
                  className="w-full rounded-lg border py-2 px-3 bg-white text-black"
                  required
                />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xl font-semibold text-white">Only cash on delivery is available</p>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all"
              >
                Place Order
              </button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}
