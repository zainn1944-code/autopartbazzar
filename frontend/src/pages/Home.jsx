import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, OrbitControls, useGLTF } from "@react-three/drei";
import {
  FaStar,
  FaShieldAlt,
  FaTruck,
  FaHeadset,
  FaTag,
  FaLock,
  FaUndo,
  FaCheckCircle,
  FaCog,
  FaCompactDisc,
  FaWind,
  FaLightbulb,
  FaCouch,
  FaCarSide,
  FaWrench,
  FaChevronLeft,
  FaChevronRight,
  FaChevronRight as FaChevron,
  FaPalette,
  FaArrowsAltV,
  FaSyncAlt,
  FaSearchPlus,
  FaExpand,
  FaCube,
} from "react-icons/fa";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import ProductCard from "@/components/ui/ListProductCard";
import axiosInstance from "@/api/axiosInstance";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed.js";
import {
  PAINT_SWATCHES,
  PAINT_FINISHES,
  RIM_COLORS,
  CALIPER_COLORS,
  DEFAULT_BODY_PAINT,
  applyBodyPaint,
  applyRimColor,
  applyCaliperColor,
  getCustomizationProfile,
} from "@/lib/carCustomization.js";

const CIVIC_MODEL_URL = "/models/honda/civic.glb";
const CIVIC_GARAGE_LINK = `/garage?modelUrl=${encodeURIComponent(CIVIC_MODEL_URL)}&make=Honda&name=Civic`;

const DEFAULT_GARAGE_BUILD = {
  paintHex: DEFAULT_BODY_PAINT,
  paintFinish: "gloss",
  rimColor: "factory",
  caliperColor: "factory",
  suspension: 0,
  exhaust: "stock",
};

const EXHAUST_OPTIONS = [
  { key: "stock", label: "Stock", price: 0, rate: 0.8 },
  { key: "sport", label: "Sport", price: 30000, rate: 1.0 },
  { key: "race",  label: "Race",  price: 55000, rate: 1.25 },
];

/** Honda Civic — same GLB + customization pipeline the Garage page uses,
 *  so paint / rims / calipers / suspension change live exactly like there. */
function HomeGarageCar({ build, onReady }) {
  const { scene } = useGLTF(CIVIC_MODEL_URL);
  const profile = useMemo(() => getCustomizationProfile("honda", CIVIC_MODEL_URL), []);

  // Fresh copy of the cached GLTF (repaints must not leak into other pages),
  // centered and floor-aligned the same way the Garage loader does it.
  const { car, baseline } = useMemo(() => {
    const cloned = scene.clone(true);
    cloned.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(cloned);
    const center = box.getCenter(new THREE.Vector3());
    cloned.position.set(-center.x, -box.min.y, -center.z);
    cloned.traverse((c) => {
      if (c.isMesh) {
        c.castShadow = true;
        c.receiveShadow = true;
      }
    });
    const wrapper = new THREE.Group();
    wrapper.add(cloned);
    return { car: wrapper, baseline: -box.min.y };
  }, [scene]);

  useEffect(() => {
    onReady?.();
  }, [car, onReady]);

  useEffect(() => {
    applyBodyPaint(car, build.paintHex, build.paintFinish, { onlyMaterials: profile.paintMaterials });
  }, [car, profile, build.paintHex, build.paintFinish]);

  useEffect(() => {
    applyRimColor(car, build.rimColor);
  }, [car, build.rimColor]);

  useEffect(() => {
    applyCaliperColor(car, build.caliperColor);
  }, [car, build.caliperColor]);

  // Suspension lifts the body from the floor-aligned baseline (Garage behavior)
  useEffect(() => {
    const inner = car.children[0];
    if (inner) inner.position.y = baseline + (build.suspension ?? 0);
  }, [car, baseline, build.suspension]);

  return <primitive object={car} />;
}

useGLTF.preload(CIVIC_MODEL_URL);

/** Dark circular showroom turntable under the car. */
function GaragePlatform() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.012, 0]} receiveShadow>
        <circleGeometry args={[3.1, 96]} />
        <meshStandardMaterial color="#101014" roughness={1} metalness={0} envMapIntensity={0} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.006, 0]}>
        <ringGeometry args={[2.94, 3.1, 96]} />
        <meshStandardMaterial color="#1c1c24" roughness={1} metalness={0} envMapIntensity={0} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]}>
        <circleGeometry args={[10, 48]} />
        <meshStandardMaterial color="#0a0a0e" roughness={1} metalness={0} />
      </mesh>
    </group>
  );
}

/** Eases camera FOV toward the Zoom toggle's target. */
function ZoomController({ zoomed }) {
  useFrame(({ camera }) => {
    const target = zoomed ? 30 : 42;
    if (Math.abs(camera.fov - target) < 0.05) return;
    camera.fov += (target - camera.fov) * 0.1;
    camera.updateProjectionMatrix();
  });
  return null;
}

const garageChip = (active) =>
  `flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
    active
      ? "border-red-500/70 bg-red-600/20 text-white"
      : "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
  }`;

const REVIEW_LEVELS = [5, 4, 3, 2, 1];

/** Reveal — fades + slides children in the first time they scroll into view. */
function Reveal({ children, className = "", delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className}`}
    >
      {children}
    </div>
  );
}

/** Pick an icon for a category by keyword (categories come from the backend). */
function categoryIcon(name = "") {
  const n = name.toLowerCase();
  if (n.includes("brake")) return FaCompactDisc;
  if (n.includes("engine")) return FaCog;
  if (n.includes("tyre") || n.includes("tire") || n.includes("wheel")) return FaCompactDisc;
  if (n.includes("exhaust")) return FaWind;
  if (n.includes("light") || n.includes("electric")) return FaLightbulb;
  if (n.includes("interior")) return FaCouch;
  if (n.includes("exterior") || n.includes("bumper") || n.includes("vehicle")) return FaCarSide;
  return FaWrench;
}

const HERO_BADGES = [
  { icon: FaShieldAlt, title: "Premium Quality", desc: "Genuine & reliable auto parts." },
  { icon: FaTruck, title: "Fast Delivery", desc: "Quick shipping across the country." },
  { icon: FaHeadset, title: "Expert Support", desc: "We're here to help you anytime." },
];

const GARAGE_OPTIONS = [
  { key: "paint",      icon: FaPalette,     title: "Paint",      desc: "Choose your color" },
  { key: "wheels",     icon: FaCompactDisc, title: "Wheels",     desc: "Select your style" },
  { key: "brakes",     icon: FaCog,         title: "Brakes",     desc: "Upgrade stopping power" },
  { key: "suspension", icon: FaArrowsAltV,  title: "Suspension", desc: "Adjust height & stiffness" },
  { key: "exhaust",    icon: FaWind,        title: "Exhaust",    desc: "Pick your sound" },
];

const WHY_CHOOSE = [
  { icon: FaCheckCircle, title: "Genuine Parts", desc: "100% authentic products you can trust." },
  { icon: FaTag, title: "Best Prices", desc: "Competitive prices guaranteed." },
  { icon: FaLock, title: "Secure Payments", desc: "Safe & encrypted transactions." },
  { icon: FaUndo, title: "Easy Returns", desc: "Hassle-free returns within 7 days." },
];

const RATING_AVATARS = ["/Images/ahmad.webp", "/Images/haaris.jpg", "/Images/bakar.JPG", "/Images/admin.jpeg"];

export default function Home() {
  const { items: recentlyViewed, clearItems } = useRecentlyViewed();
  const [reviewStats, setReviewStats] = useState({
    total: 0,
    average: 0,
    percentages: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
  });
  const [trending, setTrending] = useState([]);
  const [categories, setCategories] = useState([]);
  const trackRef = useRef(null);

  // ── Interactive 3D Garage — live Civic build state ──
  const [garageBuild, setGarageBuild] = useState(DEFAULT_GARAGE_BUILD);
  const [openOption, setOpenOption] = useState("paint");
  const [garageRotate, setGarageRotate] = useState(true);
  const [garageZoom, setGarageZoom] = useState(false);
  const [garageSeed, setGarageSeed] = useState(0);
  const [carReady, setCarReady] = useState(false);
  const garageStageRef = useRef(null);
  const exhaustAudioRef = useRef(null);

  const setBuildPart = useCallback((key, value) => {
    setGarageBuild((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleCarReady = useCallback(() => setCarReady(true), []);

  const selectExhaust = (opt) => {
    setBuildPart("exhaust", opt.key);
    if (!exhaustAudioRef.current) exhaustAudioRef.current = new Audio("/audio/civicrev.mp3");
    const audio = exhaustAudioRef.current;
    audio.pause();
    audio.playbackRate = opt.rate;
    audio.currentTime = 0;
    audio.volume = 0.6;
    audio.play().catch(() => {});
  };

  const resetGarage = () => {
    setGarageBuild(DEFAULT_GARAGE_BUILD);
    setGarageZoom(false);
    setGarageRotate(true);
    setGarageSeed((s) => s + 1);
  };

  const toggleGarageFullscreen = () => {
    const el = garageStageRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  };

  const garageStats = useMemo(() => {
    let value = 485000;
    let parts = 12;
    let perf = 92;
    if (garageBuild.paintHex !== DEFAULT_BODY_PAINT) { value += 28000; parts += 1; }
    if (garageBuild.paintFinish !== "gloss")         { value += 15000; parts += 1; }
    if (garageBuild.rimColor !== "factory")          { value += 45000; parts += 1; perf += 2; }
    if (garageBuild.caliperColor !== "factory")      { value += 18000; parts += 1; perf += 1; }
    if (garageBuild.suspension !== 0)                { value += 35000; parts += 1; perf += 2; }
    const exhaust = EXHAUST_OPTIONS.find((o) => o.key === garageBuild.exhaust);
    if (exhaust && exhaust.price > 0) {
      value += exhaust.price;
      parts += 1;
      perf += exhaust.key === "race" ? 3 : 2;
    }
    return [
      { icon: FaTag,    label: "Build Value",       value: `Rs. ${value.toLocaleString()}` },
      { icon: FaWrench, label: "Components",        value: `${parts} Parts` },
      { icon: FaCog,    label: "Performance Score", value: `${Math.min(perf, 99)}%` },
      { icon: FaTruck,  label: "Est. Delivery",     value: "3-5 Days" },
    ];
  }, [garageBuild]);

  const suspensionLabel =
    garageBuild.suspension > 0
      ? `+${Math.round(garageBuild.suspension * 100)}cm`
      : garageBuild.suspension < 0
        ? `${Math.round(garageBuild.suspension * 100)}cm`
        : "Stock";

  const garageControls = [
    { icon: FaSyncAlt,    label: "Rotate",     active: garageRotate, onClick: () => setGarageRotate((r) => !r) },
    { icon: FaSearchPlus, label: "Zoom",       active: garageZoom,   onClick: () => setGarageZoom((z) => !z) },
    { icon: FaUndo,       label: "Reset",      active: false,        onClick: resetGarage },
    { icon: FaExpand,     label: "Fullscreen", active: false,        onClick: toggleGarageFullscreen },
  ];

  // Real catalog products (Trending) + category counts (Shop by Category).
  useEffect(() => {
    const load = async () => {
      try {
        const [{ data: prod }, { data: cats }] = await Promise.all([
          axiosInstance.get("/products", { params: { sortBy: "latest", pageSize: 10, liveOnly: false } }),
          axiosInstance.get("/products/categories"),
        ]);
        setTrending(prod.products || []);
        setCategories(Array.isArray(cats) ? cats : []);
      } catch {
        setTrending([]);
        setCategories([]);
      }
    };
    load();
  }, []);

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
        setReviewStats({ total: 0, average: 0, percentages: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 } });
      }
    };
    loadReviewStats();
  }, []);

  const ratingSummary = useMemo(() => {
    const total = reviewStats.total || 0;
    const average = reviewStats.average || 0;
    return { total, average, rounded: Math.round(average) };
  }, [reviewStats.average, reviewStats.total]);

  const scrollTrack = (dir) => {
    trackRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  };

  return (
    <>
      <Navbar />

      {/* ══ HERO — dark garage backdrop, left copy + feature badges ══ */}
      <section className="relative overflow-hidden bg-black selection:bg-red-500/30">
        <img
          src="/Images/car1.jpg"
          alt="Red Honda Civic in a dark garage"
          className="absolute inset-0 h-full w-full object-cover object-[68%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-black/50" />

        <div className="relative z-10 mx-auto flex min-h-[620px] max-w-7xl items-center px-6 md:px-10">
          <div className="max-w-3xl py-24 text-white">
            <h1 className="text-5xl font-extrabold leading-[1.05] tracking-tight drop-shadow-2xl md:text-6xl lg:text-7xl">
              Precision Parts.
              <br />
              Peak <span className="text-red-500">Performance.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-gray-300">
              Your ultimate marketplace for premium auto parts and immersive 3D customization.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                to="/productlist"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-8 py-4 text-base font-bold text-white shadow-[0_0_25px_rgba(220,38,38,0.45)] transition-all hover:scale-105"
              >
                Shop Now
                <FaChevron className="h-3.5 w-3.5" />
              </Link>
              <Link
                to="/viewmodel"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-8 py-4 text-base font-bold text-white backdrop-blur-md transition-all hover:border-white/40 hover:bg-white/10"
              >
                Customize in 3D
                <FaCube className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-12 grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-3">
              {HERO_BADGES.map((b) => (
                <div key={b.title} className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-600/20 text-red-500">
                    <b.icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-white">{b.title}</p>
                    <p className="text-xs leading-snug text-gray-400">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ SHOP BY CATEGORY — real categories + live counts ══ */}
      {categories.length > 0 && (
        <section className="bg-[#050505] px-6 py-16 md:px-10">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {categories.slice(0, 6).map((cat, index) => {
                const Icon = categoryIcon(cat.name);
                return (
                  <Reveal key={cat.name} delay={(index % 6) * 60}>
                    <Link
                      to={`/productlist?category=${encodeURIComponent(cat.name)}`}
                      className="group flex h-full flex-col rounded-2xl border border-white/8 bg-white/[0.03] p-4 transition-all hover:-translate-y-1 hover:border-red-500/40 hover:bg-white/[0.06]"
                    >
                      <div className="relative mb-3 flex h-28 items-center justify-center overflow-hidden rounded-xl bg-[#16161d]">
                        <Icon className="h-8 w-8 text-white/25" />
                        {cat.image && (
                          <img
                            src={cat.image}
                            alt={cat.name}
                            loading="lazy"
                            onError={(e) => { e.currentTarget.style.display = "none"; }}
                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        )}
                      </div>
                      <p className="text-sm font-bold text-white">{cat.name}</p>
                      <p className="mt-0.5 text-xs font-semibold text-red-500">
                        {cat.count.toLocaleString()}+ Products
                      </p>
                    </Link>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ══ TRENDING PRODUCTS — real catalog, horizontal carousel ══ */}
      {trending.length > 0 && (
        <section className="bg-[#050505] px-6 py-12 md:px-10">
          <div className="mx-auto max-w-7xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-3xl font-extrabold text-white">Trending Products</h2>
              <div className="flex items-center gap-3">
                <Link to="/productlist" className="flex items-center gap-1.5 text-sm font-bold text-red-500 hover:text-red-400">
                  View All <FaChevron className="h-3 w-3" />
                </Link>
                <div className="hidden gap-2 sm:flex">
                  <button
                    onClick={() => scrollTrack(-1)}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition-colors hover:bg-white/10"
                    aria-label="Scroll left"
                  >
                    <FaChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => scrollTrack(1)}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition-colors hover:bg-white/10"
                    aria-label="Scroll right"
                  >
                    <FaChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div
              ref={trackRef}
              className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {trending.map((product) => (
                <div key={product.productId || product.id} className="w-64 shrink-0 snap-start">
                  <ProductCard product={product} viewMode="grid" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ INTERACTIVE 3D GARAGE — live Honda Civic customizer ══ */}
      <section className="relative overflow-hidden bg-[#050505] px-6 py-16 md:px-10">
        <div className="pointer-events-none absolute right-0 top-1/2 h-[700px] w-[700px] -translate-y-1/2 rounded-full bg-red-600/10 blur-[140px]" />
        <Reveal className="relative z-10 mx-auto max-w-7xl">
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#101014] to-[#0a0a0c] p-6 shadow-2xl md:p-10">
            {/* Header: title + working viewer controls */}
            <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div>
                <span className="mb-2 block text-sm font-bold uppercase tracking-[0.2em] text-red-500">
                  Interactive 3D Garage
                </span>
                <h2 className="mb-2 text-3xl font-extrabold text-white md:text-4xl">Build Your Dream Car</h2>
                <p className="max-w-md text-sm leading-relaxed text-gray-400">
                  Configure your car in real time. Choose parts, test combinations and see it come to life in 3D.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {garageControls.map((c) => (
                  <button
                    key={c.label}
                    onClick={c.onClick}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                      c.active
                        ? "border-red-500/60 bg-red-600/15 text-white"
                        : "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
                    }`}
                  >
                    <c.icon className="h-3 w-3" /> {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Body: left live options + right live car/stats */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Left column — every option customizes the Civic in real time */}
              <div className="flex flex-col lg:col-span-4">
                <div className="flex flex-col gap-2.5">
                  {GARAGE_OPTIONS.map((opt) => {
                    const open = openOption === opt.key;
                    return (
                      <div
                        key={opt.key}
                        className={`overflow-hidden rounded-xl border transition-all ${
                          open
                            ? "border-red-500/40 bg-white/[0.06]"
                            : "border-white/8 bg-white/[0.03] hover:border-red-500/40 hover:bg-white/[0.06]"
                        }`}
                      >
                        <button
                          onClick={() => setOpenOption(open ? null : opt.key)}
                          className="group flex w-full items-center gap-3 px-4 py-3 text-left"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-600/20 text-red-500">
                            <opt.icon className="h-4 w-4" />
                          </span>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-white">{opt.title}</p>
                            <p className="text-xs text-gray-400">{opt.desc}</p>
                          </div>
                          <FaChevron
                            className={`h-3 w-3 transition-transform ${
                              open ? "rotate-90 text-red-500" : "text-gray-500 group-hover:translate-x-1 group-hover:text-red-500"
                            }`}
                          />
                        </button>

                        {open && (
                          <div className="border-t border-white/8 px-4 py-3.5">
                            {opt.key === "paint" && (
                              <>
                                <div className="grid grid-cols-8 gap-2">
                                  {Object.entries(PAINT_SWATCHES).map(([hex, name]) => (
                                    <button
                                      key={hex}
                                      title={name}
                                      onClick={() => setBuildPart("paintHex", hex)}
                                      className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${
                                        garageBuild.paintHex === hex ? "scale-110 border-red-500" : "border-white/15"
                                      }`}
                                      style={{ backgroundColor: hex }}
                                    />
                                  ))}
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {PAINT_FINISHES.map((f) => (
                                    <button
                                      key={f.key}
                                      onClick={() => setBuildPart("paintFinish", f.key)}
                                      className={garageChip(garageBuild.paintFinish === f.key)}
                                    >
                                      {f.label}
                                    </button>
                                  ))}
                                </div>
                                <p className="mt-2.5 text-[11px] text-gray-500">
                                  {PAINT_SWATCHES[garageBuild.paintHex] ?? "Custom"} paint applied live.
                                </p>
                              </>
                            )}

                            {opt.key === "wheels" && (
                              <div className="flex flex-wrap gap-2">
                                {Object.entries(RIM_COLORS).map(([key, c]) => (
                                  <button
                                    key={key}
                                    onClick={() => setBuildPart("rimColor", key)}
                                    className={garageChip(garageBuild.rimColor === key)}
                                  >
                                    {c.hex && (
                                      <span
                                        className="h-3 w-3 rounded-full border border-white/25"
                                        style={{ backgroundColor: c.hex }}
                                      />
                                    )}
                                    {c.label}
                                  </button>
                                ))}
                              </div>
                            )}

                            {opt.key === "brakes" && (
                              <div className="flex flex-wrap gap-2">
                                {Object.entries(CALIPER_COLORS).map(([key, c]) => (
                                  <button
                                    key={key}
                                    onClick={() => setBuildPart("caliperColor", key)}
                                    className={garageChip(garageBuild.caliperColor === key)}
                                  >
                                    {c.hex && (
                                      <span
                                        className="h-3 w-3 rounded-full border border-white/25"
                                        style={{ backgroundColor: c.hex }}
                                      />
                                    )}
                                    {c.label}
                                  </button>
                                ))}
                              </div>
                            )}

                            {opt.key === "suspension" && (
                              <div>
                                <div className="mb-2 flex items-center justify-between">
                                  <span className="text-xs text-gray-400">Ride Height</span>
                                  <span className="text-xs font-semibold text-red-400">{suspensionLabel}</span>
                                </div>
                                <input
                                  type="range"
                                  min="-0.12"
                                  max="0.10"
                                  step="0.01"
                                  value={garageBuild.suspension}
                                  onChange={(e) => setBuildPart("suspension", parseFloat(e.target.value))}
                                  className="w-full accent-red-500"
                                />
                                <div className="mt-1 flex justify-between text-[10px] text-gray-500">
                                  <span>Slammed</span>
                                  <span>Stock</span>
                                  <span>Lifted</span>
                                </div>
                              </div>
                            )}

                            {opt.key === "exhaust" && (
                              <>
                                <div className="flex flex-wrap gap-2">
                                  {EXHAUST_OPTIONS.map((o) => (
                                    <button
                                      key={o.key}
                                      onClick={() => selectExhaust(o)}
                                      className={garageChip(garageBuild.exhaust === o.key)}
                                    >
                                      {o.label}
                                      {o.price > 0 && (
                                        <span className="font-normal text-gray-400">+Rs {o.price.toLocaleString()}</span>
                                      )}
                                    </button>
                                  ))}
                                </div>
                                <p className="mt-2.5 text-[11px] text-gray-500">Select a system to preview its exhaust note.</p>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-5 flex gap-3">
                  <Link
                    to={CIVIC_GARAGE_LINK}
                    className="flex flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-5 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-transform hover:scale-105"
                  >
                    Start Building
                  </Link>
                  <Link
                    to={CIVIC_GARAGE_LINK}
                    className="flex flex-1 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10"
                  >
                    Save Build
                  </Link>
                </div>
              </div>

              {/* Right column: live 3D Civic + dynamic stats */}
              <div className="flex flex-col gap-4 lg:col-span-8">
                <div
                  ref={garageStageRef}
                  className="relative h-[400px] w-full overflow-hidden rounded-2xl bg-[#0a0a0c] md:h-[520px]"
                >
                  {!carReady && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#0a0a0c]">
                      <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-red-500" />
                      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Loading Civic…</p>
                    </div>
                  )}
                  <Canvas key={garageSeed} dpr={[1, 1.5]} shadows camera={{ position: [-4.8, 1.9, 7.4], fov: 42 }}>
                    <Suspense fallback={null}>
                      <Environment preset="city" />
                      <directionalLight position={[5, 8, 5]} intensity={1.5} castShadow shadow-mapSize={[2048, 2048]} />
                      <directionalLight position={[-6, 4, -6]} intensity={0.5} color="#aaccff" />
                      <ambientLight intensity={0.25} />
                      <HomeGarageCar build={garageBuild} onReady={handleCarReady} />
                      <GaragePlatform />
                      <ContactShadows position={[0, 0, 0]} resolution={1024} scale={12} blur={2.4} opacity={0.65} far={4} />
                      <ZoomController zoomed={garageZoom} />
                      <OrbitControls
                        autoRotate={garageRotate}
                        autoRotateSpeed={0.9}
                        enablePan={false}
                        minDistance={4.5}
                        maxDistance={13}
                        maxPolarAngle={Math.PI / 2 - 0.04}
                        target={[0, 0.55, 0]}
                      />
                    </Suspense>
                  </Canvas>
                  <div className="pointer-events-none absolute left-4 top-4 rounded-full bg-black/50 px-3 py-1.5 text-xs font-semibold text-white/70 backdrop-blur-md">
                    Honda Civic — {PAINT_SWATCHES[garageBuild.paintHex] ?? "Custom"}
                  </div>
                  <div className="pointer-events-none absolute bottom-4 right-4 rounded-full bg-black/50 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-white/50 backdrop-blur-md">
                    Drag to Rotate
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {garageStats.map((s) => (
                    <div key={s.label} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-600/20 text-red-500">
                        <s.icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-gray-500">{s.label}</p>
                        <p className="text-sm font-bold text-white">{s.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ══ WHY CHOOSE — 4 horizontal items in one panel ══ */}
      <section className="bg-[#050505] px-6 py-16 md:px-10">
        <div className="mx-auto max-w-7xl rounded-3xl border border-white/8 bg-white/[0.02] px-8 py-12 md:px-12">
          <Reveal>
            <h2 className="mb-10 text-center text-3xl font-extrabold text-white sm:text-4xl">
              Why Choose AutoPartBazaar?
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_CHOOSE.map((item, index) => (
              <Reveal key={item.title} delay={index * 100} className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-red-500/30 bg-red-600/10 text-red-500">
                  <item.icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white">{item.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-gray-400">{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ COMMUNITY RATINGS ══ */}
      <section className="border-t border-white/5 bg-[#080808] px-6 py-20 md:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
            {/* Title + big average */}
            <Reveal className="lg:col-span-5">
              <h2 className="mb-2 text-3xl font-extrabold text-white sm:text-4xl">Community Ratings</h2>
              <p className="mb-6 text-gray-400">See what our customers are saying about us.</p>
              <div className="flex items-center gap-5 rounded-2xl border border-white/8 bg-white/[0.03] px-6 py-5">
                <div className="text-center">
                  <p className="text-5xl font-black tracking-tighter text-white">
                    {ratingSummary.average.toFixed(1)}
                  </p>
                  <div className="mt-1 flex justify-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <FaStar key={i} className={`h-4 w-4 ${i < ratingSummary.rounded ? "text-red-500" : "text-gray-700"}`} />
                    ))}
                  </div>
                  <p className="mt-1 text-[11px] text-gray-500">
                    Based on {ratingSummary.total.toLocaleString()} reviews
                  </p>
                </div>
              </div>
            </Reveal>

            {/* Rating bars */}
            <Reveal className="lg:col-span-4" delay={100}>
              <div className="flex flex-col gap-3">
                {REVIEW_LEVELS.map((rating) => {
                  const percentage = reviewStats.percentages?.[String(rating)] || 0;
                  return (
                    <div key={rating} className="flex items-center gap-3">
                      <span className="flex w-10 items-center gap-1 text-sm font-bold text-white">
                        {rating} <FaStar className="h-3 w-3 text-red-500" />
                      </span>
                      <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-white/8">
                        <div
                          className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-1000"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="w-10 text-right text-xs font-medium text-gray-500">{percentage}%</span>
                    </div>
                  );
                })}
              </div>
            </Reveal>

            {/* Avatars / social proof */}
            <Reveal className="lg:col-span-3" delay={200}>
              <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/8 bg-white/[0.03] px-6 py-8 text-center">
                <div className="flex -space-x-3">
                  {RATING_AVATARS.map((src) => (
                    <img
                      key={src}
                      src={src}
                      alt="enthusiast"
                      className="h-11 w-11 rounded-full border-2 border-[#080808] object-cover"
                    />
                  ))}
                  <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#080808] bg-red-600 text-xs font-bold text-white">
                    50k+
                  </span>
                </div>
                <p className="text-lg font-bold text-white">Join 50,000+ enthusiasts</p>
                <p className="text-sm text-gray-400">who build better with us.</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Recently Viewed (dynamic — only shows if user has history) */}
      {recentlyViewed.length > 0 && (
        <section className="bg-[#050505] border-t border-white/5 py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-extrabold text-white">Recently Viewed</h2>
              <div className="flex gap-4">
                <Link to="/compare" className="text-sm text-red-500 hover:text-red-400 font-semibold">
                  Compare Products →
                </Link>
                <button onClick={clearItems} className="text-sm text-gray-400 hover:text-white">
                  Clear
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {recentlyViewed.map((p) => (
                <Link
                  key={p.productId}
                  to={`/productdetail/${p.productId}`}
                  className="rounded-2xl border border-white/5 bg-white/[0.03] p-3 backdrop-blur-md transition-all hover:-translate-y-1 hover:border-white/10 hover:bg-white/[0.06] group"
                >
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="h-24 w-full object-contain rounded-lg mb-2 bg-white/5" />
                  ) : (
                    <div className="h-24 w-full bg-white/5 rounded-lg mb-2" />
                  )}
                  <p className="text-xs font-medium text-gray-200 line-clamp-2 group-hover:text-red-500">{p.name}</p>
                  <p className="text-xs text-red-500 font-bold mt-1">Rs {p.price?.toLocaleString()}</p>
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
