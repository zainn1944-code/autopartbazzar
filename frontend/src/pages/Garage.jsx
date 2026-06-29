import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Lightbulb } from "lucide-react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bounds, ContactShadows, Environment, OrbitControls, SpotLight, useGLTF } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import { useCart } from "@/hooks/useCart";
import { useSavedBuilds } from "@/hooks/useSavedBuilds.js";
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
  RIM_COLORS,
  CALIPER_COLORS,
  NEON_COLORS,
  ACCENT_COLORS,
  DEFAULT_BODY_PAINT,
  applyBodyPaint,
  applyWindowTint,
  applyRimColor,
  applyCaliperColor,
  applyAccentColor,
  detectTuneCapabilities,
  removeAttachedParts,
  enhanceTailLightEmissive,
  getCustomizationProfile,
  restyleLights,
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
    { name: "Sport Tyres",   price: 1200, model: "/models/shared/tire.glb", sizeMul: 1.0 },
    { name: "Off-Road Tyres",price: 1400, model: "/models/shared/tire.glb", sizeMul: 1.08 },
    { name: "Track Slicks",  price: 2200, model: "/models/shared/tire.glb", sizeMul: 0.95 },
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
// Keywords that identify wheel/tire meshes to hide when replacement is applied.
// NOTE: "rim" is intentionally NOT here — it is matched with a left-boundary
// check in isWheelMesh so it never fires on words like "p-rim-ary" / "t-rim".
const WHEEL_KEYWORDS = ["tire", "tyre", "newtire", "hub", "spoke", "rotor", "brake_disc", "caliper", "alloy_wheel"];

// Names that contain wheel keywords but must NOT be hidden (interior parts, body panels)
const WHEEL_EXCLUDE = ["steeringwheel", "steering_wheel", "wheelwell", "wheel_well", "wheelarch", "wheel_arch"];

/**
 * True when a mesh name denotes an actual wheel/tyre/rim — and NOT a body panel.
 * GTA-style models group wheels under nodes named "wheel_*", so real wheel meshes
 * START WITH "wheel"; body panels merely carry a "wheel_rf" texture-atlas tag
 * later in the name and must be ignored. "rim" uses a left-boundary check so it
 * matches "rim"/"wheel_rim" but not "primary"/"trim".
 */
function isWheelMesh(name) {
  const n = (name || "").toLowerCase();
  if (WHEEL_EXCLUDE.some(ex => n.includes(ex))) return false;
  if (n.startsWith("wheel")) return true;
  if (/(^|[^a-z])rim/.test(n)) return true;
  return WHEEL_KEYWORDS.some(kw => n.includes(kw));
}

/**
 * Checks the mesh's name AND its parent node's name for wheel identity.
 * Sketchfab exports (e.g. the Corolla) leave mesh names as "Object_X" and put
 * the descriptive label on the parent: "e180_wheel.001_51". isWheelMesh alone
 * misses this because the name starts with "e180_", not "wheel". So we also
 * check whether the parent name CONTAINS "_wheel" or "wheel_" as a substring.
 */
function meshIsWheel(child) {
  if (isWheelMesh(child.name)) return true;
  const pn = (child.parent?.name || "").toLowerCase();
  if (!pn) return false;
  // Never flag wheel arch / steering wheel / well panels via parent name either.
  if (WHEEL_EXCLUDE.some(ex => pn.includes(ex))) return false;
  if (isWheelMesh(pn)) return true;
  // "e180_wheel*" style: has prefix before "_wheel" so startsWith misses it.
  if (pn.includes("_wheel") || pn.includes("wheel_")) return true;
  return false;
}

function meshCanDriveTyrePlacement(child) {
  const name = (child.name || "").toLowerCase();
  const parentName = (child.parent?.name || "").toLowerCase();
  const text = `${name} ${parentName}`;
  if (WHEEL_EXCLUDE.some(ex => text.includes(ex))) return false;
  return (
    text.includes("wheel") ||
    text.includes("tire") ||
    text.includes("tyre") ||
    /(^|[^a-z])rim/.test(text)
  );
}

function hideOriginalWheels(carModel, wheelPositions) {
  const hidden = [];

  // ── Pass 1: hide by name ──────────────────────────────────────────────────
  carModel.traverse(child => {
    if (!child.isMesh) return;
    if (meshIsWheel(child)) {
      child.visible = false;
      hidden.push(child);
    }
  });

  // ── Pass 1b: parent-name based hiding (Sketchfab/Corolla style) ──
  if (hidden.length === 0) {
    carModel.traverse(child => {
      if (!child.isMesh) return;
      const pn = (child.parent?.name || "").toLowerCase();
      if (
        pn.includes("wheel") &&
        !WHEEL_EXCLUDE.some(ex => pn.includes(ex))
      ) {
        child.visible = false;
        hidden.push(child);
      }
    });
  }

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
function TyreMod({ carModel, carBox, profile, path, sizeMul = 1 }) {
  const { scene } = useGLTF(path);
  const { invalidate } = useThree();

  useEffect(() => {
    if (!carModel || !scene) return;

    const tp = profile.tires;

    // ── Step 1: Update world matrices so setFromObject is accurate ────────────
    carModel.updateMatrixWorld(true);

    // ── Measure the replacement tyre model so it fits ANY car automatically ───
    // Its axle runs along its THINNEST dimension; the round face spans the other
    // two. We rotate the tyre so that axle points along the car's width axis, and
    // scale it to the real wheel diameter — no per-model guessing required.
    scene.updateMatrixWorld(true);
    const tyreSize = new THREE.Box3().setFromObject(scene).getSize(new THREE.Vector3());
    const tyreDims = [["x", tyreSize.x], ["y", tyreSize.y], ["z", tyreSize.z]].sort((a, b) => a[1] - b[1]);
    const tyreAxle = tyreDims[0][0];                                  // thinnest = axle
    const NATURAL_DIAM = (tyreDims[1][1] + tyreDims[2][1]) / 2 || 0.95;

    // Car width axis (left↔right) = shorter horizontal dimension; axle aligns to it.
    const carW = carBox ? carBox.max.x - carBox.min.x : 2;
    const carD = carBox ? carBox.max.z - carBox.min.z : 4;
    const widthAxis = carW <= carD ? "x" : "z";

    // Y-rotation that brings the tyre's horizontal axle onto the width axis.
    let yRot = 0;
    if ((tyreAxle === "x" && widthAxis === "z") || (tyreAxle === "z" && widthAxis === "x")) {
      yRot = Math.PI / 2;
    }
    const rotArr = [0, yRot, 0];

    // ── Step 2: Scan the GLB for original wheel/tire meshes (name-based) ──────
    // Collect car-local center + diameter of every real wheel mesh
    const rawEntries = [];
    carModel.traverse(child => {
      if (!child.isMesh) return;
      if (!meshIsWheel(child) || !meshCanDriveTyrePlacement(child)) return;
      const box  = new THREE.Box3().setFromObject(child);
      const size = box.getSize(new THREE.Vector3());
      const diam = Math.max(size.x, size.y, size.z);
      if (diam < 0.05) return; // ignore tiny fragments
      const center = box.getCenter(new THREE.Vector3());
      carModel.worldToLocal(center);
      rawEntries.push({ center, diameter: diam });
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
      const diams = grp.map(e => e.diameter).sort((a, b) => a - b);
      const maxD  = diams[diams.length - 1];
      clusters.push({ center: avgC, diameter: maxD });
    });

    // ── Step 4: Choose positions and scale (NATURAL_DIAM measured above) ──────
    let positions;
    let sf;

    const carH  = carBox ? carBox.max.y - carBox.min.y : 1.45;

    if (clusters.length >= 4) {
      const widthCoord = (cluster) => (widthAxis === "x" ? cluster.center.x : cluster.center.z);
      const lengthCoord = (cluster) => (widthAxis === "x" ? cluster.center.z : cluster.center.x);
      const sorted = [...clusters].sort((a, b) => Math.abs(lengthCoord(b)) - Math.abs(lengthCoord(a)));
      const physicalWheels = sorted.slice(0, 4).sort((a, b) => {
        const lengthDelta = lengthCoord(b) - lengthCoord(a);
        return Math.abs(lengthDelta) > 0.001 ? lengthDelta : widthCoord(b) - widthCoord(a);
      });

      positions = physicalWheels.map(cluster => ({
        x: cluster.center.x,
        y: cluster.center.y,
        z: cluster.center.z,
      }));

      const targetDiam = physicalWheels.reduce(
        (max, cluster) => Math.max(max, cluster.diameter),
        0
      ) || carH * 0.28;
      sf = (targetDiam * 1.02 * sizeMul) / NATURAL_DIAM;
    } else {
      const fallbackY = tp.defaultPositions?.[0]?.y ?? carH * 0.14;
      const fallbackPositions = carBox ? adaptiveWheelPositions(carBox, fallbackY) : tp.defaultPositions;
      positions = fallbackPositions.map(pos => ({ x: pos.x, y: pos.y, z: pos.z }));

      const fallbackDiam = carH * 0.28;
      sf = (fallbackDiam * sizeMul) / NATURAL_DIAM;
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

    // Wheels on the far side of the car must be mirrored (extra 180° about Y)
    // so the rim dish faces OUTWARD on both sides — otherwise one side looks
    // correct and the other looks inside-out. The split point is the midpoint of
    // the wheels along the width axis (same coordinate space as the positions).
    const axisVals = positions.map(p => (widthAxis === "x" ? p.x : p.z));
    const axisMid  = (Math.min(...axisVals) + Math.max(...axisVals)) / 2;
    positions.forEach((pos, i) => {
      const t = tireGroup.clone(true);
      t.position.set(pos.x, pos.y, pos.z);
      t.userData.groundY = pos.y; // save ground level for suspension
      const sideCoord = widthAxis === "x" ? pos.x : pos.z;
      const flip = sideCoord < axisMid ? Math.PI : 0;
      t.rotation.set(rotArr[0], rotArr[1] + flip, rotArr[2]);
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
  }, [carModel, carBox, scene, path, sizeMul, profile, invalidate]);

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

// ─── Light restyle — for complete models that keep their own light geometry ────
// Recolours the car's OWN head/tail lights instead of adding foreign light parts.
function LightRestyle({ carModel, frontMod, rearMod, paintMaterials, frontEnabled, rearEnabled }) {
  const { invalidate } = useThree();

  useEffect(() => {
    if (!carModel) return;
    const opts = { paintMaterials };
    const activeFront = frontEnabled ? (frontMod ?? "__default__") : null;
    const activeRear  = rearEnabled  ? (rearMod  ?? "__default__") : null;
    restyleLights(carModel, activeFront, activeRear, opts);
    invalidate();
    return () => {
      restyleLights(carModel, null, null, opts);
      invalidate();
    };
  }, [carModel, frontMod, rearMod, paintMaterials, frontEnabled, rearEnabled, invalidate]);

  return null;
}

// ─── Tuning effects driver — re-applies rim/caliper/accent colors whenever
//     the relevant tuning state changes.
function TuningEffects({ carModel, tuning }) {
  const { invalidate } = useThree();

  useEffect(() => {
    if (!carModel) return;
    applyRimColor(carModel, tuning.rimColor);
    invalidate();
  }, [carModel, tuning.rimColor, invalidate]);

  useEffect(() => {
    if (!carModel) return;
    applyCaliperColor(carModel, tuning.caliperColor);
    invalidate();
  }, [carModel, tuning.caliperColor, invalidate]);

  useEffect(() => {
    if (!carModel) return;
    applyAccentColor(carModel, "roof", tuning.roofAccent);
    invalidate();
  }, [carModel, tuning.roofAccent, invalidate]);

  useEffect(() => {
    if (!carModel) return;
    applyAccentColor(carModel, "hood", tuning.hoodAccent);
    invalidate();
  }, [carModel, tuning.hoodAccent, invalidate]);

  return null;
}

// ─── Neon underglow ──────────────────────────────────────────────────────────
// Two layers: a thin emissive disc just under the car (acts like spill onto the
// ground) and a soft point light to bounce real colored light onto the body.
function NeonUnderglow({ carBox, presetKey, pulse }) {
  const meshRef = useRef(null);
  const lightRef = useRef(null);
  const preset = NEON_COLORS[presetKey] ?? NEON_COLORS.off;

  useFrame((state) => {
    if (!pulse) return;
    const t = (Math.sin(state.clock.elapsedTime * 2.2) + 1) / 2; // 0..1
    const k = 0.55 + 0.45 * t;
    if (meshRef.current) meshRef.current.material.opacity = 0.55 * k;
    if (lightRef.current) lightRef.current.intensity = 6 * k;
  });

  if (preset.hex == null || !carBox) return null;

  const w = carBox.max.x - carBox.min.x;
  const d = carBox.max.z - carBox.min.z;
  const radius = Math.max(w, d) * 0.62;

  return (
    <group position={[0, 0.02, 0]}>
      <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius * 0.55, radius, 64]} />
        <meshBasicMaterial
          color={preset.hex}
          transparent
          opacity={0.55}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>
      <pointLight
        ref={lightRef}
        color={preset.hex}
        intensity={6}
        distance={radius * 2.6}
        decay={1.8}
        position={[0, 0.18, 0]}
      />
    </group>
  );
}

// ─── Main 3D scene ────────────────────────────────────────────────────────────
function VehicleLightAura({ carBox, frontEnabled, rearEnabled, frontMod, rearMod, performanceMode }) {
  if ((!frontEnabled && !rearEnabled) || !carBox) return null;

  const width = carBox.max.x - carBox.min.x;
  const depth = carBox.max.z - carBox.min.z;
  const height = carBox.max.y - carBox.min.y;
  const longIsZ = depth >= width;
  const halfWidth = (longIsZ ? width : depth) / 2 || 1;
  const halfLength = (longIsZ ? depth : width) / 2 || 2;
  const side = Math.max(halfWidth * 0.42, 0.35);
  const lampY = Math.max(height * 0.38, 0.38);
  const front = halfLength * 0.96;
  const rear = -halfLength * 0.96;
  const pos = (lateral, y, longitudinal) =>
    longIsZ ? [lateral, y, longitudinal] : [longitudinal, y, lateral];

  const frontText = frontMod || "";
  const rearText = rearMod || "";
  // Match restyleLights: amber halogen → crisp white LED → strong blue xenon,
  // so the bounced light + halo agree with the colour baked into the lens mesh.
  const isXenon = /xenon/i.test(frontText);
  const isLed   = /led/i.test(frontText);
  const headColor = isXenon ? "#3a93ff" : isLed ? "#ffffff" : "#ffb24d";
  // Beyond colour, give each type its own brightness so the swap reads as clearly
  // as a tyre swap: LED = punchy bright white, Xenon = moodier saturated blue,
  // halogen = soft warm. Brightness + colour together make the difference obvious.
  const headMul = isXenon ? 0.85 : isLed ? 1.25 : 0.7;
  const tailColor = /smoke/i.test(rearText) ? "#9d1616" : "#ff2424";
  const lightBoost = performanceMode ? 0.65 : 1;
  const glowRadius = Math.max(halfWidth * 0.82, 0.7);

  return (
    <group>
      {frontEnabled && [-side, side].map((x) => (
        <group key={`head-${x}`} position={pos(x, lampY, front)}>
          <pointLight
            color={headColor}
            intensity={18 * lightBoost * headMul}
            distance={halfLength * 1.8}
            decay={1.5}
          />
          <mesh>
            <sphereGeometry args={[Math.max(0.06, height * 0.038), 18, 10]} />
            <meshBasicMaterial color={headColor} transparent opacity={0.95} toneMapped={false} />
          </mesh>
          <mesh>
            <sphereGeometry args={[Math.max(0.11, height * 0.07), 16, 10]} />
            <meshBasicMaterial color={headColor} transparent opacity={0.28} toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
        </group>
      ))}

      {rearEnabled && [-side, side].map((x) => (
        <group key={`tail-${x}`} position={pos(x, lampY * 0.95, rear)}>
          <pointLight
            color={tailColor}
            intensity={9 * lightBoost}
            distance={halfLength * 1.1}
            decay={1.6}
          />
          <mesh>
            <sphereGeometry args={[Math.max(0.055, height * 0.033), 18, 10]} />
            <meshBasicMaterial color={tailColor} transparent opacity={0.9} toneMapped={false} />
          </mesh>
          <mesh>
            <sphereGeometry args={[Math.max(0.1, height * 0.06), 16, 10]} />
            <meshBasicMaterial color={tailColor} transparent opacity={0.25} toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
        </group>
      ))}

      {frontEnabled && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={pos(0, 0.028, front + halfLength * 0.16)}>
          <circleGeometry args={[glowRadius, 48]} />
          <meshBasicMaterial
            color={headColor}
            transparent
            opacity={0.26}
            toneMapped={false}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}
      {rearEnabled && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={pos(0, 0.026, rear - halfLength * 0.08)}>
          <circleGeometry args={[glowRadius * 0.75, 48]} />
          <meshBasicMaterial
            color={tailColor}
            transparent
            opacity={0.22}
            toneMapped={false}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}
    </group>
  );
}

function CarScene({
  modelUrl, carMake, onModelLoaded, setLoadError,
  performanceMode, selectedColorHex, selectedParts,
  paintFinish, suspensionOffset, windowTint, cameraPreset,
  tuning,
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
        applyBodyPaint(loadedCar, DEFAULT_BODY_PAINT, "gloss", { onlyMaterials: profile.paintMaterials });

        if (profile.modelScale) {
          loadedCar.scale.set(...profile.modelScale);
        }

        if (profile.modelRotationY != null) {
          loadedCar.rotation.y = profile.modelRotationY;
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
    applyBodyPaint(localCar, selectedColorHex, paintFinish ?? "gloss", { onlyMaterials: profile.paintMaterials });
    invalidate();
  }, [localCar, selectedColorHex, paintFinish, profile, invalidate]);

  useEffect(() => {
    if (!localCar || !localCarBox) return;

    // Move the inner car mesh (child[0]) up — not the wrapper
    const carMesh = localCar.children[0];
    if (!carMesh) return;

    // Original position was: -scaledBox.min.y (floor align)
    // Suspension lifts body UP from that baseline
    const baseline = -(localCarBox.min.y);
    carMesh.position.y = baseline + (suspensionOffset ?? 0);

    // Keep tyres on ground — find all tire_ objects in wrapper
    // and counter-move them so they stay at ground level
    localCar.traverse(child => {
      if (child.name?.startsWith("tire_")) {
        // Tyres are children of wrapper (localCar), not carMesh
        // Their Y was set from cluster/carBox — keep it unchanged
        // by subtracting the suspension offset back out
        child.position.y = child.userData.groundY ?? child.position.y;
      }
    });

    invalidate();
  }, [localCar, localCarBox, suspensionOffset, invalidate]);

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
  // Front and rear lights toggle independently. We still fall back to the old
  // single `lightsOn` flag so saved builds from before the split keep working.
  const masterOn  = tuning?.lightsOn ?? true;
  const frontOn   = tuning?.frontLightsOn ?? masterOn;
  const rearOn    = tuning?.rearLightsOn  ?? masterOn;

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

      <Bounds fit clip margin={1.2}>
        <primitive object={localCar} />
      </Bounds>

      {/* Tyre mod — inside Canvas so R3F picks up the scene change immediately */}
      {selectedParts.tyres?.model && (
        <Suspense fallback={null}>
          <TyreMod carModel={localCar} carBox={localCarBox} profile={profile} path={selectedParts.tyres.model} sizeMul={selectedParts.tyres.sizeMul} />
        </Suspense>
      )}

      {/* Bumper / spoiler add-on geometry — skipped for cars that don't fit it (e.g. Hilux) */}
      {!profile.hideExteriorMods && selectedParts.frontBumpers?.model && (
        <Suspense fallback={null}>
          <BumperMod carModel={localCar} carBox={localCarBox} profile={profile} path={selectedParts.frontBumpers.model} />
        </Suspense>
      )}

      {!profile.hideExteriorMods && selectedParts.rearBumper?.model && (
        <Suspense fallback={null}>
          <RearBumperMod carModel={localCar} carBox={localCarBox} profile={profile} path={selectedParts.rearBumper.model} />
        </Suspense>
      )}

      {!profile.hideExteriorMods && selectedParts.spoiler?.model && (
        <Suspense fallback={null}>
          <SpoilerMod carModel={localCar} carBox={localCarBox} profile={profile} path={selectedParts.spoiler.model} />
        </Suspense>
      )}

      {/* Lights — restyle the car's own lights, or add geometry for cars that need it */}
      <LightRestyle
        carModel={localCar}
        frontMod={selectedParts.frontLights?.name}
        rearMod={selectedParts.rearLights?.name}
        paintMaterials={profile.paintMaterials}
        frontEnabled={frontOn}
        rearEnabled={rearOn}
      />
      {!profile.restyleLights && (
        <>
          {frontOn && selectedParts.frontLights?.model && (
            <Suspense fallback={null}>
              <FrontLightsMod carModel={localCar} carBox={localCarBox} profile={profile} path={selectedParts.frontLights.model} />
            </Suspense>
          )}
          {rearOn && selectedParts.rearLights?.model && (
            <Suspense fallback={null}>
              <RearLightsMod carModel={localCar} carBox={localCarBox} profile={profile} path={selectedParts.rearLights.model} />
            </Suspense>
          )}
        </>
      )}

      <VehicleLightAura
        carBox={localCarBox}
        frontEnabled={frontOn}
        rearEnabled={rearOn}
        frontMod={selectedParts.frontLights?.name}
        rearMod={selectedParts.rearLights?.name}
        performanceMode={performanceMode}
      />

      <CameraController preset={cameraPreset} />
      <ShowroomFloor carBox={localCarBox} />

      {tuning && <TuningEffects carModel={localCar} tuning={tuning} />}
      {tuning && tuning.neonColor !== "off" && (
        <NeonUnderglow carBox={localCarBox} presetKey={tuning.neonColor} pulse={tuning.neonPulse} />
      )}

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
  const { builds: savedBuilds, saveBuild, deleteBuild, unauthorized: buildsUnauthorized } = useSavedBuilds();
  const [buildName, setBuildName] = useState("");
  const [savingBuild, setSavingBuild] = useState(false);
  const [showLoadList, setShowLoadList] = useState(false);

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

  // ── 3DTuning-style state: rim/caliper color, two-tone accents, neon underglow,
  //    wheel size multiplier. Single object so save/load round-trips cleanly.
  const [tuning, setTuning] = useState({
    rimColor:     "factory",
    caliperColor: "factory",
    roofAccent:   "off",
    hoodAccent:   "off",
    wheelSizeMul:   1.0,
    neonColor:      "off",
    neonPulse:      false,
    frontLightsOn:  true,
    rearLightsOn:   true,
  });
  const setTune = useCallback(
    (key, value) => setTuning(prev => ({ ...prev, [key]: value })),
    []
  );

  const [searchParams] = useSearchParams();
  const modelUrl    = searchParams.get("modelUrl");
  const carMake     = searchParams.get("make")  || "";
  const carName     = searchParams.get("name")  || "";
  const carYear     = searchParams.get("year")  || "";
  const displayTitle = [carMake, carName, carYear].filter(Boolean).join(" ") || "Custom Build";

  // Per-car mod tabs — some cars hide the bumper/spoiler ("Exterior") geometry mods.
  const carProfile = useMemo(() => getCustomizationProfile(carMake, modelUrl), [carMake, modelUrl]);

  // Which Tune-tab controls have a target mesh on the current model. Hilux,
  // for example, has no separable hood/roof/caliper mesh — we hide those
  // controls instead of leaving them as silent no-ops.
  const tuneCaps = useMemo(() => detectTuneCapabilities(carModel), [carModel]);

  const modTabs = useMemo(() => {
    const tabs = { ...MOD_TABS };
    if (carProfile.hideExteriorMods) delete tabs.Exterior;
    return tabs;
  }, [carProfile]);

  // If the active sub-tab is no longer available, fall back to the first one.
  useEffect(() => {
    if (!modTabs[modSubTab]) setModSubTab(Object.keys(modTabs)[0] || "Exterior");
  }, [modTabs, modSubTab]);

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
    const isDeselect = selectedMods[category]?.name === mod.name;
    setSelectedMods(prev => {
      const cur = prev[category];
      return { ...prev, [category]: cur?.name === mod.name ? null : mod };
    });
    // Selecting a light type is meaningless while that light is switched off —
    // restyleLights restores the factory material when the toggle is off, so the
    // choice would have no visible effect. Auto-enable the matching switch so the
    // selected style (Xenon/LED/Smoked) actually shows on the car.
    if (!isDeselect) {
      if (category === "Front Lights") setTune("frontLightsOn", true);
      else if (category === "Rear Lights") setTune("rearLightsOn", true);
    }
  };

  // camelCase keys for scene consumption — multiplies the chosen tyre's sizeMul
  // by the global wheel-size slider so the Tune control affects any tyre choice.
  const cmParts = useMemo(() => {
    const out = {};
    for (const [cat, mod] of Object.entries(selectedMods)) {
      if (!mod) continue;
      const key = MOD_CATEGORY_MAP[cat] ?? cat;
      if (key === "tyres") {
        out[key] = { ...mod, sizeMul: (mod.sizeMul ?? 1) * (tuning.wheelSizeMul ?? 1) };
      } else {
        out[key] = mod;
      }
    }
    return out;
  }, [selectedMods, tuning.wheelSizeMul]);

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

  // ── Save / Load handlers ────────────────────────────────────────────────
  const collectBuildConfig = () => ({
    selectedColor,
    paintFinish,
    selectedMods,
    suspensionOffset,
    windowTint,
    tuning,
  });

  const handleSaveBuild = async () => {
    if (buildsUnauthorized) {
      setFeedbackMessage("Login to save builds.");
      return;
    }
    const name = (buildName || displayTitle).trim();
    if (!name) { setFeedbackMessage("Give your build a name first."); return; }
    setSavingBuild(true);
    try {
      await saveBuild({
        name,
        car_make: carMake || "Unknown",
        car_model: carName || "Unknown",
        car_year: carYear ? parseInt(carYear, 10) : null,
        model_url: modelUrl,
        config: collectBuildConfig(),
      });
      setBuildName("");
      setFeedbackMessage(`Saved "${name}".`);
    } catch (err) {
      setFeedbackMessage(err.message || "Save failed.");
    } finally {
      setSavingBuild(false);
    }
  };

  const handleLoadBuild = (build) => {
    const cfg = build.config || {};
    if (cfg.selectedColor) setSelectedColor(cfg.selectedColor);
    if (cfg.paintFinish) setPaintFinish(cfg.paintFinish);
    if (cfg.selectedMods) setSelectedMods(cfg.selectedMods);
    if (typeof cfg.suspensionOffset === "number") setSuspensionOffset(cfg.suspensionOffset);
    if (typeof cfg.windowTint === "number") setWindowTint(cfg.windowTint);
    if (cfg.tuning) setTuning(prev => ({ ...prev, ...cfg.tuning }));
    setShowLoadList(false);
    setFeedbackMessage(`Loaded "${build.name}".`);
  };

  const handleDeleteBuild = async (id, e) => {
    e?.stopPropagation();
    try {
      await deleteBuild(id);
      setFeedbackMessage("Build deleted.");
    } catch (err) {
      setFeedbackMessage(err.message || "Delete failed.");
    }
  };

  const handleReset = () => {
    setSelectedMods({}); setOpenAccordion(null);
    setCarModel(null); setCarBox(null);
    setSceneSeed(n => n + 1);
    setPaintFinish("gloss");
    setSuspensionOffset(0);
    setWindowTint(0);
    setCameraPreset(null);
    setTuning({
      rimColor: "factory", caliperColor: "factory",
      roofAccent: "off", hoodAccent: "off",
      wheelSizeMul: 1.0, neonColor: "off", neonPulse: false,
      frontLightsOn: true, rearLightsOn: true,
    });
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
            gl={{ toneMapping: THREE.NeutralToneMapping, toneMappingExposure: 1.0 }}
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
              tuning={tuning}
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
                  {Object.keys(modTabs).map(sub => (
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

                {/* Independent front / rear light switches — shown only on the
                    Lights sub-tab. The whole card acts as the switch: yellow +
                    glow when On, dim when Off. No pill — nothing can overflow. */}
                {modSubTab === "Lights" && (
                  <div className="mb-3 grid grid-cols-2 gap-2">
                    {[
                      { key: "frontLightsOn", label: "Front Lights" },
                      { key: "rearLightsOn",  label: "Rear Lights"  },
                    ].map(({ key, label }) => {
                      const on = tuning[key];
                      return (
                        <button
                          key={key}
                          type="button"
                          role="switch"
                          aria-checked={on}
                          onClick={() => setTune(key, !on)}
                          className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all ${
                            on
                              ? "border-yellow-300/55 bg-yellow-300/10 text-white shadow-[0_0_18px_rgba(250,204,21,0.18)]"
                              : "border-white/10 bg-white/[0.04] text-gray-300 hover:border-white/20 hover:bg-white/[0.08]"
                          }`}
                        >
                          <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-colors ${
                            on ? "bg-yellow-300 text-black" : "bg-white/10 text-gray-400"
                          }`}>
                            <Lightbulb className="h-4 w-4" />
                          </span>
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate text-[12px] font-semibold leading-tight">{label}</span>
                            <span className={`text-[10px] font-semibold uppercase tracking-wider leading-tight ${
                              on ? "text-yellow-300" : "text-gray-500"
                            }`}>
                              {on ? "On" : "Off"}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="space-y-2">
                  {(modTabs[modSubTab] ?? []).map(category => {
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
                      {suspensionOffset > 0 ? `+${(suspensionOffset * 100).toFixed(0)}cm` : suspensionOffset < 0 ? `${(suspensionOffset * 100).toFixed(0)}cm` : "Stock"}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-0.12"
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

                {/* Vehicle light switches — separate front / rear */}
                <div>
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-400">Vehicle Lights</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: "frontLightsOn", label: "Front Lights" },
                      { key: "rearLightsOn",  label: "Rear Lights"  },
                    ].map(({ key, label }) => {
                      const on = tuning[key];
                      return (
                        <button
                          key={key}
                          type="button"
                          role="switch"
                          aria-checked={on}
                          onClick={() => setTune(key, !on)}
                          className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all ${
                            on
                              ? "border-yellow-300/55 bg-yellow-300/10 text-white shadow-[0_0_18px_rgba(250,204,21,0.18)]"
                              : "border-white/10 bg-white/[0.04] text-gray-300 hover:border-white/20 hover:bg-white/[0.08]"
                          }`}
                        >
                          <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-colors ${
                            on ? "bg-yellow-300 text-black" : "bg-white/10 text-gray-400"
                          }`}>
                            <Lightbulb className="h-4 w-4" />
                          </span>
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate text-[12px] font-semibold leading-tight">{label}</span>
                            <span className={`text-[10px] font-semibold uppercase tracking-wider leading-tight ${
                              on ? "text-yellow-300" : "text-gray-500"
                            }`}>
                              {on ? "On" : "Off"}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-400">Wheel Size</p>
                    <span className="text-xs font-semibold text-red-400">
                      {tuning.wheelSizeMul === 1 ? "Stock" : `${tuning.wheelSizeMul > 1 ? "+" : ""}${((tuning.wheelSizeMul - 1) * 100).toFixed(0)}%`}
                    </span>
                  </div>
                  <input
                    type="range" min="0.85" max="1.20" step="0.01"
                    value={tuning.wheelSizeMul}
                    onChange={e => setTune("wheelSizeMul", parseFloat(e.target.value))}
                    className="w-full accent-red-500"
                  />
                </div>

                {/* ── Rim color ─────────────────────────────────────────── */}
                {tuneCaps.rim && (
                <div>
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-400">Rim Finish</p>
                  <div className="grid grid-cols-5 gap-1.5">
                    {Object.entries(RIM_COLORS).map(([key, c]) => (
                      <button
                        key={key}
                        onClick={() => setTune("rimColor", key)}
                        title={c.label}
                        className={`flex flex-col items-center gap-1 rounded-xl border py-1.5 text-[9px] font-semibold transition-all ${
                          tuning.rimColor === key
                            ? "border-red-500 bg-red-500/15 text-white"
                            : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20"
                        }`}
                      >
                        <span className="h-4 w-4 rounded-full border border-white/20"
                              style={{ background: c.hex || "transparent",
                                       boxShadow: c.hex ? `inset 0 0 4px rgba(0,0,0,0.4)` : undefined }} />
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
                )}

                {/* ── Caliper color ─────────────────────────────────────── */}
                {tuneCaps.caliper && (
                <div>
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-400">Brake Calipers</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {Object.entries(CALIPER_COLORS).map(([key, c]) => (
                      <button
                        key={key}
                        onClick={() => setTune("caliperColor", key)}
                        title={c.label}
                        className={`flex items-center gap-1.5 rounded-xl border px-2 py-1.5 text-[10px] font-semibold transition-all ${
                          tuning.caliperColor === key
                            ? "border-red-500 bg-red-500/15 text-white"
                            : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20"
                        }`}
                      >
                        <span className="h-3 w-3 flex-shrink-0 rounded-full border border-white/20"
                              style={{ background: c.hex || "transparent" }} />
                        <span className="truncate">{c.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                )}

                {/* ── Roof accent (two-tone) ────────────────────────────── */}
                {tuneCaps.roof && (
                <div>
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-400">Roof Wrap</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {Object.entries(ACCENT_COLORS).map(([key, c]) => (
                      <button
                        key={key}
                        onClick={() => setTune("roofAccent", key)}
                        className={`flex items-center gap-1.5 rounded-xl border px-2 py-1.5 text-[10px] font-semibold transition-all ${
                          tuning.roofAccent === key
                            ? "border-red-500 bg-red-500/15 text-white"
                            : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20"
                        }`}
                      >
                        <span className="h-3 w-3 flex-shrink-0 rounded-full border border-white/20"
                              style={{ background: c.hex || "transparent" }} />
                        <span className="truncate">{c.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                )}

                {/* ── Hood accent (carbon hood / two-tone) ──────────────── */}
                {tuneCaps.hood && (
                <div>
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-400">Hood Wrap</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {Object.entries(ACCENT_COLORS).map(([key, c]) => (
                      <button
                        key={key}
                        onClick={() => setTune("hoodAccent", key)}
                        className={`flex items-center gap-1.5 rounded-xl border px-2 py-1.5 text-[10px] font-semibold transition-all ${
                          tuning.hoodAccent === key
                            ? "border-red-500 bg-red-500/15 text-white"
                            : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20"
                        }`}
                      >
                        <span className="h-3 w-3 flex-shrink-0 rounded-full border border-white/20"
                              style={{ background: c.hex || "transparent" }} />
                        <span className="truncate">{c.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                )}

                {/* ── Neon underglow ────────────────────────────────────── */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-400">Neon Underglow</p>
                    <label className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-400 cursor-pointer">
                      <input
                        type="checkbox"
                        className="accent-red-500"
                        checked={tuning.neonPulse}
                        onChange={e => setTune("neonPulse", e.target.checked)}
                      />
                      Pulse
                    </label>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {Object.entries(NEON_COLORS).map(([key, c]) => (
                      <button
                        key={key}
                        onClick={() => setTune("neonColor", key)}
                        title={c.label}
                        className={`flex flex-col items-center gap-1 rounded-xl border py-1.5 text-[9px] font-semibold transition-all ${
                          tuning.neonColor === key
                            ? "border-red-500 bg-red-500/15 text-white"
                            : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20"
                        }`}
                      >
                        <span
                          className="h-4 w-4 rounded-full"
                          style={{
                            background: c.hex == null ? "transparent" : `#${c.hex.toString(16).padStart(6, "0")}`,
                            boxShadow: c.hex == null
                              ? "inset 0 0 0 1.5px rgba(255,255,255,0.18)"
                              : `0 0 8px #${c.hex.toString(16).padStart(6, "0")}`,
                          }}
                        />
                        {c.label}
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
              {/* ── Save / Load builds ─────────────────────────────────── */}
              <div className="mt-5 rounded-xl border border-white/8 bg-black/30 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-500">My Saved Builds</p>
                  {savedBuilds.length > 0 && (
                    <button
                      onClick={() => setShowLoadList(v => !v)}
                      className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-gray-300 hover:bg-white/10"
                    >
                      {showLoadList ? "Hide" : `Load (${savedBuilds.length})`}
                    </button>
                  )}
                </div>
                {buildsUnauthorized ? (
                  <p className="text-[11px] text-gray-500">
                    <Link to="/login" className="text-red-400 underline">Log in</Link> to save and load builds across devices.
                  </p>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={buildName}
                        onChange={e => setBuildName(e.target.value)}
                        placeholder={displayTitle}
                        className="flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-red-500/60"
                      />
                      <button
                        onClick={handleSaveBuild}
                        disabled={savingBuild}
                        className="rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white transition-all hover:bg-red-500 disabled:opacity-50"
                      >
                        {savingBuild ? "Saving…" : "Save"}
                      </button>
                    </div>
                    {showLoadList && savedBuilds.length > 0 && (
                      <div className="mt-2 max-h-44 space-y-1 overflow-y-auto custom-scrollbar pr-1">
                        {savedBuilds.map(b => (
                          <button
                            key={b.id}
                            onClick={() => handleLoadBuild(b)}
                            className="flex w-full items-center justify-between gap-2 rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2 text-left text-xs text-gray-200 transition-all hover:border-red-500/40 hover:bg-red-500/5"
                          >
                            <span className="min-w-0 flex-1 truncate">
                              <span className="font-semibold">{b.name}</span>
                              <span className="ml-2 text-[10px] text-gray-500">
                                {b.car_make} {b.car_model}
                              </span>
                            </span>
                            <span
                              onClick={(e) => handleDeleteBuild(b.id, e)}
                              className="shrink-0 rounded-md border border-white/10 px-1.5 py-0.5 text-[10px] text-gray-500 hover:border-red-500/40 hover:text-red-400"
                            >
                              Delete
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="mt-3 grid gap-2.5">
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
              paintMaterials={getCustomizationProfile(carMake, modelUrl).paintMaterials}
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
