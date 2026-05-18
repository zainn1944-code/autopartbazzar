import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import axiosInstance from "@/api/axiosInstance.js";

const STATIC_CAR_CATALOG = {
  Honda: [
    {
      name: "Civic",
      car: "Civic",
      modelYear: 2023,
      modelUrl: "/models/honda/civic.glb",
      sourceUrl: "https://sketchfab.com/3d-models/honda-civic-ff844e296f214e709c0d0691d031c68b",
    },
  ],
};

function buildSourceLookup() {
  const lookup = new Map();
  Object.entries(STATIC_CAR_CATALOG).forEach(([make, entries]) => {
    entries.forEach((entry) => {
      lookup.set(`${make}|${entry.car}`, entry);
    });
  });
  return lookup;
}

const sourceLookup = buildSourceLookup();

function buildCatalogFromStatic() {
  return Object.fromEntries(
    Object.entries(STATIC_CAR_CATALOG).map(([make, entries]) => [
      make,
      entries.map((entry, index) => ({
        ...entry,
        key: `${make}-${entry.car}-${entry.modelYear || index}`,
      })),
    ])
  );
}

export default function CarSearch() {
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState(buildCatalogFromStatic);
  const [selectedMake, setSelectedMake] = useState("");
  const [selectedCarKey, setSelectedCarKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(true);

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const { data } = await axiosInstance.get("/getCarModel/catalog");
        const grouped = {};

        for (const row of data.cars || []) {
          const fallback = sourceLookup.get(`${row.make}|${row.car}`);
          const entry = {
            key: `${row.make}-${row.car}-${row.model || "catalog"}`,
            name: row.car,
            car: row.car,
            modelYear: Number(row.model) || null,
            modelUrl: fallback?.modelUrl || row.modelUrl || "",
            sourceUrl: fallback?.sourceUrl || "",
          };
          grouped[row.make] = [...(grouped[row.make] || []), entry];
        }

        if (Object.keys(grouped).length > 0) {
          for (const [make, entries] of Object.entries(STATIC_CAR_CATALOG)) {
            if (!grouped[make]) {
              grouped[make] = entries.map((entry, index) => ({
                ...entry,
                key: `${make}-${entry.car}-${entry.modelYear || index}`,
              }));
            }
          }
          setCatalog(grouped);
        }
      } catch {
        setCatalog(buildCatalogFromStatic());
      } finally {
        setCatalogLoading(false);
      }
    };

    loadCatalog();
  }, []);

  const availableCars = useMemo(() => catalog[selectedMake] ?? [], [catalog, selectedMake]);
  const selectedEntry = useMemo(
    () => availableCars.find((car) => car.key === selectedCarKey) ?? null,
    [availableCars, selectedCarKey]
  );

  const handleShowModel = async () => {
    setError("");

    if (!selectedMake || !selectedEntry) {
      setError("Please select both make and model before searching.");
      return;
    }

    setLoading(true);
    let modelUrl = selectedEntry.modelUrl?.trim() ?? "";

    if (!modelUrl) {
      try {
        const { data } = await axiosInstance.get("/getCarModel", {
          params: {
            make: selectedMake,
            car: selectedEntry.car,
            model: selectedEntry.modelYear || undefined,
          },
        });
        if (data?.success && data.modelUrl?.trim()) modelUrl = data.modelUrl.trim();
      } catch {
        // optional fallback
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
      year: String(selectedEntry.modelYear || ""),
    });
    navigate(`/garage?${params.toString()}`);
    setLoading(false);
  };

  return (
    <>
      <Navbar />
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050505] p-4 selection:bg-red-500/30">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-600/10 blur-[120px]" />
        <div className="pointer-events-none absolute right-0 top-0 h-[400px] w-[400px] rounded-full bg-gray-600/10 blur-[100px]" />

        <div className="relative z-10 w-full max-w-2xl rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          <div className="mb-8">
            <span className="mb-3 block text-xs font-bold uppercase tracking-[0.2em] text-red-500">
              3D Configurator
            </span>
            <h2 className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent md:text-5xl">
              Select Your Vehicle
            </h2>
            <p className="mt-4 text-sm text-gray-400">
              Vehicles are now loaded from the backend catalog with local model fallbacks.
            </p>
          </div>

          <div className="space-y-6 text-left">
            <div>
              <label className="ml-1 mb-2 block text-sm font-semibold uppercase tracking-widest text-gray-400">
                Make
              </label>
              <div className="relative">
                <select
                  value={selectedMake}
                  onChange={(e) => {
                    setSelectedMake(e.target.value);
                    setSelectedCarKey("");
                    setError("");
                  }}
                  className="w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-black/50 px-5 py-4 text-lg font-medium text-white outline-none transition-all focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  disabled={catalogLoading}
                >
                  <option value="" disabled className="text-gray-500">
                    {catalogLoading ? "Loading manufacturers..." : "Choose Manufacturer"}
                  </option>
                  {Object.keys(catalog).map((make) => (
                    <option key={make} value={make} className="bg-gray-900 text-white">
                      {make}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <div className={`transition-all duration-500 ${selectedMake ? "h-auto opacity-100" : "h-0 overflow-hidden opacity-0"}`}>
              <label className="ml-1 mb-2 block text-sm font-semibold uppercase tracking-widest text-gray-400">
                Model
              </label>
              <div className="relative">
                <select
                  value={selectedCarKey}
                  onChange={(e) => {
                    setSelectedCarKey(e.target.value);
                    setError("");
                  }}
                  className="w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-black/50 px-5 py-4 text-lg font-medium text-white outline-none transition-all focus:border-red-500 focus:ring-1 focus:ring-red-500 disabled:opacity-50"
                  disabled={!selectedMake}
                >
                  <option value="" disabled className="text-gray-500">
                    Choose Chassis
                  </option>
                  {availableCars.map((car) => (
                    <option key={car.key} value={car.key} className="bg-gray-900 text-white">
                      {car.name}{car.modelYear ? ` (${car.modelYear})` : ""}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {selectedEntry && (
            <div className="mt-6 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 text-left">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">Catalog Entry</p>
                <p className="font-medium text-gray-300">
                  {selectedEntry.name}
                  {selectedEntry.modelYear ? ` ${selectedEntry.modelYear}` : ""}
                </p>
              </div>
              {selectedEntry.sourceUrl && (
                <a
                  href={selectedEntry.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-sm font-semibold text-red-400 transition-colors hover:text-red-300"
                >
                  View Source
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
          )}

          {error && (
            <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
              <p className="font-medium text-red-400">{error}</p>
            </div>
          )}

          <div className={`mt-10 transition-all duration-500 ${selectedCarKey ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"}`}>
            <button
              onClick={handleShowModel}
              disabled={loading || !selectedCarKey}
              className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-6 py-5 font-bold text-white shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all hover:shadow-[0_0_30px_rgba(220,38,38,0.5)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div className="absolute inset-0 translate-y-full bg-white/20 transition-transform duration-300 ease-out group-hover:translate-y-0" />
              <span className="relative flex items-center justify-center gap-2 text-lg">
                {loading ? (
                  <>
                    <svg className="-ml-1 mr-3 h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Loading Garage...
                  </>
                ) : (
                  <>
                    Enter Garage
                    <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
}
