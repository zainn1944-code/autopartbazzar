import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";

const CAR_CATALOG = {
  Toyota: [
    {
      name: "Corolla",
      modelUrl: "",
      sourceUrl: "https://sketchfab.com/3d-models/toyota-corolla-4703efa36e4b4aa9a342db3153ce3edd",
    },
    {
      name: "Camry",
      modelUrl: "",
      sourceUrl: "https://sketchfab.com/3d-models/toyota-camry-v80-98c70e5aa53446728fea4d8f448bbf33",
    },
    {
      name: "Hilux",
      modelUrl: "",
      sourceUrl: "https://sketchfab.com/3d-models/toyota-hilux-417915f419f945c8a424b2a7943eb25a",
    },
  ],
  Honda: [
    {
      name: "Civic",
      modelUrl: "/carmodels/civic2.glb",
      sourceUrl: "https://sketchfab.com/3d-models/honda-civic-ff844e296f214e709c0d0691d031c68b",
    },
    {
      name: "Accord",
      modelUrl: "",
      sourceUrl: "https://sketchfab.com/3d-models/honda-accord-2017-68892cd369e84a218e5e5dcf82365ee3",
    },
    {
      name: "CR-V",
      modelUrl: "",
      sourceUrl: "https://sketchfab.com/3d-models/honda-cr-v-4d0751311d76473b81377f5bd2da273b",
    },
  ],
  Nissan: [
    {
      name: "Altima",
      modelUrl: "",
      sourceUrl: "https://sketchfab.com/3d-models/nissan-altima",
    },
    {
      name: "Sunny",
      modelUrl: "",
      sourceUrl: "https://sketchfab.com/3d-models/nissan-sunny",
    },
    {
      name: "GTR",
      modelUrl: "",
      sourceUrl: "https://sketchfab.com/3d-models/nissan-gtr",
    },
  ],
  BMW: [
    {
      name: "3 Series",
      modelUrl: "/carmodels/bmw.glb",
      sourceUrl: "https://sketchfab.com/3d-models/bmw-3-series-e91-2004-2012-b048a2c6a67d416eb31d4c620e5b4426",
    },
    {
      name: "M3",
      modelUrl: "",
      sourceUrl: "https://sketchfab.com/3d-models/free-bmw-m3-e30-ac3c7013434e403e8faff87948caf422",
    },
    {
      name: "X5",
      modelUrl: "",
      sourceUrl: "https://sketchfab.com/3d-models/bmw-x5-f1adb5c9133f4938a9ee03076c2a1e5a",
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

  const handleShowModel = () => {
    setError("");

    if (!selectedMake || !selectedCar || !selectedEntry) {
      setError("Please select both make and model before searching.");
      return;
    }

    if (!selectedEntry.modelUrl) {
      setError("No GLB model URL is configured for this vehicle yet.");
      return;
    }

    setLoading(true);
    const params = new URLSearchParams({
      modelUrl: selectedEntry.modelUrl,
      make: selectedMake,
      name: selectedEntry.name,
    });
    navigate(`/garage?${params.toString()}`);
  };

  return (
    <>
      <Navbar />
      <div className="flex justify-center items-center min-h-screen bg-gray-900 text-gray-300 px-4">
        <div className="w-full max-w-2xl bg-gray-800 p-10 rounded-lg shadow-xl text-center">
          <h2 className="text-3xl font-bold text-gray-100 mb-8">Search for Cars</h2>

          <div className="mb-6">
            <label className="block text-lg font-medium text-gray-100 mb-2">Select Make</label>
            <select
              value={selectedMake}
              onChange={(e) => {
                setSelectedMake(e.target.value);
                setSelectedCar("");
                setError("");
              }}
              className="w-full border border-gray-500 bg-gray-900 text-gray-100 rounded-lg px-4 py-3 text-lg focus:ring-4 focus:ring-red-500"
            >
              <option value="">Choose Make</option>
              {Object.keys(CAR_CATALOG).map((make) => (
                <option key={make} value={make}>
                  {make}
                </option>
              ))}
            </select>
          </div>

          {selectedMake && (
            <div className="mb-6">
              <label className="block text-lg font-medium text-gray-100 mb-2">Select Model</label>
              <select
                value={selectedCar}
                onChange={(e) => {
                  setSelectedCar(e.target.value);
                  setError("");
                }}
                className="w-full border border-gray-500 bg-gray-900 text-gray-100 rounded-lg px-4 py-3 text-lg focus:ring-4 focus:ring-red-500"
              >
                <option value="">Choose Model</option>
                {availableCars.map((car) => (
                  <option key={car.name} value={car.name}>
                    {car.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedEntry && (
            <p className="mb-4 text-sm text-slate-400">
              Source model:{" "}
              <a
                href={selectedEntry.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 underline"
              >
                {selectedEntry.name}
              </a>
            </p>
          )}

          {selectedCar && (
            <button
              onClick={handleShowModel}
              className={`mt-4 w-full py-3 text-lg rounded-lg transition-all ${
                loading ? "bg-gray-600 cursor-not-allowed" : "bg-red-500 hover:bg-red-700"
              } text-white`}
              disabled={loading}
            >
              {loading ? "Loading..." : "Show Model"}
            </button>
          )}

          {error && <p className="mt-4 text-red-500 font-semibold">{error}</p>}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default CarSearch;
