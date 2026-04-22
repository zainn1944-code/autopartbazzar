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
    `${product?.category || "Auto part"}${product?.make ? ` for ${product.make}` : ""}.`;

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

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const emptyStars = 5 - fullStars;
    return (
      <div className="flex">
        {[...Array(fullStars)].map((_, i) => (
          <span key={i} className="text-yellow-500">&#9733;</span>
        ))}
        {[...Array(emptyStars)].map((_, i) => (
          <span key={i} className="text-gray-500">&#9734;</span>
        ))}
      </div>
    );
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!product) return <p className="text-gray-500">No product found.</p>;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-black">
        <div className="mx-auto w-full max-w-7xl p-4">
          <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-5">
            <div className="min-h-[500px] w-full rounded-lg bg-[#0a0a0a] p-6 text-center lg:col-span-3">
              <ProductVisual
                name={product.name}
                make={product.make}
                category={product.category}
                imageUrl={selectedImage || product.imageUrl}
                className="relative mx-auto h-[400px] w-full overflow-hidden rounded-xl"
                imageClassName="h-full w-full rounded-xl bg-black/20 object-contain p-6"
              />
            </div>

            <div className="lg:col-span-2 text-gray-100">
              <h2 className="text-3xl font-bold">{product.name}</h2>
              <p className="text-xl font-bold text-red-500">Rs {product.price}</p>
              <div className="mt-4 flex space-x-2">{renderStars(averageRating)}</div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-wide text-gray-400">
                {product.make && <span>{product.make}</span>}
                {product.category && <span>{product.category}</span>}
                {product.city && <span>{product.city}</span>}
              </div>
              <p className="mt-2 text-gray-300">{descriptionText}</p>

              <div className="mt-4 flex items-center space-x-4">
                <button
                  onClick={decreaseQuantity}
                  className="rounded bg-gray-700 px-4 py-2 text-white"
                >
                  -
                </button>
                <span className="text-xl">{quantity}</span>
                <button
                  onClick={increaseQuantity}
                  className="rounded bg-gray-700 px-4 py-2 text-white"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                className="mt-4 w-full rounded-md bg-red-500 px-6 py-3 text-white hover:bg-red-600"
              >
                Add to Cart
              </button>
            </div>
          </div>

          <div className="mt-12 rounded-lg bg-gray-900 p-6">
            <h3 className="text-xl font-bold text-gray-100">Customer Reviews</h3>
            <div className="mt-4 space-y-6">
              {productReviews.length === 0 && (
                <p className="text-gray-400">No reviews yet. Be the first to review this product.</p>
              )}
              {productReviews.map((review, i) => (
                <div key={i} className="text-gray-300">
                  {renderStars(review.rating)}
                  <p className="font-semibold text-gray-100">Customer</p>
                  <p>{review.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 rounded-lg bg-gray-900 p-6">
            <h3 className="text-xl font-bold text-gray-100">Submit Your Review</h3>
            <textarea
              className="mt-4 w-full rounded-md bg-gray-100 p-3 text-gray-900"
              placeholder="Write your review..."
              value={newReview.text}
              onChange={(e) => setNewReview({ ...newReview, text: e.target.value })}
            />
            <div className="mt-4 flex space-x-2">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={`cursor-pointer ${newReview.rating > i ? "text-yellow-500" : "text-gray-500"}`}
                  onClick={() => setNewReview({ ...newReview, rating: i + 1 })}
                >
                  &#9733;
                </span>
              ))}
            </div>
            <button
              onClick={handleReviewSubmit}
              className="mt-4 w-full rounded-md bg-red-500 px-6 py-3 text-white hover:bg-red-600"
            >
              Submit Review
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ProductDetail;
