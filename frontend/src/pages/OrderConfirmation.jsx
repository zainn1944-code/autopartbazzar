import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import { useCart } from "@/hooks/useCart";

export default function OrderConfirmation() {
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const [searchParams] = useSearchParams();
  const [orderDetails, setOrderDetails] = useState(null);

  // Set by the JazzCash callback redirect: "success" | "failed" (absent for COD).
  const paymentStatus = searchParams.get("payment");
  const paymentFailed = paymentStatus === "failed";

  useEffect(() => {
    const storedOrder = JSON.parse(localStorage.getItem("orderDetails"));
    if (storedOrder) {
      setOrderDetails(storedOrder);
    }
    // Keep the cart on a failed online payment so the customer can retry.
    if (!paymentFailed) {
      localStorage.removeItem("orderDetails");
      clearCart();
    }
  }, [clearCart, paymentFailed]);

  if (paymentFailed) {
    return (
      <>
        <Navbar />
        <div className="flex min-h-[70vh] items-center justify-center bg-black px-6 text-center text-white">
          <div className="mx-auto max-w-md rounded-lg border border-red-800 bg-gray-900 p-8">
            <h1 className="mb-3 text-3xl font-bold text-red-400">Payment Failed</h1>
            <p className="text-gray-300">
              Your payment could not be completed
              {orderDetails?._id ? ` for order #${orderDetails._id}` : ""}. No amount was charged.
              You can try again or choose Cash on Delivery.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                to="/checkout"
                className="rounded-xl bg-red-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-red-500"
              >
                Try Again
              </Link>
              <Link
                to="/orders"
                className="rounded-xl border border-gray-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-gray-800"
              >
                View Orders
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!orderDetails) {
    return (
      <>
        <Navbar />
        <div className="flex min-h-[70vh] items-center justify-center bg-black px-6 text-center text-white">
          <div>
            <p className="text-xl">No recent order confirmation is available.</p>
            <Link
              to="/orders"
              className="mt-6 inline-flex rounded-xl bg-red-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-red-500"
            >
              View Order History
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Navbar />
      <div className="container mx-auto flex-grow p-8 text-center">
        <div className="mx-auto max-w-2xl rounded-lg border border-gray-700 bg-gray-900 p-8 shadow-md">
          <h1 className="mb-4 text-3xl font-bold text-green-400">Order Placed Successfully!</h1>
          <p className="text-lg text-gray-300">
            Thank you for shopping with us. Your order has been confirmed.
          </p>

          <div className="mt-6 rounded-lg bg-gray-800 p-4 text-left">
            <h2 className="mb-2 text-xl font-semibold text-white">Order Details</h2>
            <p>
              <span className="font-semibold">Order ID:</span> {orderDetails._id || orderDetails.id || "N/A"}
            </p>
            <p>
              <span className="font-semibold">Total Amount:</span> Rs{" "}
              {(orderDetails.totalAmount ?? orderDetails.total_amount ?? 0).toLocaleString()}
            </p>
            <p>
              <span className="font-semibold">Status:</span> {orderDetails.status}
            </p>
          </div>

          <div className="mt-6 rounded-lg bg-gray-800 p-4 text-left">
            <h3 className="mb-2 text-xl font-semibold text-white">Shipping Address</h3>
            <p className="text-gray-300">
              <span className="font-semibold">{orderDetails.shippingAddress.fullName}</span>
              <br />
              {orderDetails.shippingAddress.address}, {orderDetails.shippingAddress.city},
              <br />
              {orderDetails.shippingAddress.postalCode}, {orderDetails.shippingAddress.country}
            </p>
          </div>

          <button
            onClick={() => navigate("/orders")}
            className="mt-6 rounded-lg bg-red-600 px-4 py-2 text-white transition-all hover:bg-red-700"
          >
            View My Orders
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
}
