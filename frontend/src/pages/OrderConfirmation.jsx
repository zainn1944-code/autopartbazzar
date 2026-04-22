import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";

export default function OrderConfirmation() {
  const navigate = useNavigate();
  const [orderDetails, setOrderDetails] = useState(null);

  useEffect(() => {
    const storedOrder = JSON.parse(localStorage.getItem("orderDetails"));
    if (storedOrder) {
      setOrderDetails(storedOrder);
      localStorage.removeItem("orderDetails"); // Remove order details after displaying
      localStorage.removeItem("cart"); // Clear cart after successful order
    }
  }, []);

  if (!orderDetails) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white text-center">
        <p className="text-xl">Fetching order details...</p>
      </div>
    );
  }

  return (
    <div className="bg-black text-white min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow container mx-auto text-center p-8">
        <div className="bg-gray-900 p-8 rounded-lg shadow-md max-w-2xl mx-auto border border-gray-700">
          <h1 className="text-3xl font-bold text-green-400 mb-4">Order Placed Successfully! ✅</h1>
          <p className="text-lg text-gray-300">Thank you for shopping with us. Your order has been confirmed.</p>

          <div className="bg-gray-800 p-4 rounded-lg mt-6 text-left">
            <h2 className="text-xl font-semibold text-white mb-2">Order Details</h2>
            <p><span className="font-semibold">Order ID:</span> {orderDetails._id || orderDetails.id || "N/A"}</p>
            <p><span className="font-semibold">Total Amount:</span> Rs {(orderDetails.totalAmount ?? orderDetails.total_amount ?? 0).toLocaleString()}</p>
            <p><span className="font-semibold">Status:</span> {orderDetails.status}</p>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg mt-6 text-left">
            <h3 className="text-xl font-semibold text-white mb-2">Shipping Address</h3>
            <p className="text-gray-300">
              <span className="font-semibold">{orderDetails.shippingAddress.fullName}</span><br />
              {orderDetails.shippingAddress.address}, {orderDetails.shippingAddress.city},<br />
              {orderDetails.shippingAddress.postalCode}, {orderDetails.shippingAddress.country}
            </p>
          </div>

          {/* Redirect Only When Clicking the Button */}
          <button
            onClick={() => navigate("/productlist")}
            className="mt-6 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-all"
          >
            Back to Home
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
}
