import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bounds, ContactShadows, Environment, OrbitControls, SpotLight, useGLTF } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import { useCart } from "@/context/CartContext.jsx";
import AIModPanel from "@/components/AIModPanel.jsx";
import {
  makeCenteredGroup,
  adaptiveWheelPositions,
  adaptiveBumperPos,
  adaptiveLightPositions,
} from "@/components/CarModificationManager.jsx";
import {
  PAINT_SWATCHES,
  PAINT_FINISHES,
  WINDOW_TINTS,
  DEFAULT_BODY_PAINT,
  applyBodyPaint,
  applyWindowTint,
  removeAttachedParts,
  enhanceTailLightEmissive,
  getCustomizationProfile,
} from "@/lib/carCustomization.js";

// ─── Hardcoded catalogue ──────────────────────────────────────────────────────
const BASE_MODS = {
  "Front Bumper": [
    { name: "Standard Bumper",     price:  800, model: "/models/honda/civicfbumper.glb" },
    { name: "Carbon Fibre Bumper", price: 2500, model: "/models/honda/civicfbumper1.glb" },
    { name: "Wide Body Bumper",    price: 3500, model: "/models/honda/civicfbumper1.glb" },
  ],
  "Rear Bumper": [
    { name: "Sport Diffuser",  price:  900, model: "/models/honda/civicfbumper.glb" },
    { name: "Carbon Diffuser", price: 2800, model: "/models/honda/civicfbumper1.glb" },
  ],
  "Spoiler": [
    { name: "Lip Spoiler",      price:  600, model: "/models/honda/civicfbumper.glb" },
    { name: "GT Wing",          price: 1800, model: "/models/honda/civicfbumper1.glb" },
    { name: "Ducktail Spoiler", price: 1200, model: "/models/honda/civicfbumper.glb" },
  ],
  "Tyres": [
    { name: "Sport Tyres",  price: 1200, model: "/models/shared/tire.glb" },
    { name: "Alloy Rims",   price: 1400, model: "/models/shared/tire1.glb" },
    { name: "Track Slicks", price: 2200, model: "/models/shared/tire.glb" },
  ],
  "Front Lights": [
    { name: "LED Headlights", price: 1800, model: "/models/honda/civicrightlight.glb" },
    { name: "Xenon Lights",   price: 2200, model: "/models/honda/civiclight.glb" },
  ],
  "Rear Lights": [
    { name: "LED Taillights",    price: 1500, model: "/models/honda/civicrightlight.glb" },
    { name: "Smoked Taillights", price: 1200, model: "/models/honda/civiclight.glb" },
  ],
};

const MOD_TABS = {
  "Exterior": ["Front Bumper", "Rear Bumper", "Spoiler"],
  "Wheels":   ["Tyres"],
  "Lights":   ["Front Lights", "Rear Lights"],
};

const MOD_CATEGORY_MAP = {
  "Front Bumper":  "frontBumpers",
  "Rear Bumper":   "rearBumper",
  "Spoiler":       "spoiler",
  "Tyres":         "tyres",
  "Front Lights":  "frontLights",
  "Rear Lights":   "rearLights",
};

const CAMERA_PRESETS = [
  { key: "34",    label: "3/4",   pos: [ 5,  2,  8], target: [0, 0.5, 0] },
  { key: "front", label: "Front", pos: [ 0, 1.8,  9], target: [0, 0.5, 0] },
  { key: "side",  label: "Side",  pos: [10, 1.8,  0], target: [0, 0.5, 0] },
  { key: "rear",  label: "Rear",  pos: [ 0, 1.8, -9], target: [0, 0.5, 0] },
  { key: "top",   label: "Top",   pos: [ 0, 12,  0.01], target: [0, 0, 0] },
];

// ─── Chevron ──────────────────────────────────────────────────────────────────
function ChevronDown({ open }) {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ transition: "transform 0.25s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// ─── Camera preset controller (inside Canvas) ─────────────────────────────────
function CameraController({ preset }) {
  const { camera, controls } = useThree();
  const targetPos  = useRef(new THREE.Vector3(5, 2, 8));
  const targetLook = useRef(new THREE.Vector3(0, 0.5, 0));
  const animating  = useRef(false);

  useEffect(() => {
    if (!preset) return;
    targetPos.current.set(...preset.pos);
    targetLook.current.set(...preset.target);
    animating.current = true;
  }, [preset]);

  useFrame(() => {
    if (!animating.current) return;
    camera.position.lerp(targetPos.current, 0.1);
    if (controls) {
      controls.target.lerp(targetLook.current, 0.1);
      controls.update();
    }
    if (camera.position.distanceTo(targetPos.current) < 0.05) {
      camera.position.copy(targetPos.current);
      animating.current = false;
    }
  });

  return null;
}

// ─── Rear bumper (positioned at back of car) ─────────────────────────────────
function RearBumperMod({ carModel, carBox, profile, path }) {
  const { scene }   = useGLTF(path);
  const { invalidate } = useThree();

  useEffect(() => {
    if (!carModel || !scene) return;
    const bp       = profile.bumper;
    const frontPos = carBox ? adaptiveBumperPos(carBox, bp.position) : bp.position;
    const pos      = [frontPos[0], frontPos[1], -Math.abs(frontPos[2])];

    const clone = scene.clone(true);
    clone.scale.set(bp.scale[0], bp.scale[1], bp.scale[2]);
    const group = makeCenteredGroup(clone);
    group.position.set(pos[0], pos[1], pos[2]);
    group.rotation.set(bp.rotation[0], Math.PI, bp.rotation[2]);
    group.name = "rear_bumper";

    const old = carModel.getObjectByName("rear_bumper");
    if (old) carModel.remove(old);
    carModel.add(group);
    invalidate();

    return () => { const b = carModel.getObjectByName("rear_bumper"); if (b) carModel.remove(b); invalidate(); };
  }, [carModel, carBox, scene, path, profile, invalidate]);

  return null;
}

// ─── Spoiler (top-rear of car) ────────────────────────────────────────────────
function SpoilerMod({ carModel, carBox, profile, path }) {
  const { scene }      = useGLTF(path);
  const { invalidate } = useThree();

  useEffect(() => {
    if (!carModel || !scene) return;
    const bp       = profile.bumper;
    const frontPos = carBox ? adaptiveBumperPos(carBox, bp.position) : bp.position;
    const carH     = carBox ? (carBox.max.y - carBox.min.y) : 1.5;
    const pos      = [0, carH * 0.88, -Math.abs(frontPos[2]) * 0.80];
    const sc       = bp.scale[0] * 0.7;

    const clone = scene.clone(true);
    clone.scale.set(sc, sc * 0.45, sc * 0.5);
    const group = makeCenteredGroup(clone);
    group.position.set(pos[0], pos[1], pos[2]);
    group.name = "spoiler_mod";

    const old = carModel.getObjectByName("spoiler_mod");
    if (old) carModel.remove(old);
    carModel.add(group);
    invalidate();

    return () => { const b = carModel.getObjectByName("spoiler_mod"); if (b) carModel.remove(b); invalidate(); };
  }, [carModel, carBox, scene, path, profile, invalidate]);

  return null;
}

// ─── Rear lights ─────────────────────────────────────────────────────────────
function RearLightsMod({ carModel, carBox, profile, path }) {
  const { scene }      = useGLTF(path);
  const { invalidate } = useThree();

  useEffect(() => {
    if (!carModel || !scene) return;
    const bl   = profile.backlight;
    const aPos = carBox ? adaptiveLightPositions(carBox, bl.rightPos[1], bl.rightPos[0]) : null;
    const rPos = aPos ? aPos.rLightRPos : bl.rightPos;
    const lPos = aPos ? aPos.rLightLPos : bl.leftPos;

    const right = makeCenteredGroup(scene.clone(true));
    right.scale.set(bl.scale[0], bl.scale[1], bl.scale[2]);
    right.position.set(...rPos);
    right.rotation.set(...bl.rotation);
    right.name = "back_light_right";

    const left = right.clone(true);
    left.position.set(...lPos);
    left.name = "back_light_left";

    removeAttachedParts(carModel, n => n === "back_light_right" || n === "back_light_left");
    carModel.add(right);
    carModel.add(left);
    invalidate();

    return () => {
      removeAttachedParts(carModel, n => n === "back_light_right" || n === "back_light_left");
      invalidate();
    };
  }, [carModel, carBox, scene, path, profile, invalidate]);

  return null;
}

/**
 * Find and hide the original car wheel meshes so the replacement tyres show cleanly.
 * Strategy: name-based first, then position-proximity fallback if nothing matched.
 * Returns the list of hidden objects so the caller can restore them on cleanup.
 */
// Keywords that identify wheel/tire meshes to hide when replacement is applied
const WHEEL_KEYWORDS = ["tire", "tyre", "newtire", "rim", "hub", "spoke", "rotor", "brake_disc", "caliper", "alloy_wheel"];

// Names that contain wheel keywords but must NOT be hidden (interior parts, body panels)
const WHEEL_EXCLUDE = ["steeringwheel", "steering_wheel", "wheelwell", "wheel_well", "wheelarch", "wheel_arch"];

function hideOriginalWheels(carModel, wheelPositions) {
  const hidden = [];

  // ── Pass 1: hide by name ──────────────────────────────────────────────────
  carModel.traverse(child => {
    const name = (child.name || "").toLowerCase();
    // Skip steering wheel, wheel arch, and other false-positive matches
    if (WHEEL_EXCLUDE.some(ex => name.includes(ex))) return;
    if (WHEEL_KEYWORDS.some(kw => name.includes(kw))) {
      child.visible = false;
      hidden.push(child);
    }
  });

  // ── Pass 2: position proximity (fallback when GLB uses generic names) ─────
  // Only run if name-pass found nothing — avoids accidentally hiding body panels.
  if (hidden.length === 0) {
    carModel.traverse(child => {
      if (!child.isMesh) return;
      const box    = new THREE.Box3().setFromObject(child);
      const center = box.getCenter(new THREE.Vector3());

      for (const pos of wheelPositions) {
        const dxz = Math.sqrt(
          (center.x - pos.x) ** 2 +
          (center.z - pos.z) ** 2
        );
        // Within 45 cm horizontally and below 1 m height → likely a wheel mesh
        if (dxz < 0.45 && center.y > -0.05 && center.y < 1.0) {
          child.visible = false;
          hidden.push(child);
          break;
        }
      }
    });
  }

  return hidden;
}

// ─── Tyre modification — lives inside Canvas ──────────────────────────────────
function TyreMod({ carModel, carBox, profile, path }) {
  const { scene } = useGLTF(path);
  const { invalidate } = useThree();

  useEffect(() => {
    if (!carModel || !scene) return;

    const tp     = profile.tires;
    const useAlt = path.includes("tire1.glb");
    const rotArr = useAlt ? tp.altRotation : tp.defaultRotation;

    // ── Step 1: Update world matrices so setFromObject is accurate ────────────
    carModel.updateMatrixWorld(true);

    // ── Step 2: Scan the GLB for original tire meshes (name-based) ───────────
    // Collect world-space center + diameter of every tire-named mesh
    const TIRE_KW = ["newtire", "tire", "tyre"];
    const rawEntries = [];
    carModel.traverse(child => {
      if (!child.isMesh) return;
      const n = (child.name || "").toLowerCase();
      if (WHEEL_EXCLUDE.some(ex => n.includes(ex))) return;
      if (!TIRE_KW.some(kw => n.includes(kw))) return;
      const box  = new THREE.Box3().setFromObject(child);
      const size = box.getSize(new THREE.Vector3());
      const diam = Math.max(size.x, size.y, size.z);
      if (diam < 0.05) return; // ignore tiny fragments
      rawEntries.push({ center: box.getCenter(new THREE.Vector3()), diameter: diam });
    });

    // ── Step 3: Cluster nearby entries → one cluster per physical wheel ───────
    const carSize    = carBox ? Math.max(carBox.max.x - carBox.min.x, carBox.max.z - carBox.min.z) : 4.5;
    const clusterDist = carSize * 0.15; // 15 % of car size = "same wheel" threshold
    const clusters   = [];
    const usedIdx    = new Set();

    rawEntries.forEach((entry, i) => {
      if (usedIdx.has(i)) return;
      const grp = [entry];
      usedIdx.add(i);
      rawEntries.forEach((other, j) => {
        if (usedIdx.has(j)) return;
        if (entry.center.distanceTo(other.center) < clusterDist) {
          grp.push(other);
          usedIdx.add(j);
        }
      });
      const avgC = grp.reduce((a, e) => a.add(e.center.clone()), new THREE.Vector3()).divideScalar(grp.length);
      const avgD = grp.reduce((s, e) => s + e.diameter, 0) / grp.length;
      clusters.push({ center: avgC, diameter: avgD });
    });

    // ── Step 4: Choose positions and scale ────────────────────────────────────
    const NATURAL_DIAM = 0.95; // tire.glb natural diameter in Three.js units
    let positions;
    let sf;

    if (clusters.length === 4) {
      // Use the EXACT world positions (and exact diameter) of the original tires
      positions = clusters.map(({ center: c }) => ({ x: c.x, y: c.y, z: c.z }));
      const avgD = clusters.reduce((s, c) => s + c.diameter, 0) / clusters.length;
      sf = avgD / NATURAL_DIAM;
    } else {
      // Fallback: derive from car bounding box
      const carH   = carBox ? carBox.max.y - carBox.min.y : 1.45;
      const wheelY = carH * 0.22;
      positions = carBox ? adaptiveWheelPositions(carBox, wheelY) : tp.defaultPositions;
      sf = (carH * 0.44) / NATURAL_DIAM;
    }

    // ── Step 5: Hide original wheels ──────────────────────────────────────────
    const hidden = hideOriginalWheels(carModel, positions);

    // ── Step 6: Remove stale custom tires ─────────────────────────────────────
    const prev = [];
    carModel.traverse(c => { if (c.name?.startsWith("tire_")) prev.push(c); });
    prev.forEach(c => c.parent?.remove(c));

    // ── Step 7: Clone, scale, centre, and place replacement tires ─────────────
    const tireClone = scene.clone(true);
    tireClone.scale.set(sf, sf, sf);
    const tireGroup = makeCenteredGroup(tireClone);

    positions.forEach((pos, i) => {
      const t = tireGroup.clone(true);
      t.position.set(pos.x, pos.y, pos.z);
      t.rotation.set(rotArr[0], rotArr[1], rotArr[2]);
      t.name = `tire_${i}`;
      carModel.add(t);
    });

    invalidate();

    return () => {
      hidden.forEach(c => { c.visible = true; });
      const rem = [];
      carModel.traverse(c => { if (c.name?.startsWith("tire_")) rem.push(c); });
      rem.forEach(c => c.parent?.remove(c));
      invalidate();
    };
  }, [carModel, carBox, scene, path, profile, invalidate]);

  return null;
}

// ─── Bumper modification ───────────────────────────────────────────────────────
function BumperMod({ carModel, carBox, profile, path }) {
  const { scene } = useGLTF(path);
  const { invalidate } = useThree();

  useEffect(() => {
    if (!carModel || !scene) return;

    const bp  = profile.bumper;
    const pos = carBox ? adaptiveBumperPos(carBox, bp.position) : bp.position;

    const bumperScene = scene.clone(true);
    bumperScene.scale.set(bp.scale[0], bp.scale[1], bp.scale[2]);
    const group = makeCenteredGroup(bumperScene);
    group.position.set(pos[0], pos[1], pos[2]);
    group.rotation.set(bp.rotation[0], bp.rotation[1], bp.rotation[2]);
    group.name = "bumper";

    const old = carModel.getObjectByName("bumper");
    if (old) carModel.remove(old);
    carModel.add(group);
    invalidate();

    return () => {
      const b = carModel.getObjectByName("bumper");
      if (b) carModel.remove(b);
      invalidate();
    };
  }, [carModel, carBox, scene, path, profile, invalidate]);

  return null;
}

// ─── Front-lights modification ────────────────────────────────────────────────
function FrontLightsMod({ carModel, carBox, profile, path }) {
  const { scene } = useGLTF(path);
  const { invalidate } = useThree();

  useEffect(() => {
    if (!carModel || !scene) return;

    const isCivicLight = path.includes("civiclight.glb");
    const preset = isCivicLight ? profile.xenon.civiclight : profile.xenon.default;
    const aPos   = carBox ? adaptiveLightPositions(carBox, preset.pos[1], preset.pos[0]) : null;
    const xPos   = aPos ? aPos.xenonPos : preset.pos;
    const xRot   = aPos ? aPos.xenonRot : preset.rot;

    const right = makeCenteredGroup(scene.clone(true));
    right.scale.set(preset.scale[0], preset.scale[1], preset.scale[2]);
    right.position.set( xPos[0], xPos[1], xPos[2]);
    right.rotation.set( xRot[0], xRot[1], xRot[2]);
    right.name = "xenon_light_right";

    const left = right.clone(true);
    left.position.set(-xPos[0], xPos[1], xPos[2]);
    left.rotation.set( xRot[0], -xRot[1], xRot[2]);
    left.name = "xenon_light_left";

    removeAttachedParts(carModel, n => n === "xenon_light_right" || n === "xenon_light_left");
    carModel.add(right);
    carModel.add(left);
    invalidate();

    return () => {
      removeAttachedParts(carModel, n => n === "xenon_light_right" || n === "xenon_light_left");
      invalidate();
    };
  }, [carModel, carBox, scene, path, profile, invalidate]);

  return null;
}

// ─── Main 3D scene ────────────────────────────────────────────────────────────
function CarScene({
  modelUrl, carMake, onModelLoaded, setLoadError,
  performanceMode, selectedColorHex, selectedParts,
  paintFinish, suspensionOffset, windowTint, cameraPreset,
}) {
  const { invalidate } = useThree();
  const [localCar, setLocalCar]       = useState(null);
  const [localCarBox, setLocalCarBox] = useState(null);
  const profile = useMemo(() => getCustomizationProfile(carMake, modelUrl), [carMake, modelUrl]);

  // Load the car body
  useEffect(() => {
    if (!modelUrl) return;

    const loader = new GLTFLoader();
    loader.load(
      decodeURIComponent(modelUrl),
      (gltf) => {
        const loadedCar = gltf.scene;
        applyBodyPaint(loadedCar, DEFAULT_BODY_PAINT);

        if (profile.modelScale) {
          loadedCar.scale.set(...profile.modelScale);
        }

        loadedCar.updateMatrixWorld(true);
        const scaledBox = new THREE.Box3();
        loadedCar.traverse(c => { if (c.isMesh) scaledBox.expandByObject(c); });

        const center = scaledBox.getCenter(new THREE.Vector3());
        loadedCar.position.set(-center.x, -scaledBox.min.y, -center.z);

        loadedCar.traverse(c => {
          if (c.isMesh) { c.castShadow = !performanceMode; c.receiveShadow = true; }
        });

        const wrapper = new THREE.Group();
        wrapper.add(loadedCar);
        setLocalCar(wrapper);
        setLocalCarBox(scaledBox);
        onModelLoaded?.(wrapper, scaledBox);
        invalidate();
      },
      undefined,
      () => setLoadError(`Model could not be loaded: ${decodeURIComponent(modelUrl)}`)
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carMake, modelUrl, performanceMode]);

  // Apply colour / finish whenever either changes
  useEffect(() => {
    if (!localCar || !selectedColorHex) return;
    applyBodyPaint(localCar, selectedColorHex, paintFinish ?? "gloss");
    invalidate();
  }, [localCar, selectedColorHex, paintFinish, invalidate]);

  // Suspension height
  useEffect(() => {
    if (!localCar) return;
    localCar.position.y = suspensionOffset ?? 0;
    invalidate();
  }, [localCar, suspensionOffset, invalidate]);

  // Window tint
  useEffect(() => {
    if (!localCar) return;
    applyWindowTint(localCar, windowTint ?? 0);
    invalidate();
  }, [localCar, windowTint, invalidate]);

  if (!localCar) return null;

  // Compute scene scale from car bounding box so lights/fog scale with any car size
  const cl = localCarBox
    ? Math.max(localCarBox.max.x - localCarBox.min.x, localCarBox.max.z - localCarBox.min.z)
    : 4.5;
  const s = cl / 4.5; // scale factor relative to a standard 4.5m car

  return (
    <>
      <color attach="background" args={["#0c0c10"]} />
      <fog attach="fog" args={["#0c0c10", cl * 4, cl * 9]} />

      <Environment preset={performanceMode ? "apartment" : "studio"} />

      <SpotLight
        position={[s*4, s*9, s*6]} angle={0.28} penumbra={0.55}
        intensity={performanceMode ? 70 : 150}
        castShadow={!performanceMode} shadow-mapSize={[2048, 2048]}
        color="#ffffff" distance={s*22} attenuation={5} anglePower={5}
      />
      <SpotLight
        position={[-s*5, s*7, s*4]} angle={0.32} penumbra={0.7}
        intensity={performanceMode ? 35 : 75}
        color="#d0e8ff" distance={s*20} attenuation={5} anglePower={4}
        castShadow={false}
      />
      <SpotLight
        position={[0, s*10, 0]} angle={0.40} penumbra={0.6}
        intensity={performanceMode ? 40 : 90}
        color="#f8f4ff" distance={s*18} attenuation={4} anglePower={4}
        castShadow={false}
      />
      <directionalLight position={[0, s*3, -s*9]} intensity={performanceMode ? 0.6 : 1.2} color="#6688ff" />
      <directionalLight position={[0, s*1.5, s*10]} intensity={performanceMode ? 0.4 : 0.8} color="#fff8f0" />
      <ambientLight intensity={0.12} />

      <Bounds fit clip observe margin={1.2}>
        <primitive object={localCar} />
      </Bounds>

      {/* Tyre mod — inside Canvas so R3F picks up the scene change immediately */}
      {selectedParts.tyres?.model && (
        <Suspense fallback={null}>
          <TyreMod carModel={localCar} carBox={localCarBox} profile={profile} path={selectedParts.tyres.model} />
        </Suspense>
      )}

      {selectedParts.frontBumpers?.model && (
        <Suspense fallback={null}>
          <BumperMod carModel={localCar} carBox={localCarBox} profile={profile} path={selectedParts.frontBumpers.model} />
        </Suspense>
      )}

      {selectedParts.frontLights?.model && (
        <Suspense fallback={null}>
          <FrontLightsMod carModel={localCar} carBox={localCarBox} profile={profile} path={selectedParts.frontLights.model} />
        </Suspense>
      )}

      {selectedParts.rearBumper?.model && (
        <Suspense fallback={null}>
          <RearBumperMod carModel={localCar} carBox={localCarBox} profile={profile} path={selectedParts.rearBumper.model} />
        </Suspense>
      )}

      {selectedParts.spoiler?.model && (
        <Suspense fallback={null}>
          <SpoilerMod carModel={localCar} carBox={localCarBox} profile={profile} path={selectedParts.spoiler.model} />
        </Suspense>
      )}

      {selectedParts.rearLights?.model && (
        <Suspense fallback={null}>
          <RearLightsMod carModel={localCar} carBox={localCarBox} profile={profile} path={selectedParts.rearLights.model} />
        </Suspense>
      )}

      <CameraController preset={cameraPreset} />
      <ShowroomFloor carBox={localCarBox} />

      {(() => {
        const cl = localCarBox
          ? Math.max(localCarBox.max.x - localCarBox.min.x, localCarBox.max.z - localCarBox.min.z)
          : 4.5;
        return (
          <ContactShadows
            resolution={performanceMode ? 512 : 1024}
            position={[0, -0.01, 0]}
            scale={cl * 3}
            blur={2.5} opacity={0.7} far={cl * 2} color="#000000"
          />
        );
      })()}

      {(() => {
        const cl = localCarBox
          ? Math.max(localCarBox.max.x - localCarBox.min.x, localCarBox.max.z - localCarBox.min.z)
          : 4.5;
        return (
          <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2 + 0.05}
            enablePan={false} minDistance={cl * 0.5} maxDistance={cl * 3} dampingFactor={0.05} />
        );
      })()}
    </>
  );
}

function ShowroomFloor({ carBox }) {
  // Scale floor relative to car footprint — works for any GLB unit scale
  const cl = carBox
    ? Math.max(carBox.max.x - carBox.min.x, carBox.max.z - carBox.min.z)
    : 4.5;
  const r  = cl * 0.65;   // platform radius
  const r1 = r * 0.94;    // inner ring edge
  const r2 = r * 1.00;    // outer ring edge
  const r3 = r * 1.55;    // glow ring outer
  const bg = r * 8;       // background plane

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]} receiveShadow>
        <circleGeometry args={[r, 128]} />
        <meshStandardMaterial color="#18181e" roughness={0.06} metalness={0.18} envMapIntensity={1.2} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <ringGeometry args={[r1, r2, 128]} />
        <meshStandardMaterial color="#c8a050" emissive="#b08840" emissiveIntensity={0.4} roughness={0.2} metalness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <ringGeometry args={[r2, r3, 64]} />
        <meshStandardMaterial color="#111116" roughness={0.95} metalness={0.05} transparent opacity={0.8} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.025, 0]}>
        <circleGeometry args={[bg, 32]} />
        <meshStandardMaterial color="#0a0a0e" roughness={1} metalness={0} />
      </mesh>
    </group>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Garage() {
  const { addToCart } = useCart();

  const [selectedColor, setSelectedColor] = useState({
    hex: DEFAULT_BODY_PAINT,
    name: PAINT_SWATCHES[DEFAULT_BODY_PAINT] ?? "Crystal Black Pearl",
  });
  const [selectedMods, setSelectedMods]     = useState({});
  const [openAccordion, setOpenAccordion]   = useState(null);
  const [carModel, setCarModel]             = useState(null);
  const [carBox, setCarBox]                 = useState(null);
  const [loadError, setLoadError]           = useState("");
  const [performanceMode, setPerformanceMode] = useState(false);
  const [sceneSeed, setSceneSeed]           = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [panelTab, setPanelTab]             = useState("Paint");
  const [modSubTab, setModSubTab]           = useState("Exterior");
  const [paintFinish, setPaintFinish]       = useState("gloss");
  const [suspensionOffset, setSuspensionOffset] = useState(0);
  const [windowTint, setWindowTint]         = useState(0);
  const [cameraPreset, setCameraPreset]     = useState(null);

  const [searchParams] = useSearchParams();
  const modelUrl    = searchParams.get("modelUrl");
  const carMake     = searchParams.get("make")  || "";
  const carName     = searchParams.get("name")  || "";
  const carYear     = searchParams.get("year")  || "";
  const displayTitle = [carMake, carName, carYear].filter(Boolean).join(" ") || "Custom Build";

  const engineAudioRef = useRef(null);
  const revAudioRef    = useRef(null);
  const makeKey  = carMake.toLowerCase();
  const audioMap = {
    bmw:         { engine: "/audio/bmwstart.mp3",   rev: "/audio/bmwrev.mp3" },
    toyota:      { engine: "/audio/civicstart.mp3", rev: "/audio/civicrev.mp3" },
    lamborghini: { engine: "/audio/bmwstart.mp3",   rev: "/audio/bmwrev.mp3" },
    honda:       { engine: "/audio/civicstart.mp3", rev: "/audio/civicrev.mp3" },
    ferrari:     { engine: "/audio/bmwstart.mp3",   rev: "/audio/bmwrev.mp3" },
    bugatti:     { engine: "/audio/bmwstart.mp3",   rev: "/audio/bmwrev.mp3" },
    dodge:       { engine: "/audio/bmwstart.mp3",   rev: "/audio/bmwrev.mp3" },
    tesla:       { engine: "/audio/civicstart.mp3", rev: "/audio/civicrev.mp3" },
    ford:        { engine: "/audio/bmwstart.mp3",   rev: "/audio/bmwrev.mp3" },
    lancia:      { engine: "/audio/civicstart.mp3", rev: "/audio/civicrev.mp3" },
    volkswagen:  { engine: "/audio/civicstart.mp3", rev: "/audio/civicrev.mp3" },
    hyundai:     { engine: "/audio/civicstart.mp3", rev: "/audio/civicrev.mp3" },
  };
  const audioSrcs = audioMap[makeKey] ?? audioMap.honda;

  useEffect(() => {
    if (modelUrl) { setLoadError(""); setFeedbackMessage(""); }
  }, [modelUrl, sceneSeed]);

  useEffect(() => {
    if (!feedbackMessage) return undefined;
    const id = window.setTimeout(() => setFeedbackMessage(""), 2500);
    return () => window.clearTimeout(id);
  }, [feedbackMessage]);

  const handleModelLoaded = useCallback((model, box) => {
    setCarModel(model);
    setCarBox(box);
  }, []);

  // Mod selection (click again = deselect)
  const handleModSelect = (category, mod) => {
    setSelectedMods(prev => {
      const cur = prev[category];
      return { ...prev, [category]: cur?.name === mod.name ? null : mod };
    });
  };

  // camelCase keys for scene consumption
  const cmParts = useMemo(() => {
    const out = {};
    for (const [cat, mod] of Object.entries(selectedMods)) {
      if (mod) out[MOD_CATEGORY_MAP[cat] ?? cat] = mod;
    }
    return out;
  }, [selectedMods]);

  const selectedModsList = useMemo(
    () => Object.entries(selectedMods).filter(([, m]) => m).map(([cat, m]) => ({ category: cat, ...m })),
    [selectedMods]
  );
  const upgradeCount = selectedModsList.length;
  const buildTotal   = selectedModsList.reduce((s, m) => s + (Number(m.price) || 0), 0);

  const finishLabel = PAINT_FINISHES.find(f => f.key === paintFinish)?.label ?? "Gloss";
  const liveBuildText = upgradeCount === 0
    ? `${selectedColor.name} — ${finishLabel} finish. Choose upgrades to build.`
    : `${selectedColor.name} ${finishLabel} with ${upgradeCount} upgrade${upgradeCount !== 1 ? "s" : ""}${windowTint > 0 ? " + tint" : ""}.`;

  const handleAddToCart = () => {
    if (upgradeCount === 0) { setFeedbackMessage("Select at least one upgrade first."); return; }
    addToCart({
      id: `build-${Date.now()}`, kind: "custom-build",
      name: `${displayTitle} Custom Build`, productRef: null,
      price: buildTotal, imageUrl: "", category: "Configurator",
      make: carMake, description: liveBuildText, quantity: 1,
      snapshot: {
        itemType: "custom-build", name: `${displayTitle} Custom Build`,
        make: carMake, selectedColorName: selectedColor.name,
        selectedParts: selectedModsList.map(m => ({ category: m.category, name: m.name, price: m.price })),
      },
    });
    setFeedbackMessage("Custom build added to cart.");
  };

  const handleReset = () => {
    setSelectedMods({}); setOpenAccordion(null);
    setCarModel(null); setCarBox(null);
    setSceneSeed(n => n + 1);
    setPaintFinish("gloss");
    setSuspensionOffset(0);
    setWindowTint(0);
    setCameraPreset(null);
    setFeedbackMessage("Build reset to showroom defaults.");
  };

  const handleAIPartApplied = (rec) => {
    if (rec?.part_category === "color" && rec?.three_js_change?.color_hex) {
      const hex = rec.three_js_change.color_hex;
      setSelectedColor({ hex, name: PAINT_SWATCHES[hex] ?? rec.part_name ?? "AI Color" });
    }
    setFeedbackMessage(`AI applied: ${rec?.part_name ?? "modification"}`);
  };

  const playAudio = (ref, btnId) => {
    const audio = ref.current;
    const btn   = document.getElementById(btnId);
    if (!audio || !btn) return;
    if (audio.paused) { audio.play(); btn.classList.add("ring-4", "ring-yellow-400", "scale-105"); }
    else { audio.pause(); audio.currentTime = 0; btn.classList.remove("ring-4", "ring-yellow-400", "scale-105"); }
    audio.onended = () => btn.classList.remove("ring-4", "ring-yellow-400", "scale-105");
  };

  if (!modelUrl) {
    return (
      <div className="flex h-screen w-full flex-col bg-[#121212] font-sans text-white">
        <Navbar />
        <div className="flex flex-grow items-center justify-center p-6">
          <div className="max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.5)] backdrop-blur-lg">
            <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-red-500">No Car Selected</h2>
            <p className="text-lg leading-relaxed text-gray-300">
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
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[#0a0a0a] font-sans text-white">
      <Navbar />

      <div className="flex min-h-0 flex-1 overflow-hidden">

        {/* ── LEFT: 3-D viewer (65 %) ──────────────────────────────────────── */}
        <div className="relative flex-[65] overflow-hidden">
          <Canvas
            key={`${modelUrl}-${sceneSeed}`}
            frameloop="always"
            dpr={performanceMode ? 1 : [1, 2]}
            shadows={!performanceMode}
            camera={{ position: [5, 2, 8], fov: 45 }}
            gl={{ toneMapping: 4, toneMappingExposure: 1.15 }}
            style={{ width: "100%", height: "100%" }}
          >
            <CarScene
              modelUrl={modelUrl}
              carMake={carMake}
              onModelLoaded={handleModelLoaded}
              setLoadError={setLoadError}
              performanceMode={performanceMode}
              selectedColorHex={selectedColor.hex}
              selectedParts={cmParts}
              paintFinish={paintFinish}
              suspensionOffset={suspensionOffset}
              windowTint={windowTint}
              cameraPreset={cameraPreset}
            />
          </Canvas>

          {loadError && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/80">
              <div className="rounded-xl border border-red-500 bg-red-500/20 p-6 backdrop-blur-sm">
                <p className="text-lg font-semibold text-red-400">{loadError}</p>
              </div>
            </div>
          )}

          {/* LIVE BUILD badge */}
          <div className="absolute bottom-6 left-6 z-10 max-w-[280px] rounded-2xl border border-white/10 bg-black/60 px-5 py-4 backdrop-blur-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-red-400">Live Build</p>
            <h1 className="mt-1 text-xl font-bold leading-tight text-white">{displayTitle}</h1>
            <p className="mt-1.5 text-sm leading-snug text-gray-300">{liveBuildText}</p>
          </div>

          {/* Performance toggle */}
          <button
            onClick={() => setPerformanceMode(v => !v)}
            className={`absolute left-6 top-4 z-10 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
              performanceMode ? "bg-red-600 text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"
            }`}
          >
            {performanceMode ? "Performance" : "Quality"}
          </button>

          {/* Camera view presets */}
          <div className="absolute right-4 top-4 z-10 flex flex-col gap-1.5">
            {CAMERA_PRESETS.map(p => (
              <button
                key={p.key}
                onClick={() => setCameraPreset({ ...p })}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold backdrop-blur-sm transition-all ${
                  cameraPreset?.key === p.key
                    ? "bg-red-600 text-white shadow-lg"
                    : "bg-black/60 text-gray-300 hover:bg-white/20 border border-white/10"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── RIGHT: panel (35 %) — split into fixed header + scrollable body ── */}
        <div className="flex w-[35%] flex-shrink-0 flex-col border-l border-white/10 bg-[#0f0f14] overflow-hidden">

          {/* ── FIXED header: title + tab bar ───────────────────────────── */}
          <div className="flex-shrink-0 border-b border-white/10 px-6 pt-5 pb-0">
            <h2 className="text-xl font-bold tracking-wide text-white">{displayTitle}</h2>
            <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-red-500">Configurator</p>

            {feedbackMessage && (
              <div className="mt-3 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-2 text-sm text-green-200">
                {feedbackMessage}
              </div>
            )}

            {/* Panel tabs */}
            <div className="mt-4 flex border-b border-white/10">
              {["Paint", "Mods", "Tune"].map(tab => (
                <button
                  key={tab}
                  onClick={() => setPanelTab(tab)}
                  className={`px-5 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                    panelTab === tab
                      ? "border-red-500 text-white"
                      : "border-transparent text-gray-400 hover:text-gray-200"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* ── SCROLLABLE body ───────────────────────────────────────────── */}
          <div className="custom-scrollbar flex-1 overflow-y-auto px-6 py-5">

            {/* ══ PAINT TAB ══ */}
            {panelTab === "Paint" && (
              <div className="space-y-5">
                <div>
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-400">Color</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(PAINT_SWATCHES).map(([hex, name]) => {
                      const isActive = selectedColor.hex === hex;
                      return (
                        <button
                          key={hex}
                          onClick={() => setSelectedColor({ hex, name })}
                          title={name}
                          className="h-9 w-9 flex-shrink-0 rounded-full transition-transform duration-150 hover:scale-110 focus:outline-none"
                          style={{
                            backgroundColor: hex,
                            boxShadow: isActive
                              ? `0 0 0 2px #0f0f14, 0 0 0 4px white, 0 0 10px rgba(255,255,255,0.2)`
                              : `0 0 0 1.5px rgba(255,255,255,0.18)`,
                            transform: isActive ? "scale(1.15)" : undefined,
                          }}
                        />
                      );
                    })}
                  </div>
                  <p className="mt-2.5 flex items-center gap-2 text-sm font-medium text-gray-200">
                    <span className="inline-block h-3 w-3 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: selectedColor.hex, boxShadow: "0 0 0 1px rgba(255,255,255,0.2)" }} />
                    {selectedColor.name}
                  </p>
                </div>

                {/* Finish type */}
                <div>
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-400">Finish</p>
                  <div className="grid grid-cols-4 gap-2">
                    {PAINT_FINISHES.map(f => (
                      <button
                        key={f.key}
                        onClick={() => setPaintFinish(f.key)}
                        className={`rounded-xl py-2.5 text-xs font-semibold transition-all ${
                          paintFinish === f.key
                            ? "bg-red-600 text-white shadow-lg shadow-red-900/40"
                            : "bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ══ MODS TAB ══ */}
            {panelTab === "Mods" && (
              <div>
                {/* Mod sub-tabs */}
                <div className="mb-4 flex gap-1 rounded-xl bg-white/5 p-1">
                  {Object.keys(MOD_TABS).map(sub => (
                    <button
                      key={sub}
                      onClick={() => setModSubTab(sub)}
                      className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                        modSubTab === sub
                          ? "bg-red-600 text-white"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  {(MOD_TABS[modSubTab] ?? []).map(category => {
                    const options  = BASE_MODS[category] ?? [];
                    const isOpen   = openAccordion === category;
                    const selected = selectedMods[category];
                    return (
                      <div key={category} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
                        <button
                          className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-semibold text-white transition-colors hover:bg-white/[0.06]"
                          onClick={() => setOpenAccordion(prev => prev === category ? null : category)}
                        >
                          <span className="flex items-center gap-2">
                            {selected && <span className="h-1.5 w-1.5 rounded-full bg-red-500" />}
                            {category}
                          </span>
                          <ChevronDown open={isOpen} />
                        </button>
                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"}`}>
                          <div className="space-y-1 bg-black/20 px-2 pb-2">
                            {options.map(mod => {
                              const isSel = selected?.name === mod.name;
                              return (
                                <button
                                  key={mod.name}
                                  onClick={() => handleModSelect(category, mod)}
                                  className={`w-full rounded-xl px-4 py-3 text-left text-sm transition-all duration-200 ${
                                    isSel ? "bg-red-600 text-white shadow-lg" : "text-gray-300 hover:bg-white/10 hover:text-white"
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-4">
                                    <span>{mod.name}</span>
                                    <span className={`text-xs font-semibold ${isSel ? "text-red-200" : "text-gray-400"}`}>
                                      RS {mod.price.toLocaleString()}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ══ TUNE TAB ══ */}
            {panelTab === "Tune" && (
              <div className="space-y-6">
                {/* Suspension */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-400">Suspension Height</p>
                    <span className="text-xs font-semibold text-red-400">
                      {suspensionOffset > 0 ? `+${(suspensionOffset * 100).toFixed(0)}mm` : suspensionOffset < 0 ? `${(suspensionOffset * 100).toFixed(0)}mm` : "Stock"}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-0.30"
                    max="0.10"
                    step="0.01"
                    value={suspensionOffset}
                    onChange={e => setSuspensionOffset(parseFloat(e.target.value))}
                    className="w-full accent-red-500"
                  />
                  <div className="mt-1 flex justify-between text-[10px] text-gray-500">
                    <span>Slammed</span>
                    <span>Stock</span>
                    <span>Lifted</span>
                  </div>
                </div>

                {/* Window tint */}
                <div>
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-400">Window Tint</p>
                  <div className="grid grid-cols-5 gap-1.5">
                    {WINDOW_TINTS.map((t, i) => (
                      <button
                        key={t.label}
                        onClick={() => setWindowTint(i)}
                        className={`rounded-xl py-2 text-[10px] font-semibold transition-all ${
                          windowTint === i
                            ? "bg-red-600 text-white"
                            : "bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10"
                        }`}
                        style={{ backgroundColor: windowTint === i ? undefined : t.hex + "44" }}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Build summary */}
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Build Summary</h4>
                  <p className="mt-1 text-sm text-gray-300">{liveBuildText}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[10px] uppercase tracking-widest text-gray-500">Total</p>
                  <p className="text-xl font-black text-white">RS {buildTotal.toLocaleString()}</p>
                </div>
              </div>
              {selectedModsList.length > 0 && (
                <div className="mt-3 space-y-1.5 border-t border-white/10 pt-3">
                  {selectedModsList.map(m => (
                    <div key={`${m.category}-${m.name}`} className="flex items-center justify-between text-sm text-gray-300">
                      <span>{m.category}: {m.name}</span>
                      <span className="text-gray-400">RS {m.price.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-5 grid gap-2.5">
                <button onClick={handleAddToCart}
                  className="w-full rounded-2xl bg-gradient-to-r from-red-600 to-red-500 py-3 font-bold tracking-wide text-white shadow-[0_0_20px_rgba(220,38,38,0.25)] transition-all hover:-translate-y-0.5 hover:from-red-500 hover:to-red-400">
                  Add Build To Cart
                </button>
                <button onClick={handleReset}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 font-bold tracking-wide text-white transition-all hover:-translate-y-0.5 hover:bg-white/10">
                  Reset Build
                </button>
                <Link to={`/productlist?make=${encodeURIComponent(carMake)}`}
                  className="w-full rounded-2xl border border-white/10 bg-transparent py-3 text-center font-bold tracking-wide text-gray-300 transition-all hover:bg-white/5 hover:text-white">
                  Browse Matching Parts
                </Link>
              </div>
            </div>

            {/* AI panel */}
            <AIModPanel
              carMake={carMake} carModel={carName}
              carYear={carYear ? parseInt(carYear) : new Date().getFullYear()}
              currentColor={selectedColor.hex}
              selectedParts={selectedModsList.map(m => m.name)}
              selectedPartCategories={selectedModsList.map(m => m.category)}
              onPartApplied={handleAIPartApplied}
              carModelRef={carModel}
            />

            {/* Engine audio */}
            <div className="mt-6 space-y-2.5 pb-6">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-400">Engine Control</p>
              <button id="engine-btn" onClick={() => playAudio(engineAudioRef, "engine-btn")}
                className="w-full rounded-2xl bg-gradient-to-r from-red-600 to-red-500 py-3 font-bold tracking-wide text-white shadow-[0_0_20px_rgba(220,38,38,0.25)] transition-all hover:-translate-y-0.5 hover:from-red-500 hover:to-red-400">
                Start Engine
              </button>
              <audio ref={engineAudioRef} src={audioSrcs.engine} preload="auto" />
              <button id="rev-btn" onClick={() => playAudio(revAudioRef, "rev-btn")}
                className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 font-bold tracking-wide text-white transition-all hover:-translate-y-0.5 hover:bg-white/10">
                Rev Engine
              </button>
              <audio ref={revAudioRef} src={audioSrcs.rev} preload="auto" />
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }
      ` }} />
    </div>
  );
}
