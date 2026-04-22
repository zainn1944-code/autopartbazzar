// "use client";

// import React, { useEffect, useState } from "react";
// import { useParams } from "next/navigation";
// import Navbar from "@/components/ui/navbar";
// import Footer from "@/components/ui/footer";
// import ProductCustomerSection from "@/components/ui/ProductCustomerSection";

// const ProductDetail = () => {
//   const { id } = useParams();
//   const [product, setProduct] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [quantity, setQuantity] = useState(1);
//   const [selectedImage, setSelectedImage] = useState("");
//   const [newReview, setNewReview] = useState({ text: "", rating: 0, username: "User" });
//   const [productReviews, setProductReviews] = useState([]);
//   const [averageRating, setAverageRating] = useState(0);

//   useEffect(() => {
//     if (!id) return;
    
//     const fetchProduct = async () => {
//       try {
//         const response = await fetch(`/api/products/${id}`);
//         if (!response.ok) throw new Error("Product not found");
//         const data = await response.json();
//         setProduct(data);
//         setSelectedImage(data.imageUrl);
//         setProductReviews(data.reviews || []);
//         setAverageRating(data.averageRating || 0);
//       } catch (error) {
//         setError(error.message);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchProduct();
//   }, [id]);

//   const increaseQuantity = () => setQuantity(quantity + 1);
//   const decreaseQuantity = () => setQuantity(quantity > 1 ? quantity - 1 : 1);

//   const handleReviewSubmit = () => {
//     if (newReview.text && newReview.rating > 0) {
//       const updatedReviews = [...productReviews, newReview];
//       setProductReviews(updatedReviews);
//       setNewReview({ text: "", rating: 0, username: "User" });
//       setAverageRating(updatedReviews.reduce((acc, review) => acc + review.rating, 0) / updatedReviews.length);
//     }
//   };

//   const renderStars = (rating) => {
//     const fullStars = Math.floor(rating);
//     const emptyStars = 5 - fullStars;
//     return (
//       <div className="flex">
//         {[...Array(fullStars)].map((_, i) => (
//           <span key={i} className="text-yellow-500">&#9733;</span>
//         ))}
//         {[...Array(emptyStars)].map((_, i) => (
//           <span key={i} className="text-gray-500">&#9734;</span>
//         ))}
//       </div>
//     );
//   };

//   if (loading) return <p>Loading...</p>;
//   if (error) return <p className="text-red-500">{error}</p>;
//   if (!product) return <p className="text-gray-500">No product found.</p>;

//   return (
//     <>
//       <Navbar />
//       <div className="font-sans min-h-screen bg-[#0a0a0a] flex justify-center items-center">
//         <div className="p-4 lg:max-w-7xl max-w-xl w-full mx-auto">
//           <div className="grid items-start grid-cols-1 lg:grid-cols-5 gap-12">
//             <div className="min-h-[500px] lg:col-span-3 bg-[#0a0a0a] rounded-lg w-full text-center p-6">
//               <img src={selectedImage} alt="Product" className="w-full max-h-[400px] object-contain rounded mx-auto py-6" />
//               <div className="flex flex-wrap gap-4 justify-center mt-4">
//                 {[product.imageUrl, ...(product.additionalImages || [])].map((img, index) => (
//                   <img key={index} src={img} className={`w-20 h-20 cursor-pointer rounded-lg p-2 ${selectedImage === img ? 'border-2 border-red-500' : ''}`} onClick={() => setSelectedImage(img)} />
//                 ))}
//               </div>
//             </div>

//             <div className="lg:col-span-2 text-gray-100">
//               <h2 className="text-3xl font-bold">{product.name}</h2>
//               <p className="text-red-500 text-xl font-bold">Rs {product.price}</p>
//               {product.originalPrice && <p className="text-gray-400 line-through">Rs {product.originalPrice}</p>}
//               <div className="flex space-x-2 mt-4">{renderStars(averageRating)}</div>
//               <p className="mt-2 text-gray-300">{product.description}</p>
//               <div className="flex gap-4 mt-6">
//                 <button onClick={decreaseQuantity} className="px-4 py-2 bg-gray-600 text-white rounded-md">-</button>
//                 <span className="text-xl font-semibold">{quantity}</span>
//                 <button onClick={increaseQuantity} className="px-4 py-2 bg-gray-600 text-white rounded-md">+</button>
//               </div>
//               <button className="w-full mt-4 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-md">Add {quantity} to Cart</button>
//             </div>
//           </div>

//           <div className="mt-12 bg-gray-900 p-6 rounded-lg">
//             <h3 className="text-xl font-bold text-gray-100">Customer Reviews</h3>
//             <div className="mt-4 space-y-6">
//               {productReviews.map((review, i) => (
//                 <div key={i} className="text-gray-300">
//                   {renderStars(review.rating)}
//                   <p className="text-gray-100 font-semibold">{review.username}</p>
//                   <p>{review.text}</p>
//                 </div>
//               ))}
//             </div>
//           </div>

//           <div className="mt-12 bg-gray-900 p-6 rounded-lg">
//             <h3 className="text-xl font-bold text-gray-100">Submit Your Review</h3>
//             <textarea className="w-full p-3 text-gray-900 bg-gray-100 rounded-md mt-4" placeholder="Write your review..." value={newReview.text} onChange={(e) => setNewReview({ ...newReview, text: e.target.value })} />
//             <div className="mt-4 flex space-x-2">
//               {[...Array(5)].map((_, i) => (
//                 <span key={i} className={`cursor-pointer ${newReview.rating > i ? "text-yellow-500" : "text-gray-500"}`} onClick={() => setNewReview({ ...newReview, rating: i + 1 })}>&#9733;</span>
//               ))}
//             </div>
//             <button onClick={handleReviewSubmit} className="w-full mt-4 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-md">Submit Review</button>
//           </div>
//         </div>
//       </div>
//       <Footer />
//     </>
//   );
// };

// export default ProductDetail;
// "use client";

// import React, { useEffect, useState } from "react";
// import { useParams } from "next/navigation";
// import Navbar from "@/components/ui/navbar";
// import Footer from "@/components/ui/footer";

// const ProductDetail = () => {
//   const { id } = useParams();
//   const [product, setProduct] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [quantity, setQuantity] = useState(1);
//   const [selectedImage, setSelectedImage] = useState("");
//   const [newReview, setNewReview] = useState({ text: "", rating: 0 });//, username: "User"
//   const [productReviews, setProductReviews] = useState([]);
//   const [averageRating, setAverageRating] = useState(0);

//   useEffect(() => {
//     if (!id) return;

//     const fetchProduct = async () => {
//       try {
//         const response = await fetch(`/api/products/${id}`);
//         if (!response.ok) throw new Error("Product not found");
//         const data = await response.json();
//         setProduct(data);
//         setSelectedImage(data.imageUrl);
//       } catch (error) {
//         setError(error.message);
//       } finally {
//         setLoading(false);
//       }
//     };

//     const fetchReviews = async () => {
//       try {
//         const response = await fetch(`/api/reviews/${id}`);
//         if (!response.ok) throw new Error("Reviews not found");
//         const reviews = await response.json();
//         setProductReviews(reviews);
//         setAverageRating(
//           reviews.length > 0 ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length : 0
//         );
//       } catch (error) {
//         console.error("Error fetching reviews", error);
//       }
//     };

//     fetchProduct();
//     fetchReviews();
//   }, [id]);

//   const increaseQuantity = () => setQuantity(quantity + 1);
//   const decreaseQuantity = () => setQuantity(quantity > 1 ? quantity - 1 : 1);

//   const handleReviewSubmit = async () => {
//     if (!newReview.text || newReview.rating < 1) return;
  
//     try {
//       const response = await fetch(`/api/reviews/${id}`, { // Use productId in URL
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           text: newReview.text,
//           rating: newReview.rating,
//           //username: "User", // Replace with actual username
//         }),
//       });
  
//       if (response.ok) {
//         const review = await response.json();
//         setProductReviews([...productReviews, review]);
//         setNewReview({ text: "", rating: 0 });
  
//         setAverageRating(
//           [...productReviews, review].reduce((acc, review) => acc + review.rating, 0) / (productReviews.length + 1)
//         );
//       } else {
//         console.error("Failed to submit review:", await response.json());
//       }
//     } catch (error) {
//       console.error("Error submitting review", error);
//     }
//   };
  

//   const renderStars = (rating) => {
//     const fullStars = Math.floor(rating);
//     const emptyStars = 5 - fullStars;
//     return (
//       <div className="flex">
//         {[...Array(fullStars)].map((_, i) => (
//           <span key={i} className="text-yellow-500">★</span>
//         ))}
//         {[...Array(emptyStars)].map((_, i) => (
//           <span key={i} className="text-gray-500">☆</span>
//         ))}
//       </div>
//     );
//   };

//   if (loading) return <p>Loading...</p>;
//   if (error) return <p className="text-red-500">{error}</p>;
//   if (!product) return <p className="text-gray-500">No product found.</p>;

//   return (
//     <>
//       <Navbar />
//       <div className="font-sans min-h-screen bg-[#0a0a0a] flex justify-center items-center">
//         <div className="p-4 lg:max-w-7xl max-w-xl w-full mx-auto">
//           <div className="grid items-start grid-cols-1 lg:grid-cols-5 gap-12">
//             {/* Product Image Section */}
//             <div className="min-h-[500px] lg:col-span-3 bg-[#0a0a0a] rounded-lg w-full text-center p-6">
//               <img
//                 src={selectedImage}
//                 alt="Product"
//                 className="w-full max-h-[400px] object-contain rounded mx-auto py-6"
//               />
//             </div>

//             {/* Product Details Section */}
//             <div className="lg:col-span-2 text-gray-100">
//               <h2 className="text-3xl font-bold">{product.name}</h2>
//               <p className="text-red-500 text-xl font-bold">Rs {product.price}</p>
//               <div className="flex space-x-2 mt-4">{renderStars(averageRating)}</div>
//               <p className="mt-2 text-gray-300">{product.description}</p>
//             </div>
//           </div>

//           {/* Reviews Section */}
//           <div className="mt-12 bg-gray-900 p-6 rounded-lg">
//             <h3 className="text-xl font-bold text-gray-100">Customer Reviews</h3>
//             <div className="mt-4 space-y-6">
//               {productReviews.map((review, i) => (
//                 <div key={i} className="text-gray-300">
//                   {renderStars(review.rating)}
//                   <p className="text-gray-100 font-semibold">{review.username}</p>
//                   <p>{review.text}</p>
//                 </div>
//               ))}
//             </div>
//           </div>

//           {/* Submit Review Section */}
//           <div className="mt-12 bg-gray-900 p-6 rounded-lg">
//             <h3 className="text-xl font-bold text-gray-100">Submit Your Review</h3>
//             <textarea
//               className="w-full p-3 text-gray-900 bg-gray-100 rounded-md mt-4"
//               placeholder="Write your review..."
//               value={newReview.text}
//               onChange={(e) => setNewReview({ ...newReview, text: e.target.value })}
//             />
//             <div className="mt-4 flex space-x-2">
//               {[...Array(5)].map((_, i) => (
//                 <span key={i} className={`cursor-pointer ${newReview.rating > i ? "text-yellow-500" : "text-gray-500"}`} onClick={() => setNewReview({ ...newReview, rating: i + 1 })}>★</span>
//               ))}
//             </div>
//             <button onClick={handleReviewSubmit} className="w-full mt-4 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-md">Submit Review</button>
//           </div>
//         </div>
//       </div>
//       <Footer />
//     </>
//   );
// };

// export default ProductDetail;
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "@/api/axiosInstance";
import { useCart } from "@/context/CartContext.jsx";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import ProductVisual from "@/components/ui/ProductVisual";

const ProductDetail = () => {
  const { id } = useParams();
  const { addToCart } = useCart(); // Access addToCart function from context
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
      } catch (e) {
        setError(e.response?.data?.detail || "Product not found");
      } finally {
        setLoading(false);
      }
    };

    const fetchReviews = async () => {
      try {
        const { data: reviews } = await axiosInstance.get(`/reviews/${id}`);
        setProductReviews(reviews);
        setAverageRating(
          reviews.length > 0 ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length : 0
        );
      } catch (error) {
        console.error("Error fetching reviews", error);
      }
    };

    fetchProduct();
    fetchReviews();
  }, [id]);

  const increaseQuantity = () => setQuantity(quantity + 1);
  const decreaseQuantity = () => setQuantity(quantity > 1 ? quantity - 1 : 1);

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
        setProductReviews([...productReviews, review]);
        setNewReview({ text: "", rating: 0 });

        setAverageRating(
          [...productReviews, review].reduce((acc, r) => acc + r.rating, 0) / (productReviews.length + 1)
        );
      }
    } catch (error) {
      console.error("Error submitting review", error);
    }
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const emptyStars = 5 - fullStars;
    return (
      <div className="flex">
        {[...Array(fullStars)].map((_, i) => (
          <span key={i} className="text-yellow-500">★</span>
        ))}
        {[...Array(emptyStars)].map((_, i) => (
          <span key={i} className="text-gray-500">☆</span>
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
      <div className="font-sans min-h-screen bg-[#0a0a0a] flex justify-center items-center">
        <div className="p-4 lg:max-w-7xl max-w-xl w-full mx-auto">
          <div className="grid items-start grid-cols-1 lg:grid-cols-5 gap-12">
            {/* Product Image Section */}
            <div className="min-h-[500px] lg:col-span-3 bg-[#0a0a0a] rounded-lg w-full text-center p-6">
              <ProductVisual
                name={product.name}
                make={product.make}
                category={product.category}
                imageUrl={selectedImage || product.imageUrl}
                className="relative mx-auto h-[400px] w-full overflow-hidden rounded-xl"
                imageClassName="h-full w-full rounded-xl bg-black/20 object-contain p-6"
              />
            </div>

            {/* Product Details Section */}
            <div className="lg:col-span-2 text-gray-100">
              <h2 className="text-3xl font-bold">{product.name}</h2>
              <p className="text-red-500 text-xl font-bold">Rs {product.price}</p>
              <div className="flex space-x-2 mt-4">{renderStars(averageRating)}</div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-wide text-gray-400">
                {product.make && <span>{product.make}</span>}
                {product.category && <span>{product.category}</span>}
              </div>
              <p className="mt-2 text-gray-300">{descriptionText}</p>

              {/* Quantity Selector */}
              <div className="flex items-center mt-4 space-x-4">
                <button onClick={decreaseQuantity} className="px-4 py-2 bg-gray-700 text-white rounded">-</button>
                <span className="text-xl">{quantity}</span>
                <button onClick={increaseQuantity} className="px-4 py-2 bg-gray-700 text-white rounded">+</button>
              </div>

              {/* Add to Cart Button */}
              <button 
                onClick={handleAddToCart} 
                className="w-full mt-4 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-md"
              >
                Add to Cart
              </button>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="mt-12 bg-gray-900 p-6 rounded-lg">
            <h3 className="text-xl font-bold text-gray-100">Customer Reviews</h3>
            <div className="mt-4 space-y-6">
              {productReviews.map((review, i) => (
                <div key={i} className="text-gray-300">
                  {renderStars(review.rating)}
                  <p className="text-gray-100 font-semibold">{review.username}</p>
                  <p>{review.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Review Section */}
          <div className="mt-12 bg-gray-900 p-6 rounded-lg">
            <h3 className="text-xl font-bold text-gray-100">Submit Your Review</h3>
            <textarea
              className="w-full p-3 text-gray-900 bg-gray-100 rounded-md mt-4"
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
                  ★
                </span>
              ))}
            </div>
            <button 
              onClick={handleReviewSubmit} 
              className="w-full mt-4 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-md"
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

