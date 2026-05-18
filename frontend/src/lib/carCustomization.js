import * as THREE from "three";

/** Keep dark / accent trim when repainting */
export const BLACK_TRIM_KEYWORDS = [
  "grill", "grille", "splitter", "diffuser",
  "spoiler", "mirror", "vent", "black", "carbon", "chrome",
];

/** Meshes / materials that should never be repainted */
const SKIP_PAINT_KEYWORDS = [
  "glass", "window", "windshield", "windscreen",
  "light", "lens", "headlight", "taillight", "lamp", "bulb",
  "tire", "tyre", "newtire", "wheel", "rim", "spoke", "rotor", "brake", "caliper",
  "interior", "seat", "dashboard", "steering", "carpet", "console",
  "exhaust", "muffler", "pipe",
  "rubber", "tread",
];

/** Default showroom paint applied when the GLB loads */
export const DEFAULT_BODY_PAINT = "#0D0D0D";

/** 16 distinct car colors — clearly different from each other */
export const PAINT_SWATCHES = {
  "#CC0000": "Rallye Red",
  "#FF5500": "Sunset Orange",
  "#E5B800": "Championship Yellow",
  "#1A5C32": "British Racing Green",
  "#003E7E": "Aegean Blue Metallic",
  "#4B0082": "Midnight Purple",
  "#8B0000": "Deep Burgundy",
  "#C0392B": "Candy Apple Red",
  "#0D0D0D": "Crystal Black Pearl",
  "#1C1C1C": "Matte Black",
  "#17202A": "Midnight Navy",
  "#2F4F4F": "Dark Slate",
  "#F0F0F0": "Platinum White Pearl",
  "#C8C8C8": "Sonic Gray Pearl",
  "#808080": "Gun Metal Gray",
  "#D4AC0D": "Golden Amber",
};

/** Available paint finish types */
export const PAINT_FINISHES = [
  { key: "gloss",    label: "Gloss" },
  { key: "metallic", label: "Metallic" },
  { key: "matte",    label: "Matte" },
  { key: "satin",    label: "Satin" },
];

/** Window tint presets — index 0 = no tint */
export const WINDOW_TINTS = [
  { label: "No Tint", opacity: 0.82, hex: "#aaccee" },
  { label: "Light",   opacity: 0.60, hex: "#334455" },
  { label: "Medium",  opacity: 0.38, hex: "#223344" },
  { label: "Dark",    opacity: 0.20, hex: "#111a22" },
  { label: "Limo",    opacity: 0.06, hex: "#050a0f" },
];

/** Per-color PBR base values — finish type may override these at paint time */
const PAINT_MATERIALS = {
  "#CC0000": { roughness: 0.13, metalness: 0.18, envMap: 1.0 },
  "#FF5500": { roughness: 0.12, metalness: 0.15, envMap: 0.95 },
  "#E5B800": { roughness: 0.11, metalness: 0.10, envMap: 0.9 },
  "#1A5C32": { roughness: 0.16, metalness: 0.30, envMap: 1.1 },
  "#003E7E": { roughness: 0.10, metalness: 0.70, envMap: 1.6 },
  "#4B0082": { roughness: 0.12, metalness: 0.55, envMap: 1.5 },
  "#8B0000": { roughness: 0.14, metalness: 0.25, envMap: 1.1 },
  "#C0392B": { roughness: 0.12, metalness: 0.20, envMap: 1.0 },
  "#0D0D0D": { roughness: 0.05, metalness: 0.08, envMap: 2.2 },
  "#1C1C1C": { roughness: 0.05, metalness: 0.08, envMap: 2.2 },
  "#17202A": { roughness: 0.10, metalness: 0.60, envMap: 1.8 },
  "#2F4F4F": { roughness: 0.18, metalness: 0.40, envMap: 1.2 },
  "#F0F0F0": { roughness: 0.12, metalness: 0.32, envMap: 1.3 },
  "#C8C8C8": { roughness: 0.15, metalness: 0.65, envMap: 1.6 },
  "#808080": { roughness: 0.12, metalness: 0.75, envMap: 1.8 },
  "#D4AC0D": { roughness: 0.14, metalness: 0.55, envMap: 1.4 },
};

export function removeAttachedParts(parent, nameTest) {
  const removeList = [];
  parent.traverse((child) => {
    const lowerName = (child.name || "").toLowerCase();
    if (nameTest(lowerName)) {
      if (
        lowerName.startsWith("tire_") ||
        lowerName === "bumper" ||
        lowerName === "rear_bumper" ||
        lowerName === "spoiler_mod" ||
        lowerName.startsWith("xenon_") ||
        lowerName.startsWith("back_light_")
      ) {
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
 * Apply showroom-quality body paint to all exterior meshes.
 *
 * Clears the color map, roughness map, and metalness map so our hand-tuned
 * PBR values are used directly instead of being multiplied with baked maps
 * from the GLB. envMapIntensity is set per-color so metallic paints
 * reflect the environment correctly.
 */
function isInsideAttachedPart(obj) {
  let node = obj;
  while (node) {
    const n = (node.name || "").toLowerCase();
    if (
      n.startsWith("tire_")    ||
      n === "bumper"           ||
      n === "rear_bumper"      ||
      n === "spoiler_mod"      ||
      n.startsWith("xenon_")   ||
      n.startsWith("back_light_")
    ) return true;
    node = node.parent;
  }
  return false;
}

/** finish: 'gloss' | 'metallic' | 'matte' | 'satin' */
export function applyBodyPaint(root, hexColor, finish = "gloss") {
  const paint = new THREE.Color(hexColor);
  const base  = PAINT_MATERIALS[hexColor] ?? { roughness: 0.18, metalness: 0.35, envMap: 1.0 };

  let { roughness, metalness, envMap } = base;
  if (finish === "matte") {
    roughness = 0.92; metalness = 0.0; envMap = 0.05;
  } else if (finish === "satin") {
    roughness = 0.48; metalness = 0.08; envMap = 0.45;
  } else if (finish === "metallic") {
    roughness = Math.min(base.roughness, 0.12);
    metalness = Math.max(base.metalness, 0.78);
    envMap    = Math.max(base.envMap,    1.9);
  }

  root.traverse((child) => {
    if (!child.isMesh) return;

    // Never repaint attached mods (tyres, bumper, lights)
    if (isInsideAttachedPart(child)) return;

    const partName = (child.name || "").toLowerCase();
    const matNames = materialNames(child);
    const matches  = (kws) =>
      kws.some((kw) => partName.includes(kw) || matNames.some((mn) => mn.includes(kw)));

    if (matches(SKIP_PAINT_KEYWORDS)) return;
    const isBlackTrim = matches(BLACK_TRIM_KEYWORDS);

    // Create a completely fresh material — avoids ALL baked GLB properties
    // (vertex colors, textures, emissive tints) that can't be reliably overridden
    const makeFreshMat = () => {
      if (isBlackTrim) {
        return new THREE.MeshStandardMaterial({
          color: 0x111111,
          roughness: finish === "matte" ? 0.85 : 0.55,
          metalness: 0.12,
          envMapIntensity: 0.4,
        });
      }
      return new THREE.MeshPhysicalMaterial({
        color:              paint.clone(),
        roughness,
        metalness,
        envMapIntensity:    envMap,
        clearcoat:          finish === "matte" ? 0.0 : 1.0,
        clearcoatRoughness: finish === "matte" ? 0.0 : 0.05,
      });
    };

    if (Array.isArray(child.material)) {
      child.material = child.material.map(makeFreshMat);
    } else {
      child.material = makeFreshMat();
    }
  });
}

export function enhanceTailLightEmissive(group) {
  group.traverse((child) => {
    if (!child.isMesh || !child.material) return;
    const nm = child.name.toLowerCase();
    const apply = (mat) => {
      const m = mat.clone();
      if (nm.includes("glass") || nm.includes("lens")) {
        m.emissive          = new THREE.Color(0xff2200);
        m.emissiveIntensity = 1.2;
        m.roughness         = 0.05;
        m.envMapIntensity   = 0.6;
      }
      m.needsUpdate = true;
      return m;
    };
    if (Array.isArray(child.material)) child.material = child.material.map(apply);
    else child.material = apply(child.material);
  });
}

/** Apply window tint — tintIndex maps to WINDOW_TINTS array */
export function applyWindowTint(root, tintIndex) {
  const tint     = WINDOW_TINTS[tintIndex] ?? WINDOW_TINTS[0];
  const GLASS_KW = ["glass", "window", "windshield", "windscreen"];

  root.traverse((child) => {
    if (!child.isMesh) return;
    if (isInsideAttachedPart(child)) return;

    const partName = (child.name || "").toLowerCase();
    const matList  = Array.isArray(child.material) ? child.material : [child.material];
    const matNames = matList.map((m) => (m?.name || "").toLowerCase());
    const isGlass  = GLASS_KW.some(
      (kw) => partName.includes(kw) || matNames.some((mn) => mn.includes(kw))
    );
    if (!isGlass) return;

    const makeTintMat = () =>
      new THREE.MeshPhysicalMaterial({
        color:       new THREE.Color(tint.hex),
        transparent: true,
        opacity:     tint.opacity,
        roughness:   0.04,
        metalness:   0.0,
        clearcoat:   0.5,
        side:        THREE.DoubleSide,
      });

    if (Array.isArray(child.material)) child.material = child.material.map(makeTintMat);
    else child.material = makeTintMat();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared geometry helpers — used by both CarModificationManager and Garage.jsx
// ─────────────────────────────────────────────────────────────────────────────

/** Wrap object in a group whose pivot is the object's bounding-box centre. */
export function makeCenteredGroup(object) {
  object.updateMatrixWorld(true);
  const box    = new THREE.Box3().setFromObject(object);
  const center = box.getCenter(new THREE.Vector3());
  object.position.set(-center.x, -center.y, -center.z);
  const group = new THREE.Group();
  group.add(object);
  return group;
}

/**
 * Compute 4 wheel positions from carBox dimensions.
 * wheelY comes from the profile (hand-tuned, reliably correct per model).
 * X (track) and Z (axle) are computed adaptively.
 */
export function adaptiveWheelPositions(carBox, wheelY) {
  const w         = carBox.max.x - carBox.min.x;
  const d         = carBox.max.z - carBox.min.z;
  const isZLength = d >= w;
  const length    = isZLength ? d : w;
  const width     = isZLength ? w : d;

  const halfTrack  = (width  / 2) * 0.86;
  const axleOffset = (length / 2) * 0.54;

  if (isZLength) {
    return [
      { x: -halfTrack, y: wheelY, z:  axleOffset },
      { x:  halfTrack, y: wheelY, z:  axleOffset },
      { x: -halfTrack, y: wheelY, z: -axleOffset },
      { x:  halfTrack, y: wheelY, z: -axleOffset },
    ];
  }
  return [
    { x:  axleOffset, y: wheelY, z: -halfTrack },
    { x:  axleOffset, y: wheelY, z:  halfTrack },
    { x: -axleOffset, y: wheelY, z: -halfTrack },
    { x: -axleOffset, y: wheelY, z:  halfTrack },
  ];
}

/**
 * Bumper front position — Z from carBox dimensions, Y adaptive from car height.
 * After centering the car sits on Y = 0, so bumper Y = carHeight * 0.23.
 */
export function adaptiveBumperPos(carBox, profilePos) {
  const w         = carBox.max.x - carBox.min.x;
  const d         = carBox.max.z - carBox.min.z;
  const isZLength = d >= w;
  const halfLen   = (isZLength ? d : w) / 2;
  const carHeight = carBox.max.y - carBox.min.y;
  const bumperY   = carHeight * 0.23;
  return isZLength
    ? [0, bumperY, halfLen]
    : [halfLen, bumperY, 0];
}

/**
 * Light positions — X (lateral) and Z (front/rear) from carBox dimensions,
 * Y computed from actual car height so lights never float above or sink below
 * the car body.
 *
 * After the car is floor-aligned (Y = 0 at bottom), typical front / rear lights
 * sit at ~40 % of car height from the floor, which holds across all body styles.
 *
 * BUG FIX: previous version referenced `halfLen` / `halfWidth` without defining
 * them, causing NaN positions and lights appearing in the wrong place.
 */
export function adaptiveLightPositions(carBox, profileLightY, profileLightX) {
  const w         = carBox.max.x - carBox.min.x;
  const d         = carBox.max.z - carBox.min.z;
  const isZLength = d >= w;
  const length    = isZLength ? d : w;
  const width     = isZLength ? w : d;
  const halfLen   = length / 2;   // ← was missing (caused NaN positions)
  const halfWidth = width  / 2;   // ← was missing

  // Adaptive Y: lights at 40 % of actual car height above the floor
  const carHeight = carBox.max.y - carBox.min.y;
  const lightY    = carHeight * 0.40;

  const lightX = halfWidth * 0.68;
  const frontZ = halfLen   * 0.97;

  if (isZLength) {
    return {
      xenonPos:   [ lightX, lightY,  frontZ],
      xenonRot:   [0, 0, 0],
      rLightRPos: [ lightX, lightY, -frontZ],
      rLightLPos: [-lightX, lightY, -frontZ],
      lightRot:   [0, 0, 0],
    };
  }
  return {
    xenonPos:   [ frontZ, lightY,  lightX],
    xenonRot:   [0, Math.PI / 2, 0],
    rLightRPos: [-frontZ, lightY,  lightX],
    rLightLPos: [-frontZ, lightY, -lightX],
    lightRot:   [0, Math.PI / 2, 0],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-model customisation profiles
// ─────────────────────────────────────────────────────────────────────────────

function tireDef(fl, fr, rl, rr, scale = [0.4, 0.4, 0.4], altScale = null) {
  const pos = [fl, fr, rl, rr];
  return {
    defaultScale:     scale,
    defaultPositions: pos,
    defaultRotation:  [0, 0, 0],
    altScale:         altScale ?? scale.map((s) => s * 1.05),
    altPositions:     pos,
    altRotation:      [0, 0, 0],
  };
}

const PROFILES = {
  honda_civic: {
    tires: tireDef(
      { x: -0.77, y: 0.38, z:  1.25 },
      { x:  0.77, y: 0.38, z:  1.25 },
      { x: -0.77, y: 0.38, z: -1.20 },
      { x:  0.77, y: 0.38, z: -1.20 },
      [0.4, 0.4, 0.4]
    ),
    bumper:  { scale: [1, 1, 1], position: [0, 0.30, 2.15], rotation: [0, 0, 0] },
    xenon:   {
      default:    { scale: [1, 1, 1], pos: [0.68, 0.56, 2.10], rot: [0, 0, 0] },
      civiclight: { scale: [1, 1, 1], pos: [0.68, 0.56, 2.10], rot: [0, Math.PI, 0] },
    },
    backlight: { scale: [1, 1, 1], rightPos: [0.72, 0.56, -2.10], leftPos: [-0.72, 0.56, -2.10], rotation: [0, 0, 0] },
  },

  lamborghini_huracan: {
    tires: tireDef(
      { x: -0.790, y: 0.48, z: -1.46 },
      { x:  0.790, y: 0.48, z: -1.46 },
      { x: -0.811, y: 0.48, z:  1.16 },
      { x:  0.811, y: 0.48, z:  1.16 },
      [0.38, 0.38, 0.38], [0.4, 0.4, 0.4]
    ),
    bumper:  { scale: [1, 1, 1], position: [0, 0.25, 2.50], rotation: [0, 0, 0] },
    xenon:   {
      default:    { scale: [1, 1, 1], pos: [0.80, 0.45, 2.45], rot: [0, 0, 0] },
      civiclight: { scale: [1, 1, 1], pos: [0.80, 0.45, 2.45], rot: [0, Math.PI, 0] },
    },
    backlight: { scale: [1, 1, 1], rightPos: [0.82, 0.45, -2.38], leftPos: [-0.82, 0.45, -2.38], rotation: [0, 0, 0] },
  },

  toyota_supra: {
    modelScale: [0.01, 0.01, 0.01],
    tires: tireDef(
      { x: -0.78, y: 0.40, z:  1.22 },
      { x:  0.78, y: 0.40, z:  1.22 },
      { x: -0.82, y: 0.40, z: -1.22 },
      { x:  0.82, y: 0.40, z: -1.22 },
    ),
    bumper:  { scale: [1, 1, 1], position: [0, 0.30, 2.20], rotation: [0, 0, 0] },
    xenon:   {
      default:    { scale: [1, 1, 1], pos: [0.72, 0.50, 2.12], rot: [0, 0, 0] },
      civiclight: { scale: [1, 1, 1], pos: [0.72, 0.50, 2.12], rot: [0, Math.PI, 0] },
    },
    backlight: { scale: [1, 1, 1], rightPos: [0.75, 0.48, -2.12], leftPos: [-0.75, 0.48, -2.12], rotation: [0, 0, 0] },
  },

  carmodel_sedan: {
    modelScale: [0.001, 0.001, 0.001],
    tires: tireDef(
      { x: -0.65, y: 0.38, z:  0.18 },
      { x:  0.65, y: 0.38, z:  0.18 },
      { x: -0.65, y: 0.38, z: -0.18 },
      { x:  0.65, y: 0.38, z: -0.18 },
    ),
    bumper:  { scale: [1, 1, 1], position: [0, 0.25, 0.30], rotation: [0, 0, 0] },
    xenon:   {
      default:    { scale: [1, 1, 1], pos: [0.60, 0.35, 0.28], rot: [0, 0, 0] },
      civiclight: { scale: [1, 1, 1], pos: [0.60, 0.35, 0.28], rot: [0, Math.PI, 0] },
    },
    backlight: { scale: [1, 1, 1], rightPos: [0.62, 0.35, -0.28], leftPos: [-0.62, 0.35, -0.28], rotation: [0, 0, 0] },
  },

  bmw_m4: {
    modelScale: [0.01, 0.01, 0.01],
    tires: tireDef(
      { x: -0.80, y: 0.40, z:  1.25 },
      { x:  0.80, y: 0.40, z:  1.25 },
      { x: -0.80, y: 0.40, z: -1.25 },
      { x:  0.80, y: 0.40, z: -1.25 },
    ),
    bumper:  { scale: [1, 1, 1], position: [0, 0.30, 2.20], rotation: [0, 0, 0] },
    xenon:   {
      default:    { scale: [1, 1, 1], pos: [0.74, 0.52, 2.15], rot: [0, 0, 0] },
      civiclight: { scale: [1, 1, 1], pos: [0.74, 0.52, 2.15], rot: [0, Math.PI, 0] },
    },
    backlight: { scale: [1, 1, 1], rightPos: [0.76, 0.50, -2.15], leftPos: [-0.76, 0.50, -2.15], rotation: [0, 0, 0] },
  },

  ferrari: {
    tires: tireDef(
      { x: -0.82, y: 0.32, z:  1.28 },
      { x:  0.82, y: 0.32, z:  1.28 },
      { x: -0.82, y: 0.32, z: -1.28 },
      { x:  0.82, y: 0.32, z: -1.28 },
      [0.36, 0.36, 0.36]
    ),
    bumper:  { scale: [0.9, 0.9, 0.9], position: [0, 0.22, 2.25], rotation: [0, 0, 0] },
    xenon:   {
      default:    { scale: [0.9, 0.9, 0.9], pos: [0.75, 0.36, 2.18], rot: [0, 0, 0] },
      civiclight: { scale: [0.9, 0.9, 0.9], pos: [0.75, 0.36, 2.18], rot: [0, Math.PI, 0] },
    },
    backlight: { scale: [0.9, 0.9, 0.9], rightPos: [0.78, 0.36, -2.18], leftPos: [-0.78, 0.36, -2.18], rotation: [0, 0, 0] },
  },

  bugatti_bolide: {
    modelScale: [0.01, 0.01, 0.01],
    tires: tireDef(
      { x: -0.85, y: 0.35, z:  1.35 },
      { x:  0.85, y: 0.35, z:  1.35 },
      { x: -0.85, y: 0.35, z: -1.35 },
      { x:  0.85, y: 0.35, z: -1.35 },
      [0.38, 0.38, 0.38]
    ),
    bumper:  { scale: [1, 1, 1], position: [0, 0.24, 2.30], rotation: [0, 0, 0] },
    xenon:   {
      default:    { scale: [1, 1, 1], pos: [0.78, 0.40, 2.22], rot: [0, 0, 0] },
      civiclight: { scale: [1, 1, 1], pos: [0.78, 0.40, 2.22], rot: [0, Math.PI, 0] },
    },
    backlight: { scale: [1, 1, 1], rightPos: [0.80, 0.40, -2.22], leftPos: [-0.80, 0.40, -2.22], rotation: [0, 0, 0] },
  },

  dodge_challenger: {
    modelScale: [0.01, 0.01, 0.01],
    tires: tireDef(
      { x: -0.85, y: 0.42, z:  1.30 },
      { x:  0.85, y: 0.42, z:  1.30 },
      { x: -0.85, y: 0.42, z: -1.30 },
      { x:  0.85, y: 0.42, z: -1.30 },
      [0.42, 0.42, 0.42]
    ),
    bumper:  { scale: [1.1, 1.1, 1.1], position: [0, 0.32, 2.25], rotation: [0, 0, 0] },
    xenon:   {
      default:    { scale: [1.1, 1.1, 1.1], pos: [0.80, 0.54, 2.18], rot: [0, 0, 0] },
      civiclight: { scale: [1.1, 1.1, 1.1], pos: [0.80, 0.54, 2.18], rot: [0, Math.PI, 0] },
    },
    backlight: { scale: [1.1, 1.1, 1.1], rightPos: [0.82, 0.54, -2.18], leftPos: [-0.82, 0.54, -2.18], rotation: [0, 0, 0] },
  },

  tesla_roadster: {
    modelScale: [0.01, 0.01, 0.01],
    tires: tireDef(
      { x: -0.80, y: 0.38, z:  1.25 },
      { x:  0.80, y: 0.38, z:  1.25 },
      { x: -0.80, y: 0.38, z: -1.25 },
      { x:  0.80, y: 0.38, z: -1.25 },
      [0.40, 0.40, 0.40]
    ),
    bumper:  { scale: [1, 1, 1], position: [0, 0.28, 2.20], rotation: [0, 0, 0] },
    xenon:   {
      default:    { scale: [1, 1, 1], pos: [0.74, 0.48, 2.12], rot: [0, 0, 0] },
      civiclight: { scale: [1, 1, 1], pos: [0.74, 0.48, 2.12], rot: [0, Math.PI, 0] },
    },
    backlight: { scale: [1, 1, 1], rightPos: [0.76, 0.48, -2.12], leftPos: [-0.76, 0.48, -2.12], rotation: [0, 0, 0] },
  },

  ford_gt40: {
    modelScale: [0.01, 0.01, 0.01],
    tires: tireDef(
      { x: -0.78, y: 0.30, z:  1.20 },
      { x:  0.78, y: 0.30, z:  1.20 },
      { x: -0.78, y: 0.30, z: -1.20 },
      { x:  0.78, y: 0.30, z: -1.20 },
      [0.34, 0.34, 0.34]
    ),
    bumper:  { scale: [0.9, 0.9, 0.9], position: [0, 0.20, 2.10], rotation: [0, 0, 0] },
    xenon:   {
      default:    { scale: [0.9, 0.9, 0.9], pos: [0.70, 0.32, 2.02], rot: [0, 0, 0] },
      civiclight: { scale: [0.9, 0.9, 0.9], pos: [0.70, 0.32, 2.02], rot: [0, Math.PI, 0] },
    },
    backlight: { scale: [0.9, 0.9, 0.9], rightPos: [0.72, 0.32, -2.02], leftPos: [-0.72, 0.32, -2.02], rotation: [0, 0, 0] },
  },

  lancia_037: {
    modelScale: [0.01, 0.01, 0.01],
    tires: tireDef(
      { x: -0.76, y: 0.36, z:  1.18 },
      { x:  0.76, y: 0.36, z:  1.18 },
      { x: -0.76, y: 0.36, z: -1.18 },
      { x:  0.76, y: 0.36, z: -1.18 },
      [0.38, 0.38, 0.38]
    ),
    bumper:  { scale: [0.9, 0.9, 0.9], position: [0, 0.26, 2.05], rotation: [0, 0, 0] },
    xenon:   {
      default:    { scale: [0.9, 0.9, 0.9], pos: [0.70, 0.42, 1.98], rot: [0, 0, 0] },
      civiclight: { scale: [0.9, 0.9, 0.9], pos: [0.70, 0.42, 1.98], rot: [0, Math.PI, 0] },
    },
    backlight: { scale: [0.9, 0.9, 0.9], rightPos: [0.72, 0.42, -1.98], leftPos: [-0.72, 0.42, -1.98], rotation: [0, 0, 0] },
  },

  honda_civic_typer: {
    modelScale: [0.01, 0.01, 0.01],
    tires: tireDef(
      { x: -0.78, y: 0.40, z:  1.25 },
      { x:  0.78, y: 0.40, z:  1.25 },
      { x: -0.78, y: 0.40, z: -1.20 },
      { x:  0.78, y: 0.40, z: -1.20 },
      [0.40, 0.40, 0.40]
    ),
    bumper:  { scale: [1, 1, 1], position: [0, 0.30, 2.15], rotation: [0, 0, 0] },
    xenon:   {
      default:    { scale: [1, 1, 1], pos: [0.70, 0.52, 2.08], rot: [0, 0, 0] },
      civiclight: { scale: [1, 1, 1], pos: [0.70, 0.52, 2.08], rot: [0, Math.PI, 0] },
    },
    backlight: { scale: [1, 1, 1], rightPos: [0.72, 0.52, -2.08], leftPos: [-0.72, 0.52, -2.08], rotation: [0, 0, 0] },
  },

  volkswagen_golf: {
    modelScale: [0.01, 0.01, 0.01],
    tires: tireDef(
      { x: -0.72, y: 0.38, z:  1.15 },
      { x:  0.72, y: 0.38, z:  1.15 },
      { x: -0.72, y: 0.38, z: -1.15 },
      { x:  0.72, y: 0.38, z: -1.15 },
      [0.38, 0.38, 0.38]
    ),
    bumper:  { scale: [0.95, 0.95, 0.95], position: [0, 0.28, 2.05], rotation: [0, 0, 0] },
    xenon:   {
      default:    { scale: [0.95, 0.95, 0.95], pos: [0.66, 0.48, 1.98], rot: [0, 0, 0] },
      civiclight: { scale: [0.95, 0.95, 0.95], pos: [0.66, 0.48, 1.98], rot: [0, Math.PI, 0] },
    },
    backlight: { scale: [0.95, 0.95, 0.95], rightPos: [0.68, 0.48, -1.98], leftPos: [-0.68, 0.48, -1.98], rotation: [0, 0, 0] },
  },

  hyundai_creta: {
    modelScale: [0.01, 0.01, 0.01],
    tires: tireDef(
      { x: -0.78, y: 0.42, z:  1.20 },
      { x:  0.78, y: 0.42, z:  1.20 },
      { x: -0.78, y: 0.42, z: -1.20 },
      { x:  0.78, y: 0.42, z: -1.20 },
      [0.42, 0.42, 0.42]
    ),
    bumper:  { scale: [1.05, 1.05, 1.05], position: [0, 0.34, 2.12], rotation: [0, 0, 0] },
    xenon:   {
      default:    { scale: [1.05, 1.05, 1.05], pos: [0.72, 0.55, 2.05], rot: [0, 0, 0] },
      civiclight: { scale: [1.05, 1.05, 1.05], pos: [0.72, 0.55, 2.05], rot: [0, Math.PI, 0] },
    },
    backlight: { scale: [1.05, 1.05, 1.05], rightPos: [0.74, 0.55, -2.05], leftPos: [-0.74, 0.55, -2.05], rotation: [0, 0, 0] },
  },

  hyundai_sonata: {
    modelScale: [0.01, 0.01, 0.01],
    tires: tireDef(
      { x: -0.78, y: 0.38, z:  1.35 },
      { x:  0.78, y: 0.38, z:  1.35 },
      { x: -0.78, y: 0.38, z: -1.35 },
      { x:  0.78, y: 0.38, z: -1.35 },
      [0.40, 0.40, 0.40]
    ),
    bumper:  { scale: [1, 1, 1], position: [0, 0.28, 2.30], rotation: [0, 0, 0] },
    xenon:   {
      default:    { scale: [1, 1, 1], pos: [0.72, 0.48, 2.22], rot: [0, 0, 0] },
      civiclight: { scale: [1, 1, 1], pos: [0.72, 0.48, 2.22], rot: [0, Math.PI, 0] },
    },
    backlight: { scale: [1, 1, 1], rightPos: [0.74, 0.48, -2.22], leftPos: [-0.74, 0.48, -2.22], rotation: [0, 0, 0] },
  },

  concept_sport: {
    tires: tireDef(
      { x: -0.75, y: 0.35, z:  1.20 },
      { x:  0.75, y: 0.35, z:  1.20 },
      { x: -0.75, y: 0.35, z: -1.20 },
      { x:  0.75, y: 0.35, z: -1.20 },
      [0.36, 0.36, 0.36]
    ),
    bumper:  { scale: [0.9, 0.9, 0.9], position: [0, 0.24, 2.10], rotation: [0, 0, 0] },
    xenon:   {
      default:    { scale: [0.9, 0.9, 0.9], pos: [0.68, 0.38, 2.02], rot: [0, 0, 0] },
      civiclight: { scale: [0.9, 0.9, 0.9], pos: [0.68, 0.38, 2.02], rot: [0, Math.PI, 0] },
    },
    backlight: { scale: [0.9, 0.9, 0.9], rightPos: [0.70, 0.38, -2.02], leftPos: [-0.70, 0.38, -2.02], rotation: [0, 0, 0] },
  },

  generic_sedan: {
    modelScale: [0.01, 0.01, 0.01],
    tires: tireDef(
      { x: -0.72, y: 0.38, z:  1.15 },
      { x:  0.72, y: 0.38, z:  1.15 },
      { x: -0.72, y: 0.38, z: -1.15 },
      { x:  0.72, y: 0.38, z: -1.15 },
      [0.38, 0.38, 0.38]
    ),
    bumper:  { scale: [1, 1, 1], position: [0, 0.28, 2.05], rotation: [0, 0, 0] },
    xenon:   {
      default:    { scale: [1, 1, 1], pos: [0.66, 0.45, 1.98], rot: [0, 0, 0] },
      civiclight: { scale: [1, 1, 1], pos: [0.66, 0.45, 1.98], rot: [0, Math.PI, 0] },
    },
    backlight: { scale: [1, 1, 1], rightPos: [0.68, 0.45, -1.98], leftPos: [-0.68, 0.45, -1.98], rotation: [0, 0, 0] },
  },

  volkswagen_beetle: {
    tires: tireDef(
      { x: -0.70, y: 0.36, z:  1.10 },
      { x:  0.70, y: 0.36, z:  1.10 },
      { x: -0.70, y: 0.36, z: -1.10 },
      { x:  0.70, y: 0.36, z: -1.10 },
      [0.36, 0.36, 0.36]
    ),
    bumper:  { scale: [0.9, 0.9, 0.9], position: [0, 0.26, 2.00], rotation: [0, 0, 0] },
    xenon:   {
      default:    { scale: [0.9, 0.9, 0.9], pos: [0.62, 0.42, 1.92], rot: [0, 0, 0] },
      civiclight: { scale: [0.9, 0.9, 0.9], pos: [0.62, 0.42, 1.92], rot: [0, Math.PI, 0] },
    },
    backlight: { scale: [0.9, 0.9, 0.9], rightPos: [0.64, 0.42, -1.92], leftPos: [-0.64, 0.42, -1.92], rotation: [0, 0, 0] },
  },
};

export function getCustomizationProfile(carMake, modelUrl) {
  const url  = (modelUrl ?? "").toLowerCase();
  const make = (carMake  ?? "").toLowerCase();

  if (url.includes("civic_typer"))           return PROFILES.honda_civic_typer;
  if (url.includes("/models/honda/civic"))   return PROFILES.honda_civic;
  if (url.includes("/models/lamborghini/"))  return PROFILES.lamborghini_huracan;
  if (url.includes("/models/toyota/supra"))  return PROFILES.toyota_supra;
  if (url.includes("/models/bmw/m4"))        return PROFILES.bmw_m4;
  if (url.includes("/models/ferrari/"))      return PROFILES.ferrari;
  if (url.includes("/models/bugatti/"))      return PROFILES.bugatti_bolide;
  if (url.includes("/models/dodge/"))        return PROFILES.dodge_challenger;
  if (url.includes("/models/tesla/"))        return PROFILES.tesla_roadster;
  if (url.includes("/models/ford/"))         return PROFILES.ford_gt40;
  if (url.includes("/models/lancia/"))       return PROFILES.lancia_037;
  if (url.includes("/models/volkswagen/concept")) return PROFILES.concept_sport;
  if (url.includes("/models/shared/car_blank"))   return PROFILES.generic_sedan;
  if (url.includes("/models/volkswagen/beetle"))  return PROFILES.volkswagen_beetle;
  if (url.includes("/models/volkswagen/"))       return PROFILES.volkswagen_golf;
  if (url.includes("/models/hyundai/creta")) return PROFILES.hyundai_creta;
  if (url.includes("/models/hyundai/sonata"))return PROFILES.hyundai_sonata;
  if (url.includes("/models/hyundai/"))      return PROFILES.hyundai_creta;
  if (url.includes("/carmodels/"))           return PROFILES.carmodel_sedan;

  if (make === "lamborghini") return PROFILES.lamborghini_huracan;
  if (make === "toyota")      return PROFILES.toyota_supra;
  if (make === "bmw")         return PROFILES.bmw_m4;
  if (make === "ferrari")     return PROFILES.ferrari;
  if (make === "bugatti")     return PROFILES.bugatti_bolide;
  if (make === "dodge")       return PROFILES.dodge_challenger;
  if (make === "tesla")       return PROFILES.tesla_roadster;
  if (make === "ford")        return PROFILES.ford_gt40;
  if (make === "lancia")      return PROFILES.lancia_037;
  if (make === "volkswagen")  return PROFILES.volkswagen_golf;
  if (make === "hyundai")     return PROFILES.hyundai_creta;
  if (make === "honda")       return PROFILES.honda_civic;
  return PROFILES.honda_civic;
}
