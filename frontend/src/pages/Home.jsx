import React, { Suspense } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import { Parallax } from "react-parallax";
import { FaStar, FaRegStar } from "react-icons/fa";
import { Canvas } from "@react-three/fiber";
import { useGLTF, PresentationControls, Stage, Float } from "@react-three/drei";

// Mini 3D Model Component for the Home Page
function Home3DCar() {
  const { scene } = useGLTF("/models/bmw/m4.glb");
  return (
    <primitive object={scene} />
  );
}

export default function Home() {
  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <div className="relative h-screen bg-black overflow-hidden selection:bg-red-500/30">
        <video
          className="absolute top-0 left-0 w-full h-full object-cover opacity-60"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src="/videos/Car.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/80" />

        <div className="relative z-10 flex items-center justify-center h-full text-center text-white px-4 md:px-8">
          <div className="max-w-4xl space-y-8 backdrop-blur-sm p-8 rounded-3xl">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500 drop-shadow-2xl">
              Precision Performance.
              <br />
              <span className="text-red-500 bg-none bg-clip-border text-transparent bg-gradient-to-r from-red-600 to-red-400">Unleashed.</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 font-medium max-w-2xl mx-auto leading-relaxed">
              Discover the ultimate marketplace for high-end auto parts and accessories. Elevate your build with our immersive 3D configurator.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-6 pt-4">
              <a
                href="#features"
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-red-600 to-red-500 text-white font-bold text-lg rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:shadow-[0_0_30px_rgba(220,38,38,0.6)] hover:scale-105 transition-all duration-300"
              >
                Shop Now
              </a>
              <Link
                to="/viewmodel"
                className="w-full sm:w-auto px-8 py-4 border-2 border-white/20 bg-white/5 backdrop-blur-md text-white font-bold text-lg rounded-xl hover:bg-white/10 hover:border-white/40 transition-all duration-300"
              >
                Customize in 3D
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-[#050505]">
        <section
          id="features"
          className="relative block px-6 py-24 md:px-10 border-t border-white/5"
        >
          <div className="relative mx-auto max-w-5xl text-center mb-16">
            <span className="text-red-500 mb-4 block font-bold uppercase tracking-[0.2em] text-sm">
              Why Choose AutoPartBazaar
            </span>
            <h2 className="block w-full bg-gradient-to-b from-white to-gray-400 bg-clip-text font-extrabold text-transparent text-4xl sm:text-5xl">
              Build the Perfect Ride
            </h2>
            <p className="mx-auto mt-6 w-full max-w-2xl text-center text-lg leading-relaxed text-gray-400">
              AutoPartBazaar offers a seamless way to customize your car. From finding the perfect exterior parts to visualizing them in real-time 3D.
            </p>
          </div>

          <div className="relative mx-auto max-w-7xl z-10 grid grid-cols-1 gap-8 pt-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Customizable Parts",
                desc: "From bumpers to spoilers, customize your car with a wide variety of exterior parts, all tailored to your car’s make and model.",
                icon: (
                  <path d="M4 13v-5h16v5l3 5h-22l3 -5z M5 17l1 -1h12l1 1 M7 9v-3a3 3 0 0 1 6 0v3 M17 9v-3a3 3 0 0 0 -6 0v3" />
                )
              },
              {
                title: "Fast Delivery",
                desc: "Get the parts you need quickly and efficiently, with fast shipping to ensure you never have to wait too long to enhance your ride.",
                icon: (
                  <path d="M12 3v18a9 9 0 1 0 9 -9h-9 M12 6a6 6 0 1 1 -6 6h6 M15 9l2 2" />
                )
              },
              {
                title: "Everything You Need",
                desc: "We provide all the tools you need to visualize, select, and order car parts without the hassle. Find everything in one place.",
                icon: (
                  <path d="M3 21h4l13 -13a1.5 1.5 0 0 0 -4 -4l-13 13v4 M14.5 5.5l4 4 M12 8l-5 -5l-4 4l5 5 M7 8l-1.5 1.5 M16 12l5 5l-4 4l-5 -5 M16 17l-1.5 1.5" />
                )
              }
            ].map((feature, i) => (
              <div key={i} className="group rounded-3xl border border-white/5 bg-white/[0.02] p-8 text-center backdrop-blur-md transition-all hover:bg-white/[0.04] hover:border-white/10 hover:-translate-y-1 hover:shadow-2xl hover:shadow-red-500/10">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-red-900 shadow-[0_0_15px_rgba(220,38,38,0.3)] mb-6 transition-transform group-hover:scale-110">
                  <svg xmlns="http://www.w3.org/2000/svg" className="text-white h-8 w-8" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    {feature.icon}
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Parallax Image Section */}
      <section>
        <Parallax
          className="h-[600px] relative"
          bgImage="/Images/car1.jpg"
          strength={300}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-black/60 to-[#050505]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <h2 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 tracking-tighter drop-shadow-2xl">
              UNLEASH YOUR CREATIVITY
            </h2>
          </div>
        </Parallax>
      </section>

      {/* Visualizer Section with Interactive 3D Canvas */}
      <section className="bg-[#050505] py-24 relative overflow-hidden border-b border-white/5">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-red-600/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center lg:items-start lg:flex-row relative z-10 gap-16">
          <div className="lg:w-1/2 text-center lg:text-left flex flex-col justify-center">
            <span className="text-red-500 font-bold uppercase tracking-[0.2em] text-sm mb-4">Interactive 3D</span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-6">
              THE GARAGE VISUALIZER
            </h2>
            <p className="text-lg text-gray-400 mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0">
              AutoPartBazaar's Configurator allows you to visualize your car in real-time 3D. Swap parts, change colors, and interact with your dream build before you buy.
            </p>
            <Link to="/viewmodel">
              <button className="px-8 py-4 bg-white text-black font-bold text-lg rounded-xl hover:bg-gray-200 transition-colors shadow-lg shadow-white/10 w-fit mx-auto lg:mx-0">
                Launch Visualizer
              </button>
            </Link>
          </div>
          
          <div className="lg:w-1/2 flex items-center justify-center relative w-full h-[400px] md:h-[500px]">
            {/* Live 3D Canvas Animation */}
            <div className="absolute inset-0 rounded-3xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent backdrop-blur-md overflow-hidden shadow-2xl flex items-center justify-center cursor-grab active:cursor-grabbing">
              <Canvas shadows camera={{ position: [5, 2, 8], fov: 45 }}>
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
              {/* Overlay Hint */}
              <div className="absolute bottom-4 right-4 text-xs font-semibold uppercase tracking-widest text-white/50 bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-md pointer-events-none">
                Drag to Rotate
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Shopping Guide Section */}
      <section id="shopping-guide" className="bg-[#0a0a0a] py-24 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <span className="text-red-500 font-bold uppercase tracking-[0.2em] text-sm mb-4 block">How It Works</span>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-16">
            Your Shopping Guide
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Browse Catalog", desc: "Start by exploring our high-performance inventory." },
              { step: "2", title: "Customize", desc: "Use our 3D visualization tool to test parts before buying." },
              { step: "3", title: "Checkout", desc: "Add to cart and proceed with our secure checkout flow." }
            ].map((item, i) => (
              <div key={i} className="relative rounded-3xl border border-white/5 bg-white/5 p-10 text-left backdrop-blur-md hover:bg-white/10 transition-colors">
                {/* The background numbers have been completely removed here */}
                <div className="h-12 w-12 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500 font-bold text-xl mb-6">
                  {item.step}
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 relative z-10">{item.title}</h3>
                <p className="text-gray-400 relative z-10">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-16">
            <Link
              to="/productlist"
              className="inline-flex items-center gap-2 text-lg text-red-500 hover:text-red-400 font-bold tracking-wide transition-colors"
            >
              Start Shopping Now
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-24 relative bg-[#050505] border-t border-white/5">
        <div className="w-full max-w-7xl px-6 mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-extrabold text-4xl sm:text-5xl text-white mb-4">
              Community Ratings
            </h2>
            <p className="text-gray-400 text-lg">See what other builders are saying about AutoPartBazaar.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Rating Summary */}
            <div className="lg:col-span-5 flex flex-col justify-center">
              <div className="flex flex-col gap-6 w-full max-w-md mx-auto lg:mx-0">
                {[5, 4, 3, 2, 1].map((rating, index) => {
                  const percentage = rating * 20; 
                  return (
                    <div key={index} className="flex items-center w-full group">
                      <div className="flex items-center gap-1 w-20">
                        <span className="font-bold text-lg text-white">{rating}</span>
                        <FaStar className="text-yellow-400 h-4 w-4" />
                      </div>
                      <div className="h-3 flex-1 rounded-full bg-white/5 border border-white/10 relative overflow-hidden">
                        <div
                          className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-yellow-500 to-yellow-300 transition-all duration-1000 group-hover:shadow-[0_0_10px_rgba(250,204,21,0.5)]"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="font-medium text-gray-500 w-12 text-right">{rating * 10}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Review Details Panel */}
            <div className="lg:col-span-7">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-8 h-full px-10 py-12 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
                <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                  <div className="flex items-baseline gap-2 mb-2">
                    <h3 className="font-black text-6xl md:text-7xl text-white tracking-tighter">4.3</h3>
                    <span className="text-gray-400 text-xl font-medium">/ 5</span>
                  </div>
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <FaStar key={i} className={`h-6 w-6 ${i < 4 ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]' : 'text-gray-600'}`} />
                    ))}
                  </div>
                  <p className="font-medium text-gray-400">Based on 100+ Verified Ratings</p>
                </div>
                <div className="flex flex-col w-full sm:w-auto gap-4">
                  <button className="w-full sm:w-48 rounded-xl px-6 py-4 bg-red-600 text-white font-bold hover:bg-red-500 transition-colors shadow-[0_0_20px_rgba(220,38,38,0.3)]">
                    Write A Review
                  </button>
                  <button className="w-full sm:w-48 rounded-xl px-6 py-4 bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-colors">
                    See All Reviews
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
