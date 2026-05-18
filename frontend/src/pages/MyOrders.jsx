import { useEffect, useState } from "react";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import axiosInstance from "@/api/axiosInstance";

function formatOrderDate(value) {
  if (!value) return "Pending";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await axiosInstance.get("/orders/me");
        setOrders(data.orders || []);
      } catch (requestError) {
        setError(requestError.response?.data?.detail || "Failed to load your orders.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 dark:bg-[#050505] text-gray-900 dark:text-white selection:bg-red-500/30">
        <div className="relative border-b border-white/5 bg-black">
          <div className="absolute inset-0 bg-gradient-to-r from-red-900/10 via-black to-black" />
          <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              My Orders
            </h1>
            <p className="mt-2 max-w-2xl text-gray-400">
              Track your recent purchases and any saved custom builds that made it to checkout.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          {loading && (
            <div className="flex min-h-[240px] items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-red-500" />
            </div>
          )}

          {!loading && error && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-6 py-5 text-red-200">
              {error}
            </div>
          )}

          {!loading && !error && orders.length === 0 && (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] px-6 py-16 text-center text-gray-300">
              No orders yet. Your confirmed purchases will appear here.
            </div>
          )}

          {!loading && !error && orders.length > 0 && (
            <div className="space-y-6">
              {orders.map((order) => (
                <section
                  key={order.id}
                  className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl"
                >
                  <div className="flex flex-col gap-3 border-b border-white/10 pb-5 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-[0.2em] text-red-400">
                        Order #{order._id || order.id}
                      </p>
                      <h2 className="mt-1 text-2xl font-bold text-white">
                        {order.status}
                      </h2>
                      <p className="mt-1 text-sm text-gray-400">
                        Placed {formatOrderDate(order.orderDate)}
                      </p>
                    </div>
                    <div className="text-left md:text-right">
                      <p className="text-sm text-gray-400">Payment</p>
                      <p className="text-lg font-semibold text-white">{order.paymentStatus}</p>
                      <p className="mt-2 text-sm text-gray-400">
                        Total <span className="font-bold text-white">Rs {(order.totalAmount || 0).toLocaleString()}</span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-4">
                    {order.items.map((item, index) => {
                      const snapshot = item.snapshot || {};
                      return (
                        <div
                          key={`${order.id}-${index}`}
                          className="rounded-2xl border border-white/5 bg-black/30 p-4"
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <h3 className="text-lg font-semibold text-white">
                                {snapshot.name || "Catalog item"}
                              </h3>
                              <p className="text-sm text-gray-400">
                                {[snapshot.make, snapshot.category].filter(Boolean).join(" / ") || "Order item"}
                              </p>
                              {snapshot.selectedColorName && (
                                <p className="mt-1 text-sm text-gray-400">
                                  Color: <span className="text-gray-200">{snapshot.selectedColorName}</span>
                                </p>
                              )}
                              {Array.isArray(snapshot.selectedParts) && snapshot.selectedParts.length > 0 && (
                                <p className="mt-1 text-sm text-gray-400">
                                  Parts:{" "}
                                  <span className="text-gray-200">
                                    {snapshot.selectedParts.map((part) => part.name).join(", ")}
                                  </span>
                                </p>
                              )}
                            </div>
                            <div className="text-left sm:text-right">
                              <p className="text-sm text-gray-400">Qty {item.quantity}</p>
                              <p className="text-lg font-bold text-white">
                                Rs {(item.price * item.quantity).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
