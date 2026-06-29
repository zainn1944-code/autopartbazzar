import Footer from "@/components/ui/footer";
import Navbar from "@/components/ui/navbar";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axiosInstance from "@/api/axiosInstance";
import { useCart } from "@/hooks/useCart";
import ProductVisual from "@/components/ui/ProductVisual";

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, subtotal, clearCart } = useCart();

  // States for form data
  const [shippingInfo, setShippingInfo] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("COD"); // "COD" | "JazzCash"

  useEffect(() => {
    if (cart.length === 0) {
      navigate("/cart"); // Redirect if empty
    }
  }, [cart.length, navigate]);

  const cartItems = cart;

  const shipping = 250;
  const total = subtotal + shipping;

  const handleShippingChange = (e) => {
    const { name, value } = e.target;
    setShippingInfo((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  // Build a hidden form and POST the customer's browser to JazzCash's hosted page.
  const redirectToJazzCash = (payment) => {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = payment.url;
    Object.entries(payment.fields).forEach(([name, value]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = value ?? "";
      form.appendChild(input);
    });
    document.body.appendChild(form);
    form.submit();
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();

    if (cartItems.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    setIsSubmitting(true);

    const orderData = {
      items: cartItems.map((item) => ({
        product: item.kind === "catalog" ? item.productRef || item.id : null,
        quantity: item.quantity,
        price: item.price,
        snapshot:
          item.snapshot || {
            itemType: item.kind || "catalog",
            name: item.name,
            make: item.make || null,
            category: item.category || null,
            imageUrl: item.imageUrl || null,
            description: item.description || null,
            productRef: item.productRef || null,
          },
      })),
      totalAmount: total,
      shippingAddress: shippingInfo,
      paymentMethod,
      // Same key on an accidental retry → backend returns the original order
      // instead of creating a duplicate.
      idempotencyKey:
        (window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`),
    };

    try {
      const response = await axiosInstance.post("/orders", orderData);
      if (response.status >= 200 && response.status < 300) {
        localStorage.setItem("orderDetails", JSON.stringify(response.data));
        // Online payment: hand off to the gateway (cart is cleared after payment).
        const pay = response.data.payment;
        if (pay?.provider === "jazzcash") {
          redirectToJazzCash(pay);
          return;
        }
        if (pay?.provider === "mock") {
          navigate(pay.redirectUrl);
          return;
        }
        clearCart();
        navigate("/order-confirmation");
      } else {
        alert("Failed to place order. Please try again.");
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Error placing order:", error);
      alert(error.response?.data?.detail || "An error occurred. Please try again later.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-[#050505] text-gray-900 dark:text-white min-h-screen selection:bg-red-500/30">
      <Navbar />
      
      {/* Premium Header */}
      <div className="relative border-b border-white/5 bg-black pt-8 pb-12">
        <div className="absolute inset-0 bg-gradient-to-r from-red-900/10 via-black to-black" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2">
            Secure Checkout
          </h1>
          <p className="text-gray-400">Complete your order below.</p>
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
          
          {/* Left Column: Form */}
          <div className="lg:col-span-7 xl:col-span-8">
            <form
              id="checkout-form"
              onSubmit={handleSubmit}
              className="space-y-8 rounded-3xl border border-white/10 bg-white/5 p-8 sm:p-10 backdrop-blur-xl shadow-2xl"
            >
              
              <div>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/20 border border-red-500/50 text-red-500 text-sm font-bold">1</span>
                  Shipping Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-semibold text-gray-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={shippingInfo.fullName}
                      onChange={handleShippingChange}
                      placeholder="John Doe"
                      className="w-full bg-black/50 border border-white/10 text-white placeholder-gray-600 rounded-xl px-5 py-4 text-base font-medium outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-semibold text-gray-400 uppercase tracking-widest mb-2 ml-1">Phone Number</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={shippingInfo.phone}
                      onChange={handleShippingChange}
                      placeholder="+1 (555) 000-0000"
                      className="w-full bg-black/50 border border-white/10 text-white placeholder-gray-600 rounded-xl px-5 py-4 text-base font-medium outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label htmlFor="address" className="block text-sm font-semibold text-gray-400 uppercase tracking-widest mb-2 ml-1">Street Address</label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={shippingInfo.address}
                    onChange={handleShippingChange}
                    placeholder="123 Performance Way, Suite 100"
                    className="w-full bg-black/50 border border-white/10 text-white placeholder-gray-600 rounded-xl px-5 py-4 text-base font-medium outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <label htmlFor="city" className="block text-sm font-semibold text-gray-400 uppercase tracking-widest mb-2 ml-1">City</label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={shippingInfo.city}
                      onChange={handleShippingChange}
                      placeholder="Los Angeles"
                      className="w-full bg-black/50 border border-white/10 text-white placeholder-gray-600 rounded-xl px-5 py-4 text-base font-medium outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="postalCode" className="block text-sm font-semibold text-gray-400 uppercase tracking-widest mb-2 ml-1">ZIP / Postal Code</label>
                    <input
                      type="text"
                      id="postalCode"
                      name="postalCode"
                      value={shippingInfo.postalCode}
                      onChange={handleShippingChange}
                      placeholder="90001"
                      className="w-full bg-black/50 border border-white/10 text-white placeholder-gray-600 rounded-xl px-5 py-4 text-base font-medium outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label htmlFor="country" className="block text-sm font-semibold text-gray-400 uppercase tracking-widest mb-2 ml-1">Country</label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    value={shippingInfo.country}
                    onChange={handleShippingChange}
                    placeholder="United States"
                    className="w-full bg-black/50 border border-white/10 text-white placeholder-gray-600 rounded-xl px-5 py-4 text-base font-medium outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="pt-8 border-t border-white/10">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/20 border border-red-500/50 text-red-500 text-sm font-bold">2</span>
                  Payment Method
                </h2>

                <div className="space-y-4">
                  {/* Cash on Delivery */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("COD")}
                    className={`w-full text-left rounded-xl border-2 p-6 flex items-start gap-4 transition-all ${
                      paymentMethod === "COD"
                        ? "border-red-500/50 bg-red-500/10"
                        : "border-white/10 bg-black/30 hover:border-white/20"
                    }`}
                  >
                    <span className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${paymentMethod === "COD" ? "border-red-500" : "border-gray-500"}`}>
                      {paymentMethod === "COD" && <span className="h-2.5 w-2.5 rounded-full bg-red-500" />}
                    </span>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">Cash on Delivery (COD)</h3>
                      <p className="text-gray-400 text-sm leading-relaxed">Pay with cash when your order is delivered to your doorstep.</p>
                    </div>
                  </button>

                  {/* JazzCash / Online */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("JazzCash")}
                    className={`w-full text-left rounded-xl border-2 p-6 flex items-start gap-4 transition-all ${
                      paymentMethod === "JazzCash"
                        ? "border-red-500/50 bg-red-500/10"
                        : "border-white/10 bg-black/30 hover:border-white/20"
                    }`}
                  >
                    <span className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${paymentMethod === "JazzCash" ? "border-red-500" : "border-gray-500"}`}>
                      {paymentMethod === "JazzCash" && <span className="h-2.5 w-2.5 rounded-full bg-red-500" />}
                    </span>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">Online Payment — JazzCash / Card</h3>
                      <p className="text-gray-400 text-sm leading-relaxed">Pay securely now with your JazzCash wallet or any debit/credit card. You'll be redirected to the secure payment page.</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Mobile Submit Button (Hidden on Desktop) */}
              <div className="lg:hidden pt-8 border-t border-white/10">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full relative group overflow-hidden rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-6 py-5 font-bold text-white shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all hover:shadow-[0_0_30px_rgba(220,38,38,0.5)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                  <span className="relative flex items-center justify-center gap-2 text-lg">
                    {isSubmitting ? "Processing..." : paymentMethod === "JazzCash" ? "Pay Now" : "Place Order Now"}
                  </span>
                </button>
              </div>

            </form>
          </div>

          {/* Right Column: Order Summary (Sticky) */}
          <div className="hidden lg:block lg:col-span-5 xl:col-span-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl sticky top-24 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-6">Order Summary</h3>
              
              <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-start gap-4 pb-4 border-b border-white/5">
                    <div className="relative w-16 h-16 rounded-xl bg-black/50 border border-white/10 overflow-hidden shrink-0">
                      <ProductVisual
                        name={item.name}
                        make={item.make}
                        category={item.category}
                        imageUrl={item.imageUrl}
                        compact
                        className="relative h-full w-full"
                        imageClassName="h-full w-full object-contain p-2"
                      />
                      <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center border-2 border-[#1a1a1a]">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-white truncate">{item.name}</h4>
                      <p className="text-xs text-gray-400 mt-1">{item.make} • {item.category}</p>
                      <p className="text-sm font-semibold text-gray-300 mt-1">Rs {(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 mb-6 pt-2">
                <div className="flex justify-between items-center text-gray-400 text-sm">
                  <span>Subtotal</span>
                  <span className="text-white font-medium">Rs {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-gray-400 text-sm">
                  <span>Shipping Estimate</span>
                  <span className="text-white font-medium">Rs {shipping.toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-6 border-t border-white/10 mb-8">
                <div className="flex justify-between items-end">
                  <span className="text-lg font-semibold text-white">Total</span>
                  <span className="text-3xl font-black text-white flex items-baseline gap-1">
                    <span className="text-lg font-bold text-red-500">Rs</span>
                    {total.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Desktop Submit Button */}
              <button
                type="submit"
                form="checkout-form"
                disabled={isSubmitting}
                className="w-full relative group overflow-hidden rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-6 py-5 font-bold text-white shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all hover:shadow-[0_0_30px_rgba(220,38,38,0.5)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                <span className="relative flex items-center justify-center gap-2 text-lg">
                  {isSubmitting ? "Processing..." : paymentMethod === "JazzCash" ? "Pay Now" : "Place Order Now"}
                  {!isSubmitting && (
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
              </button>

              <div className="mt-6 flex items-center justify-center gap-2 text-gray-500 text-sm font-medium">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Secure Checkout
              </div>
            </div>
          </div>
          
        </div>
      </div>
      <Footer />
    </div>
  );
}
