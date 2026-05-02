import { useEffect, useMemo, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, PresentationControls, Bounds } from "@react-three/drei";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import {
  PAINT_SWATCHES,
  DEFAULT_BODY_PAINT,
  applyBodyPaint,
  removeAttachedParts,
  getCustomizationProfile,
  enhanceTailLightEmissive,
} from "@/lib/carCustomization.js";

// Inner component to handle the loading and rendering of the car model
function CarScene({ modelUrl, carMake, onModelLoaded, setLoadError }) {
  const [localCar, setLocalCar] = useState(null);

  useEffect(() => {
    if (!modelUrl) return;
    const loader = new GLTFLoader();
    loader.load(
      decodeURIComponent(modelUrl),
      (gltf) => {
        const loadedCar = gltf.scene;
        applyBodyPaint(loadedCar, DEFAULT_BODY_PAINT);

        // Apply manual scale from profile instead of brittle auto-scaling
        const profile = getCustomizationProfile(carMake, modelUrl);
        if (profile.modelScale) {
          loadedCar.scale.set(profile.modelScale[0], profile.modelScale[1], profile.modelScale[2]);
        }

        // Recompute bounds after scaling to center the car
        loadedCar.updateMatrixWorld(true);
        const scaledBox = new THREE.Box3();
        loadedCar.traverse((child) => {
          if (child.isMesh) scaledBox.expandByObject(child);
        });
        const center = scaledBox.getCenter(new THREE.Vector3());
        
        // Center the original car mesh inside a wrapper
        loadedCar.position.set(-center.x, -scaledBox.min.y, -center.z);

        // Turn on shadows for the car
        loadedCar.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        // We use a wrapper group so custom parts added later don't inherit the weird scale of the original GLB!
        const carWrapper = new THREE.Group();
        carWrapper.add(loadedCar);

        setLocalCar(carWrapper);
        if (onModelLoaded) onModelLoaded(carWrapper);
      },
      undefined,
      (error) => {
        setLoadError(`Model could not be loaded: ${decodeURIComponent(modelUrl)}`);
        console.error("Error loading model:", error);
      }
    );
  }, [modelUrl, onModelLoaded, setLoadError]);

  if (!localCar) return null;

  return (
    <>
      <Bounds fit clip observe margin={1.2}>
        <primitive object={localCar} />
      </Bounds>
      
      {/* Photorealistic Lighting & Environment */}
      <Environment preset="city" />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={1.5} 
        castShadow 
        shadow-mapSize-width={2048} 
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      
      {/* Realistic ground shadow */}
      <ContactShadows resolution={1024} scale={10} blur={2} opacity={0.5} far={10} color="#000000" />
      
      {/* Smooth orbiting controls */}
      <OrbitControls 
        makeDefault 
        minPolarAngle={0} 
        maxPolarAngle={Math.PI / 2 + 0.1} 
        enablePan={false} 
        minDistance={2} 
        maxDistance={15} 
        dampingFactor={0.05}
      />
    </>
  );
}

export default function Garage() {
  const [selectedParts, setSelectedParts] = useState({});
  const [dropdowns, setDropdowns] = useState({});
  const [carModel, setCarModel] = useState(null);
  const [selectedColorName, setSelectedColorName] = useState("");
  const [loadError, setLoadError] = useState("");

  const [searchParams] = useSearchParams();
  const modelUrl = searchParams.get("modelUrl");
  const carMake = searchParams.get("make") || "";
  const carName = searchParams.get("name") || "";
  const displayTitle = [carMake, carName].filter(Boolean).join(" ") || "Custom Build";

  const engineAudioRef = useRef(null);
  const revAudioRef = useRef(null);

  const customizationProfile = useMemo(
    () => getCustomizationProfile(carMake, modelUrl),
    [carMake, modelUrl]
  );

  const makeKey = carMake.toLowerCase();
  // Replace Toyota/Lamborghini fallbacks once dedicated clips are added under /public/audio.
  const AUDIO_MAP = {
    bmw:         { engine: '/audio/bmwstart.mp3',      rev: '/audio/bmwrev.mp3'      },
    toyota:      { engine: '/audio/civicstart.mp3',    rev: '/audio/civicrev.mp3'    },
    lamborghini: { engine: '/audio/bmwstart.mp3',      rev: '/audio/bmwrev.mp3'      },
    honda:       { engine: '/audio/civicstart.mp3',    rev: '/audio/civicrev.mp3'    },
  };
  const audioSrcs = AUDIO_MAP[makeKey] ?? AUDIO_MAP.honda;
  const engineAudioSrc = audioSrcs.engine;
  const revAudioSrc = audioSrcs.rev;

  useEffect(() => {
    if (modelUrl) {
      setLoadError("");
      setSelectedColorName(PAINT_SWATCHES[DEFAULT_BODY_PAINT] ?? "Custom");
    }
  }, [modelUrl]);

  const loadTires = (tireModelPath) => {
    if (!carModel || !tireModelPath) return;

    const tp = customizationProfile.tires;
    const useAlt = tireModelPath.includes("tire1.glb");
    const scaleArr = useAlt ? tp.altScale : tp.defaultScale;
    const wheelPositions = useAlt ? tp.altPositions : tp.defaultPositions;
    const rotArr = useAlt ? tp.altRotation : tp.defaultRotation;

    const loader = new GLTFLoader();
    loader.load(tireModelPath, (gltf) => {
      const tireModel = gltf.scene;
      tireModel.scale.set(scaleArr[0], scaleArr[1], scaleArr[2]);

      removeAttachedParts(carModel, (name) => name.includes("tire") || name.includes("wheel") || name.includes("rim"));

      wheelPositions.forEach((pos, index) => {
        const tireClone = tireModel.clone(true);
        tireClone.position.set(pos.x, pos.y, pos.z);
        tireClone.rotation.set(rotArr[0], rotArr[1], rotArr[2]);
        tireClone.name = `tire_${index}`;
        carModel.add(tireClone);
      });
    });
  };

  const loadBumper = (bumperModelPath) => {
    if (!carModel || !bumperModelPath) return;

    const bp = customizationProfile.bumper;
    const loader = new GLTFLoader();
    loader.load(bumperModelPath, (gltf) => {
      const bumperModel = gltf.scene;
      bumperModel.scale.set(bp.scale[0], bp.scale[1], bp.scale[2]);
      bumperModel.position.set(bp.position[0], bp.position[1], bp.position[2]);
      bumperModel.rotation.set(bp.rotation[0], bp.rotation[1], bp.rotation[2]);

      const oldBumper = carModel.getObjectByName("bumper");
      if (oldBumper) carModel.remove(oldBumper);

      bumperModel.name = "bumper";
      carModel.add(bumperModel);
    });
  };

  const loadXenonLights = (modelPath) => {
    if (!carModel || !modelPath) return;

    const preset =
      modelPath.includes("civiclight.glb") ? customizationProfile.xenon.civiclight : customizationProfile.xenon.default;

    const loader = new GLTFLoader();
    loader.load(modelPath, (gltf) => {
      const rightLight = gltf.scene;
      rightLight.scale.set(preset.scale[0], preset.scale[1], preset.scale[2]);
      rightLight.position.set(preset.pos[0], preset.pos[1], preset.pos[2]);
      rightLight.rotation.set(preset.rot[0], preset.rot[1], preset.rot[2]);
      rightLight.name = "xenon_light_right";

      const leftLight = rightLight.clone(true);
      leftLight.position.set(-preset.pos[0], preset.pos[1], preset.pos[2]);
      leftLight.rotation.set(preset.rot[0], -preset.rot[1], preset.rot[2]);
      leftLight.name = "xenon_light_left";

      removeAttachedParts(
        carModel,
        (name) => name === "xenon_light_right" || name === "xenon_light_left"
      );

      carModel.add(rightLight);
      carModel.add(leftLight);
    });
  };

  const loadBackLights = (modelPath) => {
    if (!carModel || !modelPath) return;

    const cfg = customizationProfile.backlight;
    const loader = new GLTFLoader();
    loader.load(modelPath, (gltf) => {
      removeAttachedParts(carModel, (name) => name.includes("back_light"));

      const rightLight = gltf.scene.clone(true);
      rightLight.scale.set(cfg.scale[0], cfg.scale[1], cfg.scale[2]);
      rightLight.position.set(cfg.rightPos[0], cfg.rightPos[1], cfg.rightPos[2]);
      rightLight.rotation.set(cfg.rotation[0], cfg.rotation[1], cfg.rotation[2]);
      rightLight.name = "back_light_right";
      enhanceTailLightEmissive(rightLight);

      const leftLight = gltf.scene.clone(true);
      leftLight.scale.set(cfg.scale[0], cfg.scale[1], cfg.scale[2]);
      leftLight.position.set(cfg.leftPos[0], cfg.leftPos[1], cfg.leftPos[2]);
      leftLight.rotation.set(cfg.rotation[0], cfg.rotation[1], cfg.rotation[2]);
      leftLight.name = "back_light_left";
      enhanceTailLightEmissive(leftLight);

      carModel.add(rightLight);
      carModel.add(leftLight);
    });
  };

  const paintColors = Object.keys(PAINT_SWATCHES);

  const handleColorSelection = (color) => {
    setSelectedColorName(PAINT_SWATCHES[color] ?? "Custom");
    if (carModel) applyBodyPaint(carModel, color);
  };

  const parts = useMemo(() => {
    const BASE = '/models';
    const MAKE = makeKey;

    const SHARED_TYRES = [
      { name: 'Sport Tyres',  price: 1200, model: `${BASE}/shared/tire.glb`  },
      { name: 'Alloy Rims',   price: 1400, model: `${BASE}/shared/tire1.glb` },
    ];

    const BUMPERS = {
      honda: [
        { name: 'Front Bumper',    price: 1500, model: `${BASE}/honda/civicfbumper.glb`  },
        { name: 'Front Bumper V2', price: 1700, model: `${BASE}/honda/civicfbumper1.glb` },
      ],
      bmw: [
        { name: 'M Performance Front', price: 2200, model: `${BASE}/honda/civicfbumper.glb` },
        { name: 'CSL Front Splitter',  price: 2800, model: `${BASE}/honda/civicfbumper1.glb` },
      ],
      toyota: [
        { name: 'TRD Front Lip',   price: 1600, model: `${BASE}/honda/civicfbumper.glb` },
      ],
      lamborghini: [
        { name: 'Aerodynamica Front', price: 3500, model: `${BASE}/honda/civicfbumper1.glb` },
      ],
    };

    const FRONT_LIGHTS = {
      honda: [
        { name: 'Xenon Lights',       price: 1350, model: `${BASE}/honda/civicrightlight.glb` },
        { name: 'Black Sports Lights', price: 1350, model: `${BASE}/honda/civiclight.glb`      },
      ],
      bmw:         [{ name: 'Adaptive LED', price: 2100, model: `${BASE}/honda/civiclight.glb` }],
      toyota:      [{ name: 'LED Matrix',   price: 1800, model: `${BASE}/honda/civicrightlight.glb` }],
      lamborghini: [{ name: 'Xenon Blades', price: 3200, model: `${BASE}/honda/civiclight.glb` }],
    };

    return {
      tyres:        SHARED_TYRES,
      frontBumpers: BUMPERS[MAKE]  ?? BUMPERS.honda,
      rearBumpers: [
        { name: 'Rear Bumper',    price: 1300 },
        { name: 'Rear Bumper V2', price: 1500 },
      ],
      frontLights:  FRONT_LIGHTS[MAKE] ?? FRONT_LIGHTS.honda,
      rearLights: [
        { name: 'LED Strip Tails', price: 1350, model: `${BASE}/shared/backlight.glb` },
      ],
    };
  }, [makeKey]);

  const toggleDropdown = (category) => {
    setDropdowns((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  const handlePartSelection = (category, part) => {
    setSelectedParts((prev) => ({ ...prev, [category]: part }));

    if (category === "tyres" && part.model) loadTires(part.model);
    if (category === "frontBumpers" && part.model) loadBumper(part.model);
    if (category === "frontLights" && part.model) loadXenonLights(part.model);
    if (category === "rearLights" && part.model) loadBackLights(part.model);
  };

  const playAudio = (audioRef, buttonId) => {
    const audio = audioRef.current;
    const btn = document.getElementById(buttonId);
    if (!audio || !btn) return;

    if (audio.paused) {
      audio.play();
      btn.classList.add("ring-4", "ring-yellow-400", "scale-105");
    } else {
      audio.pause();
      audio.currentTime = 0;
      btn.classList.remove("ring-4", "ring-yellow-400", "scale-105");
    }

    audio.onended = () => {
      btn.classList.remove("ring-4", "ring-yellow-400", "scale-105");
    };
  };

  if (!modelUrl) {
    return (
      <div className="w-full h-screen flex flex-col bg-[#121212] text-white font-sans">
        <Navbar />
        <div className="flex flex-grow items-center justify-center p-6">
          <div className="max-w-md text-center bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.5)]">
            <h2 className="text-3xl font-extrabold text-red-500 mb-4 tracking-tight">No Car Selected</h2>
            <p className="text-gray-300 leading-relaxed text-lg">
              The garage requires a <span className="font-semibold text-white">model</span> to configure.
              Please pick a vehicle from the catalog.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col bg-[#0a0a0a] text-white font-sans overflow-hidden">
      <Navbar className="relative z-50 shadow-md" />
      
      <div className="relative flex-grow w-full h-full">
        {/* Fullscreen 3D Canvas */}
        <div className="absolute inset-0 z-0">
          <Canvas shadows camera={{ position: [5, 2, 8], fov: 45 }}>
            <color attach="background" args={["#161618"]} />
            <CarScene
              modelUrl={modelUrl}
              carMake={carMake}
              onModelLoaded={setCarModel}
              setLoadError={setLoadError}
            />
          </Canvas>

          {loadError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
              <div className="bg-red-500/20 border border-red-500 rounded-xl p-6 backdrop-blur-sm">
                <p className="text-red-400 font-semibold text-lg">{loadError}</p>
              </div>
            </div>
          )}
        </div>

        {/* Premium Glassmorphism UI Overlay */}
        <div className="absolute top-6 right-6 bottom-6 w-80 sm:w-96 bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.6)] p-6 flex flex-col z-10 overflow-y-auto custom-scrollbar">
          <h2 className="text-2xl font-bold text-white mb-1 tracking-wide">{displayTitle}</h2>
          <p className="text-xs text-red-500 font-semibold mb-6 uppercase tracking-[0.2em]">Configurator</p>

          {/* Color Selection */}
          <div className="mb-8">
            <h4 className="text-xs text-gray-400 uppercase tracking-widest mb-3 font-semibold">Exterior Color</h4>
            <div className="flex flex-wrap gap-3">
              {paintColors.map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorSelection(color)}
                  className={`w-9 h-9 rounded-full border-[3px] transition-all duration-300 ${
                    selectedColorName === PAINT_SWATCHES[color] 
                      ? "border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.4)]" 
                      : "border-transparent hover:scale-110 hover:border-white/50 hover:shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Select color ${PAINT_SWATCHES[color]}`}
                />
              ))}
            </div>
            {selectedColorName && (
              <p className="mt-3 text-sm font-medium text-gray-200">
                {selectedColorName}
              </p>
            )}
          </div>

          {/* Parts Selection Dropdowns */}
          <div className="flex-1 space-y-4">
            <h4 className="text-xs text-gray-400 uppercase tracking-widest mb-2 font-semibold">Modifications</h4>
            {Object.keys(parts).map((category) => (
              <div key={category} className="rounded-2xl overflow-hidden bg-white/5 border border-white/10 transition-all">
                <button
                  className="w-full px-5 py-4 text-left flex justify-between items-center text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                  onClick={() => toggleDropdown(category)}
                >
                  {category.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                  <span className={`transform transition-transform duration-300 ${dropdowns[category] ? "rotate-180" : ""}`}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </span>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    dropdowns[category] ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="p-2 bg-black/30 backdrop-blur-md space-y-1">
                    {parts[category].map((part) => (
                      <button
                        key={part.name}
                        className={`w-full text-left px-4 py-3 text-sm rounded-xl transition-all duration-200 ${
                          selectedParts[category]?.name === part.name
                            ? "bg-red-600 text-white shadow-lg"
                            : "text-gray-300 hover:text-white hover:bg-white/10"
                        }`}
                        onClick={() => handlePartSelection(category, part)}
                      >
                        {part.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Engine Audio Controls */}
          <div className="mt-8 space-y-3 pb-4">
            <h4 className="text-xs text-gray-400 uppercase tracking-widest mb-2 font-semibold">Engine Control</h4>
            <button
              id="engine-btn"
              onClick={() => playAudio(engineAudioRef, "engine-btn")}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold tracking-wide shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all transform hover:-translate-y-0.5"
            >
              Start Engine
            </button>
            <audio ref={engineAudioRef} src={engineAudioSrc} preload="auto" />

            <button
              id="rev-btn"
              onClick={() => playAudio(revAudioRef, "rev-btn")}
              className="w-full py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold tracking-wide transition-all border border-white/10 transform hover:-translate-y-0.5"
            >
              Rev Engine
            </button>
            <audio ref={revAudioRef} src={revAudioSrc} preload="auto" />
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.2);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.4);
        }
      `}} />
    </div>
  );
}
