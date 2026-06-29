import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import axiosInstance from "@/api/axiosInstance";

// Built-in DEMO payment gateway — simulates a hosted card page without any real
// gateway account or money. Used when PAYMENT_MODE resolves to "mock".
export default function MockPayment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [processing, setProcessing] = useState(false);

  const orderId = searchParams.get("order");
  const amount = useMemo(() => {
    const fromQuery = Number(searchParams.get("amount"));
    if (fromQuery) return fromQuery;
    const stored = JSON.parse(localStorage.getItem("orderDetails") || "null");
    return stored?.totalAmount ?? stored?.total_amount ?? 0;
  }, [searchParams]);

  useEffect(() => {
    if (!orderId) navigate("/cart");
  }, [orderId, navigate]);

  const settle = async (outcome) => {
    setProcessing(true);
    try {
      await axiosInstance.post("/payments/mock/complete", {
        order_id: Number(orderId),
        outcome,
      });
    } catch (err) {
      console.error("Mock payment error:", err);
    }
    const status = outcome === "success" ? "success" : "failed";
    navigate(`/order-confirmation?payment=${status}&order=${orderId}`);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Navbar />
      <div className="flex flex-grow items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl">
          <div className="mb-6 rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-4 py-2 text-center text-xs font-semibold text-yellow-300">
            DEMO / TEST MODE — no real money is charged
          </div>

          <h1 className="text-2xl font-bold text-white">Secure Payment</h1>
          <p className="mt-1 text-sm text-gray-400">
            Order #{orderId} • Auto Part Bazar
          </p>

          <div className="my-6 rounded-xl bg-black/40 p-5 text-center">
            <p className="text-xs uppercase tracking-widest text-gray-500">Amount due</p>
            <p className="mt-1 text-3xl font-black text-white">
              <span className="text-lg font-bold text-red-500">Rs </span>
              {Number(amount).toLocaleString()}
            </p>
          </div>

          {/* Visual-only card form (demo) */}
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-gray-400">Card Number</label>
              <input
                type="text"
                defaultValue="4111 1111 1111 1111"
                className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none focus:border-red-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-gray-400">Expiry</label>
                <input type="text" defaultValue="12/29" className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none focus:border-red-500" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-gray-400">CVC</label>
                <input type="text" defaultValue="123" className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none focus:border-red-500" />
              </div>
            </div>
          </div>

          <button
            onClick={() => settle("success")}
            disabled={processing}
            className="mt-6 w-full rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-6 py-4 font-bold text-white transition-all hover:shadow-[0_0_30px_rgba(220,38,38,0.5)] active:scale-[0.98] disabled:opacity-50"
          >
            {processing ? "Processing..." : `Pay Rs ${Number(amount).toLocaleString()}`}
          </button>
          <button
            onClick={() => settle("fail")}
            disabled={processing}
            className="mt-3 w-full rounded-xl border border-white/10 px-6 py-3 font-semibold text-gray-300 transition-colors hover:bg-white/5 disabled:opacity-50"
          >
            Cancel / Simulate Failure
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
}
