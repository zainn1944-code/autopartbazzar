import { useCart } from "@/context/CartContext.jsx";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import ProductVisual from "@/components/ui/ProductVisual";
import { useNavigate, Link } from "react-router-dom";

export default function ShoppingCart() {
  const { cart, updateQuantity, removeFromCart } = useCart();
  const navigate = useNavigate();

  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const shipping = 250;
  const total = subtotal > 0 ? subtotal + shipping : 0;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#050505] selection:bg-red-500/30">
        {/* Premium Header */}
        <div className="relative border-b border-white/5 bg-black">
          <div className="absolute inset-0 bg-gradient-to-r from-red-900/10 via-black to-black" />
          <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Shopping Cart
              </h1>
              <p className="mt-2 text-gray-400">
                You have <span className="font-bold text-red-500">{cart.length}</span> items in your cart.
              </p>
            </div>
            {cart.length > 0 && (
              <Link
                to="/productlist"
                className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Continue Shopping
              </Link>
            )}
          </div>
        </div>

        <section className="py-12 relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/5 blur-[120px] rounded-full pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              
              {/* Left Column: Cart Items */}
              <div className="lg:col-span-8 space-y-6">
                {cart.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-16 text-center backdrop-blur-sm">
                    <div className="mx-auto w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                      <svg className="w-10 h-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Your cart is empty</h2>
                    <p className="text-gray-400 mb-8 max-w-sm mx-auto">Looks like you haven't added any high-performance parts to your cart yet.</p>
                    <Link
                      to="/productlist"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-white text-black px-8 py-4 font-bold transition-all hover:bg-gray-200"
                    >
                      Browse Catalog
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="group relative rounded-3xl border border-white/5 bg-white/[0.03] p-6 backdrop-blur-md transition-all hover:border-white/10 hover:bg-white/[0.05]"
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                          {/* Product Image */}
                          <div className="w-full sm:w-32 aspect-square rounded-2xl bg-black/50 border border-white/5 overflow-hidden shrink-0 relative">
                            <ProductVisual
                              name={item.name}
                              make={item.make}
                              category={item.category}
                              imageUrl={item.imageUrl}
                              compact
                              className="relative h-full w-full"
                              imageClassName="h-full w-full object-contain p-4 group-hover:scale-110 transition-transform duration-500"
                            />
                          </div>

                          {/* Product Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col h-full justify-between gap-4">
                              <div>
                                <div className="flex items-start justify-between gap-4 mb-1">
                                  <h3 className="text-lg font-bold text-white truncate">{item.name}</h3>
                                  <button
                                    onClick={() => removeFromCart(item.id)}
                                    className="text-gray-500 hover:text-red-500 transition-colors p-1"
                                    title="Remove item"
                                  >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                                <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                                  {item.make && <span>{item.make}</span>}
                                  {item.make && item.category && <span>•</span>}
                                  {item.category && <span>{item.category}</span>}
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center justify-between gap-4">
                                {/* Quantity Selector */}
                                <div className="flex items-center bg-black/50 rounded-xl border border-white/10 overflow-hidden w-fit">
                                  <button
                                    onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                    className="px-3 py-2 text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                    </svg>
                                  </button>
                                  <span className="w-10 text-center font-semibold text-white text-sm">{item.quantity}</span>
                                  <button
                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                    className="px-3 py-2 text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                  </button>
                                </div>

                                {/* Price */}
                                <div className="text-right">
                                  <span className="text-xl font-bold text-white flex items-baseline gap-1">
                                    <span className="text-sm font-semibold text-red-500">Rs</span>
                                    {(item.price * item.quantity).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Payment Summary */}
              {cart.length > 0 && (
                <div className="lg:col-span-4">
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl sticky top-24 shadow-2xl">
                    <h3 className="text-xl font-bold text-white mb-6">Order Summary</h3>
                    
                    <div className="space-y-4 mb-6">
                      <div className="flex justify-between items-center text-gray-400">
                        <span>Subtotal</span>
                        <span className="text-white font-medium">Rs {subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-gray-400">
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
                      <p className="text-xs text-gray-500 mt-2 text-right">Taxes included if applicable</p>
                    </div>

                    <button
                      onClick={() => navigate("/checkout")}
                      className="w-full relative group overflow-hidden rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-6 py-5 font-bold text-white shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all hover:shadow-[0_0_30px_rgba(220,38,38,0.5)] active:scale-[0.98]"
                    >
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                      <span className="relative flex items-center justify-center gap-2 text-lg">
                        Proceed to Checkout
                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
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
              )}
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}
