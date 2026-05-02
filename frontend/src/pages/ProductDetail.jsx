import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "@/api/axiosInstance";
import { useCart } from "@/context/CartContext.jsx";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import ProductVisual from "@/components/ui/ProductVisual";

const ProductDetail = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState("");
  const [newReview, setNewReview] = useState({ text: "", rating: 0 });
  const [productReviews, setProductReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);

  const navigate = useNavigate();
  const descriptionText =
    product?.description ||
    `${product?.category || "Auto part"}${product?.make ? ` for ${product.make}` : ""}. Built for performance and reliability.`;

  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      try {
        const { data } = await axiosInstance.get(`/products/${id}`);
        setProduct(data);
        setSelectedImage(data.imageUrl);
      } catch (requestError) {
        setError(requestError.response?.data?.detail || "Product not found");
      } finally {
        setLoading(false);
      }
    };

    const fetchReviews = async () => {
      try {
        const { data: reviews } = await axiosInstance.get(`/reviews/${id}`);
        setProductReviews(reviews);
        setAverageRating(
          reviews.length > 0
            ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length
            : 0
        );
      } catch (requestError) {
        console.error("Error fetching reviews", requestError);
      }
    };

    fetchProduct();
    fetchReviews();
  }, [id]);

  const increaseQuantity = () => setQuantity((current) => current + 1);
  const decreaseQuantity = () => setQuantity((current) => (current > 1 ? current - 1 : 1));

  const handleAddToCart = () => {
    if (product) {
      addToCart({
        id: product._id || String(product.id),
        productId: product.productId,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        category: product.category,
        make: product.make,
        description: descriptionText,
        quantity,
      });
    }
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate("/cart");
  };

  const handleReviewSubmit = async () => {
    if (!newReview.text || newReview.rating < 1) return;

    try {
      const response = await axiosInstance.post(`/reviews/${id}`, {
        text: newReview.text,
        rating: newReview.rating,
      });

      if (response.status >= 200 && response.status < 300) {
        const review = response.data;
        const nextReviews = [...productReviews, review];
        setProductReviews(nextReviews);
        setNewReview({ text: "", rating: 0 });
        setAverageRating(
          nextReviews.reduce((acc, currentReview) => acc + currentReview.rating, 0) /
            nextReviews.length
        );
      }
    } catch (requestError) {
      console.error("Error submitting review", requestError);
    }
  };

  const renderStars = (rating, interactive = false) => {
    const fullStars = Math.floor(rating);
    const emptyStars = 5 - fullStars;
    return (
      <div className="flex space-x-1">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className={`w-5 h-5 transition-colors ${
              interactive ? "cursor-pointer hover:scale-110" : ""
            } ${i < rating ? "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" : "text-gray-600"}`}
            fill="currentColor"
            viewBox="0 0 20 20"
            onClick={() => interactive && setNewReview({ ...newReview, rating: i + 1 })}
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-2xl backdrop-blur-xl">
            <h2 className="text-2xl font-bold text-red-400 mb-2">Oops!</h2>
            <p className="text-gray-300">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#050505] text-white selection:bg-red-500/30">
        <div className="mx-auto w-full max-w-7xl px-4 py-12 lg:py-20">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            {/* Visuals Left Pane */}
            <div className="relative group">
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-red-600/20 to-transparent blur-2xl transition-all duration-500 group-hover:blur-3xl opacity-50" />
              <div className="relative aspect-square w-full overflow-hidden rounded-3xl border border-white/5 bg-black/40 backdrop-blur-sm shadow-2xl">
                <ProductVisual
                  name={product.name}
                  make={product.make}
                  category={product.category}
                  imageUrl={selectedImage || product.imageUrl}
                  className="relative h-full w-full"
                  imageClassName="h-full w-full object-contain p-8 mix-blend-screen transition-transform duration-700 hover:scale-105"
                />
              </div>
            </div>

            {/* Product Info Right Pane */}
            <div className="flex flex-col">
              <div className="mb-4 flex flex-wrap gap-2">
                {product.make && (
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-gray-300 backdrop-blur-md">
                    {product.make}
                  </span>
                )}
                {product.category && (
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-gray-300 backdrop-blur-md">
                    {product.category}
                  </span>
                )}
                {product.city && (
                  <span className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-red-400 backdrop-blur-md">
                    {product.city}
                  </span>
                )}
              </div>

              <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-4">
                {product.name}
              </h1>

              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                  {renderStars(averageRating)}
                  <span className="text-sm font-medium text-gray-400">
                    ({productReviews.length} reviews)
                  </span>
                </div>
              </div>

              <div className="mb-8 flex items-end gap-3">
                <span className="text-4xl font-bold text-white">Rs {product.price}</span>
                {product.originalPrice > 0 && (
                  <span className="text-xl text-gray-500 line-through mb-1">
                    Rs {product.originalPrice}
                  </span>
                )}
              </div>

              <p className="text-lg leading-relaxed text-gray-400 mb-10 border-l-2 border-white/10 pl-4">
                {descriptionText}
              </p>

              {/* Purchase Controls */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
                <div className="flex items-center gap-6 mb-6">
                  <span className="text-sm font-semibold text-gray-300 uppercase tracking-widest">Quantity</span>
                  <div className="flex items-center bg-black/50 rounded-xl border border-white/10 overflow-hidden">
                    <button
                      onClick={decreaseQuantity}
                      className="px-4 py-2.5 text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <span className="w-12 text-center font-semibold text-lg">{quantity}</span>
                    <button
                      onClick={increaseQuantity}
                      className="px-4 py-2.5 text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={handleAddToCart}
                    className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-4 font-semibold text-white transition-all hover:bg-white/10 hover:border-white/20 active:scale-[0.98]"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    Add to Cart
                  </button>
                  <button
                    onClick={handleBuyNow}
                    className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-6 py-4 font-bold text-white shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all hover:shadow-[0_0_30px_rgba(220,38,38,0.5)] hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Buy Now
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-24 grid grid-cols-1 lg:grid-cols-3 gap-12 border-t border-white/10 pt-16">
            <div className="lg:col-span-2 space-y-8">
              <h3 className="text-2xl font-bold text-white mb-6">Customer Reviews</h3>
              {productReviews.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-800 bg-white/5 p-8 text-center text-gray-400">
                  No reviews yet. Be the first to share your experience!
                </div>
              ) : (
                <div className="space-y-6">
                  {productReviews.map((review, i) => (
                    <div key={i} className="rounded-2xl border border-white/5 bg-white/5 p-6 backdrop-blur-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center font-bold">
                            C
                          </div>
                          <div>
                            <p className="font-semibold text-gray-200">Customer</p>
                            <p className="text-xs text-gray-500">Verified Buyer</p>
                          </div>
                        </div>
                        {renderStars(review.rating)}
                      </div>
                      <p className="text-gray-300 leading-relaxed">{review.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-8 h-fit sticky top-24">
              <h3 className="text-xl font-bold text-white mb-6">Write a Review</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Rating</label>
                  {renderStars(newReview.rating, true)}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Your Experience</label>
                  <textarea
                    className="w-full rounded-xl border border-white/10 bg-black/50 p-4 text-white placeholder-gray-600 focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all outline-none resize-none"
                    placeholder="What did you like about this part?"
                    rows="4"
                    value={newReview.text}
                    onChange={(e) => setNewReview({ ...newReview, text: e.target.value })}
                  />
                </div>
                <button
                  onClick={handleReviewSubmit}
                  disabled={!newReview.text || newReview.rating < 1}
                  className="w-full rounded-xl bg-white text-black font-bold py-3 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Post Review
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ProductDetail;
