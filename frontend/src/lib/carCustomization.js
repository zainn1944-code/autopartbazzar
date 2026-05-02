import * as THREE from "three";

/** Mesh and material name fragments treated as paintable body panels */
export const BODY_MESH_KEYWORDS = [
  "hood",
  "roof",
  "door",
  "trunk",
  "fender",
  "frontfender",
  "rearquarterpanel",
  "quarterpanel",
  "pillar",
  "body",
  "paint",
];

/** Keep dark / accent trim when repainting */
export const BLACK_TRIM_KEYWORDS = [
  "grill",
  "grille",
  "splitter",
  "diffuser",
  "spoiler",
  "mirror",
  "vent",
  "black",
  "carbon",
  "chrome",
];

/** Default showroom paint applied when the GLB loads */
export const DEFAULT_BODY_PAINT = "#C5C5C5";

export const PAINT_SWATCHES = {
  "#FF0000": "Rallye Red",
  "#003E7E": "Aegean Blue Metallic",
  "#C5C5C5": "Sonic Gray Pearl",
  "#6C6F70": "Urban Gray Pearl",
  "#F6F6F6": "Platinum White Pearl",
  "#BCC5D3": "Meteorite Gray Metallic",
  "#5A5A5F": "Canyon River Blue Metallic",
};

/**
 * Hide original parts that pass the test, or remove them if they are custom added parts.
 * Uses traverse to find nested meshes in complex GLTF models.
 */
export function removeAttachedParts(parent, nameTest) {
  const removeList = [];
  parent.traverse((child) => {
    const lowerName = (child.name || "").toLowerCase();
    if (nameTest(lowerName)) {
      if (lowerName.startsWith("tire_") || lowerName === "bumper" || lowerName.startsWith("xenon_") || lowerName.startsWith("back_light_")) {
        removeList.push(child);
      } else {
        child.visible = false;
      }
    }
  });
  removeList.forEach((child) => {
    if (child.parent) child.parent.remove(child);
  });
}

function forEachMaterial(mesh, fn) {
  const mats = mesh.material;
  if (!mats) return;
  if (Array.isArray(mats)) mats.forEach(fn);
  else fn(mats);
}

function materialNames(mesh) {
  const mats = mesh.material;
  if (!mats) return [];
  const list = Array.isArray(mats) ? mats : [mats];
  return list.map((mat) => (mat?.name || "").toLowerCase()).filter(Boolean);
}

/**
 * Apply solid body paint while preserving textures where present; trim stays near-black.
 */
export function applyBodyPaint(root, hexColor) {
  const paint = new THREE.Color(hexColor);
  root.traverse((child) => {
    if (!child.isMesh) return;
    
    const partName = (child.name || "").toLowerCase();
    const matNames = materialNames(child);
    const matches = (keywords) =>
      keywords.some(
        (keyword) =>
          partName.includes(keyword) || matNames.some((materialName) => materialName.includes(keyword))
      );

    const isBody = matches(BODY_MESH_KEYWORDS);
    const isBlackTrim = matches(BLACK_TRIM_KEYWORDS);
    
    if (!isBody && !isBlackTrim) return;

    forEachMaterial(child, (mat) => {
      if (!mat || !mat.color) return;
      if (isBody) mat.color.copy(paint);
      else if (isBlackTrim) mat.color.setHex(0x111111);
    });
  });
}

export function enhanceTailLightEmissive(group) {
  group.traverse((child) => {
    if (!child.isMesh || !child.material) return;
    const nm = child.name.toLowerCase();
    const apply = (mat) => {
      const m = mat.clone();
      if (nm.includes("glass") || nm.includes("lens")) {
        m.emissive = new THREE.Color(0xff2200);
        m.emissiveIntensity = 0.9;
      }
      return m;
    };
    if (Array.isArray(child.material)) child.material = child.material.map(apply);
    else child.material = apply(child.material);
  });
}

// ---------------------------------------------------------------------------
// Per-model profiles.
//
// modelScale (optional): normalises the GLB to metre-scale before centring.
//   Honda Civic  and Lamborghini Huracan are already in metres → no scale.
//   Toyota Supra and BMW M4 are in ~centimetres  → modelScale 0.01.
//   Corolla2 / BMW 3-Series share a single GLB in millimetres → modelScale 0.001.
//
// All position / offset values are in metres (post-scale world space).
// ---------------------------------------------------------------------------

function tireDef(fl, fr, rl, rr, scale = [1,1,1], altScale = null) {
  const pos = [fl, fr, rl, rr];
  return {
    defaultScale: scale,
    defaultPositions: pos,
    defaultRotation: [0, 0, 0],
    altScale: altScale ?? scale.map(s => s * 1.05),
    altPositions: pos,
    altRotation: [0, 0, 0],
  };
}

const PROFILES = {
  // ── Honda Civic (/models/honda/civic.glb) ──────────────────────────────
  // Already in metres.  Positions hand-tuned to the civic.glb geometry.
  honda_civic: {
    tires: tireDef(
      { x: -0.77, y: 0.38, z:  1.25 },
      { x:  0.77, y: 0.38, z:  1.25 },
      { x: -0.77, y: 0.38, z: -1.20 },
      { x:  0.77, y: 0.38, z: -1.20 },
    ),
    bumper:   { scale:[1,1,1], position:[0, 0.30, 2.15], rotation:[0,0,0] },
    xenon:    { default:    { scale:[1,1,1], pos:[ 0.68, 0.56, 2.10], rot:[0,0,0] },
                civiclight: { scale:[1,1,1], pos:[ 0.68, 0.56, 2.10], rot:[0,Math.PI,0] } },
    backlight:{ scale:[1,1,1], rightPos:[ 0.72, 0.56,-2.10], leftPos:[-0.72, 0.56,-2.10], rotation:[0,0,0] },
  },

  // ── Lamborghini Huracan (/models/lamborghini/huracan.glb) ──────────────
  // Metres.  Wheel-node translations from the GLB: front Z≈-1.46, rear Z≈+1.16.
  // Centering shifts Y by +0.345 → effective wheel-centre Y ≈ 0.68.
  // tire.glb radius = 0.475 m → Y=0.48 puts tyre just touching the floor.
  lamborghini_huracan: {
    tires: tireDef(
      { x: -0.790, y: 0.48, z: -1.46 },
      { x:  0.790, y: 0.48, z: -1.46 },
      { x: -0.811, y: 0.48, z:  1.16 },
      { x:  0.811, y: 0.48, z:  1.16 },
      [0.95, 0.95, 0.95],
      [0.98, 0.98, 0.98],
    ),
    bumper:   { scale:[1,1,1], position:[0, 0.25, 2.50], rotation:[0,0,0] },
    xenon:    { default:    { scale:[1,1,1], pos:[ 0.80, 0.45, 2.45], rot:[0,0,0] },
                civiclight: { scale:[1,1,1], pos:[ 0.80, 0.45, 2.45], rot:[0,Math.PI,0] } },
    backlight:{ scale:[1,1,1], rightPos:[ 0.82, 0.45,-2.38], leftPos:[-0.82, 0.45,-2.38], rotation:[0,0,0] },
  },

  // ── Toyota GR Supra (/models/toyota/supra.glb) ─────────────────────────
  // ~centimetres (215 raw units wide ≈ 2.16 m).  modelScale 0.01 → metres.
  // After scale+centering: W≈2.16 m, H≈1.30 m, L≈4.56 m.
  // Wheel-centre Y ≈ 0.32 m; tire.glb r=0.475 → Y=0.40 is a good fit.
  toyota_supra: {
    modelScale: [0.01, 0.01, 0.01],
    tires: tireDef(
      { x: -0.78, y: 0.40, z:  1.22 },
      { x:  0.78, y: 0.40, z:  1.22 },
      { x: -0.82, y: 0.40, z: -1.22 },
      { x:  0.82, y: 0.40, z: -1.22 },
    ),
    bumper:   { scale:[1,1,1], position:[0, 0.30, 2.20], rotation:[0,0,0] },
    xenon:    { default:    { scale:[1,1,1], pos:[ 0.72, 0.50, 2.12], rot:[0,0,0] },
                civiclight: { scale:[1,1,1], pos:[ 0.72, 0.50, 2.12], rot:[0,Math.PI,0] } },
    backlight:{ scale:[1,1,1], rightPos:[ 0.75, 0.48,-2.12], leftPos:[-0.75, 0.48,-2.12], rotation:[0,0,0] },
  },

  // ── Toyota Corolla & BMW 3-Series (/carmodels/corolla2.glb, bmw.glb) ───
  // These two GLBs are identical files.  Complex 180° rotation; raw width
  // 1746 units.  modelScale 0.001 → W≈1.75 m.  Height/depth are squished
  // in this export but the Bounds component still frames it correctly.
  carmodel_sedan: {
    modelScale: [0.001, 0.001, 0.001],
    tires: tireDef(
      { x: -0.65, y: 0.38, z:  0.18 },
      { x:  0.65, y: 0.38, z:  0.18 },
      { x: -0.65, y: 0.38, z: -0.18 },
      { x:  0.65, y: 0.38, z: -0.18 },
    ),
    bumper:   { scale:[1,1,1], position:[0, 0.25, 0.30], rotation:[0,0,0] },
    xenon:    { default:    { scale:[1,1,1], pos:[ 0.60, 0.35, 0.28], rot:[0,0,0] },
                civiclight: { scale:[1,1,1], pos:[ 0.60, 0.35, 0.28], rot:[0,Math.PI,0] } },
    backlight:{ scale:[1,1,1], rightPos:[ 0.62, 0.35,-0.28], leftPos:[-0.62, 0.35,-0.28], rotation:[0,0,0] },
  },

  // ── BMW M4 (/models/bmw/m4.glb) ────────────────────────────────────────
  // Same axis matrix as Supra; large file (22 MB). Assumed ~centimetres.
  // modelScale 0.01. Proportions similar to Honda Civic / Supra.
  bmw_m4: {
    modelScale: [0.01, 0.01, 0.01],
    tires: tireDef(
      { x: -0.80, y: 0.40, z:  1.25 },
      { x:  0.80, y: 0.40, z:  1.25 },
      { x: -0.80, y: 0.40, z: -1.25 },
      { x:  0.80, y: 0.40, z: -1.25 },
    ),
    bumper:   { scale:[1,1,1], position:[0, 0.30, 2.20], rotation:[0,0,0] },
    xenon:    { default:    { scale:[1,1,1], pos:[ 0.74, 0.52, 2.15], rot:[0,0,0] },
                civiclight: { scale:[1,1,1], pos:[ 0.74, 0.52, 2.15], rot:[0,Math.PI,0] } },
    backlight:{ scale:[1,1,1], rightPos:[ 0.76, 0.50,-2.15], leftPos:[-0.76, 0.50,-2.15], rotation:[0,0,0] },
  },
};

export function getCustomizationProfile(carMake, modelUrl) {
  const url = (modelUrl ?? '').toLowerCase();

  if (url.includes('/models/honda/civic'))         return PROFILES.honda_civic;
  if (url.includes('/models/lamborghini/huracan')) return PROFILES.lamborghini_huracan;
  if (url.includes('/models/toyota/supra'))        return PROFILES.toyota_supra;
  if (url.includes('/models/bmw/m4'))              return PROFILES.bmw_m4;
  if (url.includes('/carmodels/'))                 return PROFILES.carmodel_sedan;

  // Make-based fallbacks
  const make = (carMake ?? '').toLowerCase();
  if (make === 'lamborghini') return PROFILES.lamborghini_huracan;
  if (make === 'toyota')      return PROFILES.toyota_supra;
  if (make === 'bmw')         return PROFILES.bmw_m4;
  return PROFILES.honda_civic;
}
