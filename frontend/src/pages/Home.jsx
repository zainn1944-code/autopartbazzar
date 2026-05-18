import React, { Suspense, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Parallax } from "react-parallax";
import { Canvas } from "@react-three/fiber";
import { Float, PresentationControls, Stage, useGLTF } from "@react-three/drei";
import { FaStar } from "react-icons/fa";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import axiosInstance from "@/api/axiosInstance";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed.js";

function Home3DCar() {
  const { scene } = useGLTF("/models/bmw/m4.glb");
  return <primitive object={scene} />;
}

useGLTF.preload("/models/bmw/m4.glb");

const REVIEW_LEVELS = [5, 4, 3, 2, 1];

export default function Home() {
  const { items: recentlyViewed, clearItems } = useRecentlyViewed();
  const [reviewStats, setReviewStats] = useState({
    total: 0,
    average: 0,
    percentages: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
  });

  useEffect(() => {
    const loadReviewStats = async () => {
      try {
        const { data } = await axiosInstance.get("/reviews/stats");
        setReviewStats({
          total: data.total || 0,
          average: data.average || 0,
          percentages: data.percentages || { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
        });
      } catch {
        setReviewStats({
          total: 0,
          average: 0,
          percentages: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
        });
      }
    };

    loadReviewStats();
  }, []);

  const ratingSummary = useMemo(() => {
    const total = reviewStats.total || 0;
    const average = reviewStats.average || 0;
    const rounded = Math.round(average);
    return { total, average, rounded };
  }, [reviewStats.average, reviewStats.total]);

  return (
    <>
      <Navbar />

      <div className="relative h-screen overflow-hidden bg-black selection:bg-red-500/30">
        <video
          className="absolute left-0 top-0 h-full w-full object-cover opacity-60"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src="/videos/Car.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/80" />

        <div className="relative z-10 flex h-full items-center justify-center px-4 text-center text-white md:px-8">
          <div className="max-w-4xl space-y-8 rounded-3xl p-8 backdrop-blur-sm">
            <h1 className="bg-gradient-to-r from-white via-gray-200 to-gray-500 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent drop-shadow-2xl md:text-6xl lg:text-7xl">
              Precision Performance.
              <br />
              <span className="bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent">
                Unleashed.
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg font-medium leading-relaxed text-gray-300 md:text-xl">
              Discover the ultimate marketplace for high-end auto parts and accessories.
              Elevate your build with our immersive 3D configurator.
            </p>
            <div className="flex flex-col items-center justify-center gap-6 pt-4 sm:flex-row">
              <Link
                to="/productlist"
                className="w-full rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-8 py-4 text-lg font-bold text-white shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(220,38,38,0.6)] sm:w-auto"
              >
                Browse Catalog
              </Link>
              <Link
                to="/viewmodel"
                className="w-full rounded-xl border-2 border-white/20 bg-white/5 px-8 py-4 text-lg font-bold text-white backdrop-blur-md transition-all duration-300 hover:border-white/40 hover:bg-white/10 sm:w-auto"
              >
                Customize in 3D
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#050505]">
        <section id="features" className="relative block border-t border-white/5 px-6 py-24 md:px-10">
          <div className="relative mx-auto mb-16 max-w-5xl text-center">
            <span className="mb-4 block text-sm font-bold uppercase tracking-[0.2em] text-red-500">
              Why Choose AutoPartBazaar
            </span>
            <h2 className="block w-full bg-gradient-to-b from-white to-gray-400 bg-clip-text text-4xl font-extrabold text-transparent sm:text-5xl">
              Build the Perfect Ride
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-400">
              AutoPartBazaar offers a seamless way to customize your car, from finding the right
              exterior parts to visualizing them in real-time 3D.
            </p>
          </div>

          <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 gap-8 pt-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Customizable Parts",
                desc: "From bumpers to spoilers, customize your car with exterior parts tailored to your make and model.",
                icon: <path d="M4 13v-5h16v5l3 5h-22l3 -5z M5 17l1 -1h12l1 1 M7 9v-3a3 3 0 0 1 6 0v3 M17 9v-3a3 3 0 0 0 -6 0v3" />,
              },
              {
                title: "Fast Delivery",
                desc: "Get the parts you need quickly, with shipping built to keep your project moving.",
                icon: <path d="M12 3v18a9 9 0 1 0 9 -9h-9 M12 6a6 6 0 1 1 -6 6h6 M15 9l2 2" />,
              },
              {
                title: "Everything You Need",
                desc: "Visualize, select, and order parts without the usual marketplace friction.",
                icon: <path d="M3 21h4l13 -13a1.5 1.5 0 0 0 -4 -4l-13 13v4 M14.5 5.5l4 4 M12 8l-5 -5l-4 4l5 5 M7 8l-1.5 1.5 M16 12l5 5l-4 4l-5 -5 M16 17l-1.5 1.5" />,
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group rounded-3xl border border-white/5 bg-white/[0.02] p-8 text-center backdrop-blur-md transition-all hover:-translate-y-1 hover:border-white/10 hover:bg-white/[0.04] hover:shadow-2xl hover:shadow-red-500/10"
              >
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-red-900 shadow-[0_0_15px_rgba(220,38,38,0.3)] transition-transform group-hover:scale-110">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    {feature.icon}
                  </svg>
                </div>
                <h3 className="mb-4 text-xl font-bold text-white">{feature.title}</h3>
                <p className="leading-relaxed text-gray-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section>
        <Parallax className="relative h-[600px]" bgImage="/Images/car1.jpg" strength={300}>
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-black/60 to-[#050505]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <h2 className="bg-gradient-to-b from-white to-gray-500 bg-clip-text text-5xl font-black tracking-tighter text-transparent drop-shadow-2xl md:text-7xl">
              UNLEASH YOUR CREATIVITY
            </h2>
          </div>
        </Parallax>
      </section>

      <section className="relative overflow-hidden border-b border-white/5 bg-gray-100 dark:bg-[#050505] py-24">
        <div className="pointer-events-none absolute right-0 top-0 h-[800px] w-[800px] rounded-full bg-red-600/10 blur-[120px]" />
        <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center gap-16 px-6 lg:flex-row lg:items-start">
          <div className="flex flex-col justify-center text-center lg:w-1/2 lg:text-left">
            <span className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-red-500">Interactive 3D</span>
            <h2 className="mb-6 text-4xl font-extrabold leading-tight text-white md:text-5xl">
              THE GARAGE VISUALIZER
            </h2>
            <p className="mb-8 mx-auto max-w-xl text-lg leading-relaxed text-gray-400 lg:mx-0">
              Configure your car in real time, swap parts, test paint, and turn the result into a
              cart-ready build instead of a disconnected demo.
            </p>
            <Link to="/viewmodel">
              <button className="mx-auto w-fit rounded-xl bg-white px-8 py-4 text-lg font-bold text-black shadow-lg shadow-white/10 transition-colors hover:bg-gray-200 lg:mx-0">
                Launch Visualizer
              </button>
            </Link>
          </div>

          <div className="relative flex h-[400px] w-full items-center justify-center md:h-[500px] lg:w-1/2">
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent backdrop-blur-md shadow-2xl">
              <Canvas dpr={[1, 1.5]} shadows camera={{ position: [5, 2, 8], fov: 45 }}>
                <Suspense fallback={null}>
                  <Float speed={2} rotationIntensity={0.5} floatIntensity={1.5}>
                    <PresentationControls
                      global
                      config={{ mass: 2, tension: 200 }}
                      snap={{ mass: 4, tension: 200 }}
                      rotation={[0, -0.5, 0]}
                      polar={[-Math.PI / 3, Math.PI / 3]}
                      azimuth={[-Math.PI / 1.4, Math.PI / 2]}
                    >
                      <Stage environment="city" intensity={0.6}>
                        <Home3DCar />
                      </Stage>
                    </PresentationControls>
                  </Float>
                </Suspense>
              </Canvas>
              <div className="pointer-events-none absolute bottom-4 right-4 rounded-full bg-black/50 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-white/50 backdrop-blur-md">
                Drag to Rotate
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="shopping-guide" className="bg-gray-50 dark:bg-[#0a0a0a] px-6 py-24">
        <div className="mx-auto max-w-7xl text-center">
          <span className="mb-4 block text-sm font-bold uppercase tracking-[0.2em] text-red-500">How It Works</span>
          <h2 className="mb-16 text-4xl font-extrabold text-white sm:text-5xl">Your Shopping Guide</h2>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              { step: "1", title: "Browse Catalog", desc: "Explore the performance inventory that fits your build." },
              { step: "2", title: "Customize", desc: "Use the 3D visualization tool to test parts before buying." },
              { step: "3", title: "Checkout", desc: "Add parts or saved builds to cart and finish the order securely." },
            ].map((item) => (
              <div
                key={item.step}
                className="relative rounded-3xl border border-white/5 bg-white/5 p-10 text-left backdrop-blur-md transition-colors hover:bg-white/10"
              >
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-red-500/30 bg-red-600/20 text-xl font-bold text-red-500">
                  {item.step}
                </div>
                <h3 className="relative z-10 mb-4 text-2xl font-bold text-white">{item.title}</h3>
                <p className="relative z-10 text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-16">
            <Link
              to="/productlist"
              className="inline-flex items-center gap-2 text-lg font-bold tracking-wide text-red-500 transition-colors hover:text-red-400"
            >
              Start Shopping Now
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      <section className="relative border-t border-white/5 bg-[#050505] py-24">
        <div className="mx-auto w-full max-w-7xl px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-extrabold text-white sm:text-5xl">Community Ratings</h2>
            <p className="text-lg text-gray-400">Live review signals from products across the marketplace.</p>
          </div>

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            <div className="flex flex-col justify-center lg:col-span-5">
              <div className="mx-auto flex w-full max-w-md flex-col gap-6 lg:mx-0">
                {REVIEW_LEVELS.map((rating) => {
                  const percentage = reviewStats.percentages?.[String(rating)] || 0;
                  return (
                    <div key={rating} className="group flex w-full items-center">
                      <div className="flex w-20 items-center gap-1">
                        <span className="text-lg font-bold text-white">{rating}</span>
                        <FaStar className="h-4 w-4 text-yellow-400" />
                      </div>
                      <div className="relative h-3 flex-1 overflow-hidden rounded-full border border-white/10 bg-white/5">
                        <div
                          className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-yellow-500 to-yellow-300 transition-all duration-1000 group-hover:shadow-[0_0_10px_rgba(250,204,21,0.5)]"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="w-12 text-right font-medium text-gray-500">{percentage}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="flex h-full flex-col items-center justify-between gap-8 rounded-3xl border border-white/10 bg-white/5 px-10 py-12 shadow-2xl backdrop-blur-xl sm:flex-row">
                <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
                  <div className="mb-2 flex items-baseline gap-2">
                    <h3 className="text-6xl font-black tracking-tighter text-white md:text-7xl">
                      {ratingSummary.average.toFixed(1)}
                    </h3>
                    <span className="text-xl font-medium text-gray-400">/ 5</span>
                  </div>
                  <div className="mb-3 flex items-center gap-1">
                    {[...Array(5)].map((_, index) => (
                      <FaStar
                        key={index}
                        className={`h-6 w-6 ${
                          index < ratingSummary.rounded
                            ? "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]"
                            : "text-gray-600"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="font-medium text-gray-400">
                    Based on {ratingSummary.total} marketplace reviews
                  </p>
                </div>
                <div className="flex w-full flex-col gap-4 sm:w-auto">
                  <Link
                    to="/productlist"
                    className="w-full rounded-xl bg-red-600 px-6 py-4 text-center font-bold text-white transition-colors hover:bg-red-500 shadow-[0_0_20px_rgba(220,38,38,0.3)] sm:w-48"
                  >
                    Write A Review
                  </Link>
                  <Link
                    to="/productlist"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-6 py-4 text-center font-bold text-white transition-colors hover:bg-white/10 sm:w-48"
                  >
                    See All Reviews
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recently Viewed */}
      {recentlyViewed.length > 0 && (
        <section className="bg-white dark:bg-gray-900 py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recently Viewed</h2>
              <div className="flex gap-3">
                <Link
                  to="/compare"
                  className="text-sm text-red-600 hover:underline font-medium"
                >
                  Compare Products →
                </Link>
                <button
                  onClick={clearItems}
                  className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {recentlyViewed.map((p) => (
                <Link
                  key={p.productId}
                  to={`/productdetail/${p.productId}`}
                  className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 hover:shadow-md transition group"
                >
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="h-24 w-full object-contain rounded mb-2 bg-white dark:bg-gray-700"
                    />
                  ) : (
                    <div className="h-24 w-full bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                  )}
                  <p className="text-xs font-medium text-gray-800 dark:text-gray-200 line-clamp-2 group-hover:text-red-600">
                    {p.name}
                  </p>
                  <p className="text-xs text-red-600 font-bold mt-1">Rs {p.price?.toLocaleString()}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </>
  );
}
