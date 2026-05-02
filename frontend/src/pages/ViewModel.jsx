import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import axiosInstance from "@/api/axiosInstance.js";

const CAR_CATALOG = {
  Toyota: [
    {
      name: "GR Supra RZ (Pandem)",
      modelUrl: "/models/toyota/supra.glb",
      sourceUrl: "https://sketchfab.com/3d-models/2023-toyota-gr-supra-rz-db42-pandem-kit-1fa7b2dc48f340878d9e5aaf1000971d",
    },
    {
      name: "Corolla",
      modelUrl: "/carmodels/corolla2.glb",
      sourceUrl: "https://sketchfab.com/3d-models/toyota-corolla-4703efa36e4b4aa9a342db3153ce3edd",
    },
  ],
  Honda: [
    {
      name: "Civic",
      modelUrl: "/models/honda/civic.glb",
      sourceUrl: "https://sketchfab.com/3d-models/honda-civic-ff844e296f214e709c0d0691d031c68b",
    },
    {
      name: "Accord",
      modelUrl: "",
      sourceUrl: "https://sketchfab.com/3d-models/honda-accord-2017-68892cd369e84a218e5e5dcf82365ee3",
    },
  ],
  BMW: [
    {
      name: "M4 Competition M Package",
      modelUrl: "/models/bmw/m4.glb",
      sourceUrl: "https://sketchfab.com/3d-models/bmw-m4-competition-m-package-5c0a2dafb1ad408d9fc9eeef9aee531b",
    },
    {
      name: "3 Series",
      modelUrl: "/carmodels/bmw.glb",
      sourceUrl: "https://sketchfab.com/3d-models/bmw-3-series-e91-2004-2012-b048a2c6a67d416eb31d4c620e5b4426",
    },
  ],
  Lamborghini: [
    {
      name: "Huracan LP610-4",
      modelUrl: "/models/lamborghini/huracan.glb",
      sourceUrl: "https://sketchfab.com/3d-models/lamborghini-huracan-lp-6104-2014-4b7b162bcb4f48849f30b1c25b3102a3",
    },
  ],
};

const CarSearch = () => {
  const navigate = useNavigate();
  const [selectedMake, setSelectedMake] = useState("");
  const [selectedCar, setSelectedCar] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const availableCars = useMemo(() => CAR_CATALOG[selectedMake] ?? [], [selectedMake]);
  const selectedEntry = useMemo(
    () => availableCars.find((car) => car.name === selectedCar) ?? null,
    [availableCars, selectedCar]
  );

  const handleShowModel = async () => {
    setError("");

    if (!selectedMake || !selectedCar || !selectedEntry) {
      setError("Please select both make and model before searching.");
      return;
    }

    setLoading(true);
    let modelUrl = selectedEntry.modelUrl?.trim() ?? "";

    if (!modelUrl) {
      try {
        const { data } = await axiosInstance.get("/getCarModel", {
          params: { make: selectedMake, car: selectedCar },
        });
        if (data?.success && data.modelUrl?.trim()) modelUrl = data.modelUrl.trim();
      } catch {
        /* optional */
      }
    }

    if (!modelUrl) {
      setError("No GLB model URL is configured for this vehicle yet.");
      setLoading(false);
      return;
    }

    const params = new URLSearchParams({
      modelUrl,
      make: selectedMake,
      name: selectedEntry.name,
    });
    navigate(`/garage?${params.toString()}`);
    setLoading(false);
  };

  return (
    <>
      <Navbar />
      <div className="relative min-h-screen bg-[#050505] flex items-center justify-center p-4 overflow-hidden selection:bg-red-500/30">
        {/* Background glow effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gray-600/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10 w-full max-w-2xl backdrop-blur-xl bg-white/[0.03] border border-white/10 p-10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] text-center">
          <div className="mb-8">
            <span className="text-red-500 font-bold uppercase tracking-[0.2em] text-xs mb-3 block">3D Configurator</span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tight">
              Select Your Vehicle
            </h2>
          </div>

          <div className="space-y-6 text-left">
            <div>
              <label className="block text-sm font-semibold text-gray-400 uppercase tracking-widest mb-2 ml-1">Make</label>
              <div className="relative">
                <select
                  value={selectedMake}
                  onChange={(e) => {
                    setSelectedMake(e.target.value);
                    setSelectedCar("");
                    setError("");
                  }}
                  className="w-full appearance-none bg-black/50 border border-white/10 text-white rounded-xl px-5 py-4 text-lg font-medium outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all cursor-pointer"
                >
                  <option value="" disabled className="text-gray-500">Choose Manufacturer</option>
                  {Object.keys(CAR_CATALOG).map((make) => (
                    <option key={make} value={make} className="bg-gray-900 text-white">
                      {make}
                    </option>
                  ))}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <div className={`transition-all duration-500 ${selectedMake ? 'opacity-100 h-auto' : 'opacity-0 h-0 overflow-hidden'}`}>
              <label className="block text-sm font-semibold text-gray-400 uppercase tracking-widest mb-2 ml-1">Model</label>
              <div className="relative">
                <select
                  value={selectedCar}
                  onChange={(e) => {
                    setSelectedCar(e.target.value);
                    setError("");
                  }}
                  className="w-full appearance-none bg-black/50 border border-white/10 text-white rounded-xl px-5 py-4 text-lg font-medium outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all cursor-pointer disabled:opacity-50"
                  disabled={!selectedMake}
                >
                  <option value="" disabled className="text-gray-500">Choose Chassis</option>
                  {availableCars.map((car) => (
                    <option key={car.name} value={car.name} className="bg-gray-900 text-white">
                      {car.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {selectedEntry && (
            <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10 text-left flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Source Model</p>
                <p className="text-gray-300 font-medium">{selectedEntry.name}</p>
              </div>
              <a
                href={selectedEntry.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-red-400 hover:text-red-300 text-sm font-semibold flex items-center gap-1 transition-colors"
              >
                View on Sketchfab
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-red-400 font-medium">{error}</p>
            </div>
          )}

          <div className={`mt-10 transition-all duration-500 ${selectedCar ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
            <button
              onClick={handleShowModel}
              disabled={loading || !selectedCar}
              className="w-full relative group overflow-hidden rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-6 py-5 font-bold text-white shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all hover:shadow-[0_0_30px_rgba(220,38,38,0.5)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <span className="relative flex items-center justify-center gap-2 text-lg">
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading Garage...
                  </>
                ) : (
                  <>
                    Enter Garage
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </span>
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default CarSearch;
