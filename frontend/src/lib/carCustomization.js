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
  "tire", "tyre", "newtire", "wheel", "rim", "spoke", "rotor", "brake", "caliper", "calliper",
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

/** Window tint presets — index 0 = no tint.
 *  opacity rises with the tint level so darker = MORE opaque (less see-through). */
export const WINDOW_TINTS = [
  { label: "No Tint", opacity: 0.12, hex: "#cfe0ee" },
  { label: "Light",   opacity: 0.45, hex: "#26323c" },
  { label: "Medium",  opacity: 0.66, hex: "#161d24" },
  { label: "Dark",    opacity: 0.84, hex: "#0c1116" },
  { label: "Limo",    opacity: 0.95, hex: "#05080b" },
];

/** Rim/caliper color presets — 3DTuning-style picker chips. */
export const RIM_COLORS = {
  factory: { label: "Factory", hex: null },           // null = restore original
  silver:  { label: "Silver",  hex: "#cfd0d2" },
  chrome:  { label: "Chrome",  hex: "#e8e8e8", metalness: 1.0, roughness: 0.08 },
  black:   { label: "Gloss Black", hex: "#101010", metalness: 0.45, roughness: 0.18 },
  matte:   { label: "Matte Black", hex: "#1a1a1a", metalness: 0.1,  roughness: 0.85 },
  gold:    { label: "Gold",    hex: "#d4af37", metalness: 0.9,  roughness: 0.18 },
  bronze:  { label: "Bronze",  hex: "#8a5a2b", metalness: 0.8,  roughness: 0.30 },
  red:     { label: "Race Red",hex: "#c01616", metalness: 0.4,  roughness: 0.20 },
  blue:    { label: "Race Blue",hex:"#1a4fa3", metalness: 0.4,  roughness: 0.20 },
  white:   { label: "White",   hex: "#ececec", metalness: 0.2,  roughness: 0.30 },
};

export const CALIPER_COLORS = {
  factory: { label: "Factory", hex: null },
  red:     { label: "Red",     hex: "#c80000" },
  yellow:  { label: "Yellow",  hex: "#e4c10a" },
  blue:    { label: "Blue",    hex: "#1a4fa3" },
  black:   { label: "Black",   hex: "#0c0c0c" },
  silver:  { label: "Silver",  hex: "#bcbcbc" },
  orange:  { label: "Orange",  hex: "#e26b1a" },
  green:   { label: "Green",   hex: "#0e7a32" },
};

/** Neon underglow color presets (0xRRGGBB). null = off. */
export const NEON_COLORS = {
  off:    { label: "Off",     hex: null },
  red:    { label: "Red",     hex: 0xff1530 },
  pink:   { label: "Pink",    hex: 0xff35a8 },
  purple: { label: "Purple",  hex: 0xa040ff },
  blue:   { label: "Blue",    hex: 0x1a78ff },
  cyan:   { label: "Cyan",    hex: 0x18d6ff },
  green:  { label: "Green",   hex: 0x33ff5e },
  yellow: { label: "Yellow",  hex: 0xffd11a },
  white:  { label: "White",   hex: 0xffffff },
};

/** Roof / accent two-tone color presets (hex string or null = no override). */
export const ACCENT_COLORS = {
  off:    { label: "Off",         hex: null },
  black:  { label: "Black",       hex: "#0d0d0d" },
  white:  { label: "White",       hex: "#ececec" },
  carbon: { label: "Carbon",      hex: "#161616", carbon: true },
  red:    { label: "Red",         hex: "#c01616" },
  silver: { label: "Silver",      hex: "#bcbcbc" },
  gold:   { label: "Gold",        hex: "#d4af37" },
};

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

/**
 * finish: 'gloss' | 'metallic' | 'matte' | 'satin'
 * options.onlyMaterials: optional array of material-name substrings. When set,
 *   ONLY meshes whose material name matches one of these are repainted. Used for
 *   GTA-style models (e.g. Hilux) where the whole exterior shell shares a single
 *   "primary" respray material — this keeps interior / trim / glass untouched so
 *   the cabin doesn't bleed body colour through the windows.
 */
export function applyBodyPaint(root, hexColor, finish = "gloss", options = {}) {
  const onlyMaterials = options.onlyMaterials;
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

    if (onlyMaterials && onlyMaterials.length) {
      // Whitelist mode (GTA models): paint ONLY meshes on the listed material(s).
      // The whitelist is authoritative, so the keyword-based SKIP list is bypassed
      // here — otherwise a coincidental substring (e.g. "rim" inside "p-rim-ary")
      // would wrongly exclude the body shell from being painted.
      const inWhitelist = matNames.some((mn) =>
        onlyMaterials.some((w) => mn.includes(w.toLowerCase())));
      if (!inWhitelist) return;
    } else if (matches(SKIP_PAINT_KEYWORDS)) {
      return;
    }

    const isBlackTrim = matches(BLACK_TRIM_KEYWORDS);

    // Create a completely fresh material — avoids ALL baked GLB properties
    // (vertex colors, textures, emissive tints) that can't be reliably overridden.
    // The original material name is copied across so repeated repaints (e.g. the
    // whitelist that matches on "primary") keep working after the first paint.
    const makeFreshMat = (origMat) => {
      const fresh = isBlackTrim
        ? new THREE.MeshStandardMaterial({
            color: 0x111111,
            roughness: finish === "matte" ? 0.85 : 0.55,
            metalness: 0.12,
            envMapIntensity: 0.4,
          })
        : new THREE.MeshPhysicalMaterial({
            color:              paint.clone(),
            roughness,
            metalness,
            envMapIntensity:    envMap,
            clearcoat:          finish === "matte" ? 0.0 : 1.0,
            clearcoatRoughness: finish === "matte" ? 0.0 : 0.05,
          });
      if (origMat?.name) fresh.name = origMat.name;
      return fresh;
    };

    if (Array.isArray(child.material)) {
      child.material = child.material.map((m) => makeFreshMat(m));
    } else {
      child.material = makeFreshMat(child.material);
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

// Light-lens name fragments — used to keep window tint off the head/tail lights
// and to drive restyleLights().
const HEADLIGHT_KW = ["headlight", "foglight", "front_light"];
const TAILLIGHT_KW = ["taillight", "rear_light", "rev_light", "revlight"];
const LIGHT_KW = [...HEADLIGHT_KW, ...TAILLIGHT_KW];

// ─── Universal light classifier ──────────────────────────────────────────────
// STRICT keywords = unambiguous compound forms ("headlight", "drl", "taillight").
// SOFT keywords   = bare words that could appear in non-light part names
//                   ("running"→running_board, "brake"→brake_disc, "fog"→fog horn,
//                   "tails"→detail_tails). Soft matches require BOTH size guard
//                   AND position consistency (head must be at front of car,
//                   tail at rear). TAIL is always checked before HEAD so
//                   "redfog"/"brake_light" beat the loose "fog"/"light" hints.
const STRICT_HEAD_KW = [
  "headlight", "headlamp", "head_lamp", "head_light",
  "frontlight", "front_light",
  "foglight", "fog_light",
  "drl",
  "running_light", "runninglight",
  "lowbeam", "low_beam", "lowhighbeam", "low_high_beam",
  "highbeam", "high_beam",
  "xenon_lamp",
];
const STRICT_TAIL_KW = [
  "taillight", "tail_light", "taillamp", "tail_lamp",
  "rearlight", "rear_light", "rear_lamp", "rearlamp",
  "brakelight", "brake_light",
  "stoplight", "stop_light",
  "rev_light", "revlight", "reverse_light", "reverse_lamp",
  "trunklight", "trunk_light",
  "redfog", "red_fog", "rearfog", "rear_fog",
];
const SOFT_HEAD_KW = ["fog", "running", "halogen"];
const SOFT_TAIL_KW = ["brake", "tails", "stop"];
const UNIVERSAL_AMBIG_KW = ["lens", "lamp", "lights", "glow", "halo"];

// Mesh / parent NAMES that must never be repainted as lights. Material substring
// is intentionally NOT checked here — overlapping material substrings (e.g.
// "primary_headlight" containing the body whitelist "primary") would falsely veto
// legitimate light meshes. Body materials are excluded separately via the paint
// whitelist passed in opts.paintMaterials.
//
// Intentionally OMITTED (despite the impulse to add them): "bumper", "hood",
// "roof", "trunk", "door", "chassis", "frame", "exhaust". GLB hierarchies often
// parent the headlight mesh under "front_bumper" or "front_grille", so excluding
// those names veto's real lights. Body panels naturally don't match HEAD/TAIL
// keywords AND get blocked by the body-material whitelist anyway, so they don't
// need a NAME blacklist entry too.
const NEVER_LIGHT_NAME = [
  "interior", "dashboard", "seat", "gauge", "needle", "screen", "nav",
  "console", "carpet", "steering", "rpm", "display", "hazard",
  "trim_int", "intlight", "doorpanel", "door_panel",
  "wheel", "tire", "tyre", "rim", "spoke", "hub", "brake_disc", "rotor", "caliper",
  "windshield", "windscreen", "window",
  // Foreign light geometry that THIS module itself injects — never re-restyle.
  "back_light_left", "back_light_right",
  "xenon_light_left", "xenon_light_right",
];

/** Apply window tint — tintIndex maps to WINDOW_TINTS array (0 = restore original) */
export function applyWindowTint(root, tintIndex) {
  const tint     = WINDOW_TINTS[tintIndex] ?? WINDOW_TINTS[0];
  const isNoTint = tintIndex === 0;
  const GLASS_KW = ["glass", "window", "windshield", "windscreen", "visor", "wind"];

  root.traverse((child) => {
    if (!child.isMesh) return;
    if (isInsideAttachedPart(child)) return;

    const partName = (child.name || "").toLowerCase();
    if (LIGHT_KW.some((kw) => partName.includes(kw))) return;

    const matList  = Array.isArray(child.material) ? child.material : [child.material];
    const matNames = matList.map((m) => (m?.name || "").toLowerCase());

    let isGlass = GLASS_KW.some(
      (kw) => partName.includes(kw) || matNames.some((mn) => mn.includes(kw))
    );
    // Fallback: treat already-transparent meshes as glass
    if (!isGlass) {
      isGlass = matList.some((m) => m && m.transparent && (m.opacity ?? 1) < 0.85);
    }
    if (!isGlass) return;

    // Save factory material on first encounter so No Tint can restore it
    if (child.userData.__origGlassMat === undefined) {
      child.userData.__origGlassMat = Array.isArray(child.material)
        ? child.material.slice()
        : child.material;
    }

    if (isNoTint) {
      child.material = child.userData.__origGlassMat;
      return;
    }

    const origFirst = Array.isArray(child.userData.__origGlassMat)
      ? child.userData.__origGlassMat[0]
      : child.userData.__origGlassMat;

    const makeTintMat = () => {
      const m = new THREE.MeshPhysicalMaterial({
        color:       new THREE.Color(tint.hex),
        transparent: true,
        opacity:     tint.opacity,
        roughness:   0.04,
        metalness:   0.0,
        clearcoat:   0.5,
        side:        THREE.DoubleSide,
      });
      // Preserve original name so paint-skip logic still recognises this as glass
      if (origFirst?.name) m.name = origFirst.name;
      return m;
    };

    if (Array.isArray(child.material)) child.material = child.material.map(makeTintMat);
    else child.material = makeTintMat();
  });
}

/**
 * Universal headlight / taillight restyler — works across ANY GLB without
 * per-car configuration. Strategy (3DTuning-style structural detection):
 *
 *   1. Skip body materials   (from opts.paintMaterials whitelist — these are
 *      the panels applyBodyPaint repaints, so they CAN'T be lights).
 *   2. Skip known non-lights (interior, wheels, bumpers, exhaust, windows…).
 *   3. Match HEAD / TAIL keywords across mesh name + parent name + material
 *      name. TAIL is checked FIRST so "redfog" / "brake_red" / "tail" win over
 *      the bare "fog" / "red" head hints.
 *   4. Soft fallback: meshes with ambiguous hints ("lens"/"lamp") OR an already-
 *      emissive original material get classified by position — front half of the
 *      car bounding box becomes head, rear half becomes tail.
 *   5. Size guard: anything larger than 0.9 m is a body panel, never a lamp lens.
 *   6. Apply a fresh MeshStandardMaterial with `toneMapped: false` so the glow
 *      bypasses the scene's NeutralToneMapping clamp and reads as real light.
 *
 * frontMod / rearMod: selected mod NAME (e.g. "Xenon Lights"), the literal
 *   string "__default__" for the always-on showroom glow, or null/undefined to
 *   restore the factory material.
 *
 * opts.paintMaterials: optional list of material names that belong to the body
 *   shell — used to make sure body panels are never wrongly classified as lamps.
 */
export function restyleLights(root, frontMod, rearMod, opts = {}) {
  if (!root) return;

  const bodyMaterialSet = new Set(
    (opts.paintMaterials || []).map((s) => String(s).toLowerCase())
  );

  // Bounding box of the whole car — used to classify ambiguous meshes (front
  // half → head, rear half → tail). Computed in world space so wrapper offsets
  // don't skew positions.
  root.updateMatrixWorld(true);
  const carBox = new THREE.Box3().setFromObject(root);
  const carCenter = carBox.getCenter(new THREE.Vector3());
  const lenZ = carBox.max.z - carBox.min.z;
  const lenX = carBox.max.x - carBox.min.x;
  const isZAxis = lenZ >= lenX;
  const halfLen = (isZAxis ? lenZ : lenX) / 2 || 1;

  const longitudinalOf = (mesh) => {
    const mb = new THREE.Box3().setFromObject(mesh);
    const c = mb.getCenter(new THREE.Vector3());
    return (isZAxis ? c.z - carCenter.z : c.x - carCenter.x) / halfLen;
  };

  root.traverse((child) => {
    if (!child.isMesh) return;
    if (isInsideAttachedPart(child)) return;

    const meshName   = (child.name || "").toLowerCase();
    const parentName = (child.parent?.name || "").toLowerCase();
    const matList    = Array.isArray(child.material) ? child.material : [child.material];
    const matNames   = matList.map((m) => (m?.name || "").toLowerCase()).filter(Boolean);

    // 1) Body materials (paint whitelist) — exact equals match, never a light.
    if (matNames.some((mn) => bodyMaterialSet.has(mn))) return;

    // 2) Universal non-light meshes — checks mesh + parent NAME only.
    const namesText = `${meshName} ${parentName}`;
    if (NEVER_LIGHT_NAME.some((kw) => namesText.includes(kw))) return;

    const allText = `${meshName} ${parentName} ${matNames.join(" ")}`;

    // 3) Tiered keyword detection.
    //    STRICT  = trust the keyword alone (compound forms like "headlight")
    //    SOFT    = require size guard + position consistency (bare ambiguous words)
    //    AMBIG   = "lens"/"lamp" + position classify
    //    EMISSIVE-ORIG = original GLB material was already emissive — likely a lamp
    const strictTail = STRICT_TAIL_KW.some((kw) => allText.includes(kw));
    const strictHead = !strictTail && STRICT_HEAD_KW.some((kw) => allText.includes(kw));
    const softTail   = !strictHead && !strictTail && SOFT_TAIL_KW.some((kw) => allText.includes(kw));
    const softHead   = !strictHead && !strictTail && !softTail && SOFT_HEAD_KW.some((kw) => allText.includes(kw));
    const hasAmbig   = !strictHead && !strictTail && !softHead && !softTail &&
                       UNIVERSAL_AMBIG_KW.some((kw) => allText.includes(kw));

    const isOrigEmissive = matList.some((m) => {
      if (!m) return false;
      if (m.emissiveMap) return true;
      const e = m.emissive;
      return !!(e && (e.r > 0.05 || e.g > 0.05 || e.b > 0.05));
    });

    if (!strictHead && !strictTail && !softHead && !softTail && !hasAmbig && !isOrigEmissive) return;

    // 4) Size guard — body panels with misleading names get dropped. Only STRICT
    //    matches skip this check (pickup headlights can exceed 1 m).
    const isStrict = strictHead || strictTail;
    if (!isStrict) {
      const meshBox = new THREE.Box3().setFromObject(child);
      const maxDim = Math.max(
        meshBox.max.x - meshBox.min.x,
        meshBox.max.y - meshBox.min.y,
        meshBox.max.z - meshBox.min.z
      );
      if (maxDim > 0.9) return;
    }

    // 5) Classify head vs tail + position consistency for soft / ambig matches.
    const lp = longitudinalOf(child);
    let isHead, isTail;
    if (strictHead) {
      isHead = true;
    } else if (strictTail) {
      isTail = true;
    } else if (softHead) {
      if (lp < 0) return;   // a "running"/"fog" mesh in the rear half is NOT a headlight
      isHead = true;
    } else if (softTail) {
      if (lp > 0) return;   // a "brake"/"stop" mesh in the front half is NOT a taillight
      isTail = true;
    } else {
      // hasAmbig or isOrigEmissive — split purely by position.
      if (lp > 0.3) isHead = true;
      else if (lp < -0.3) isTail = true;
      else return;
    }

    // 7) Stash factory material so frontMod=null can restore the showroom look.
    if (child.userData.__origLightMat === undefined) {
      child.userData.__origLightMat = child.material;
    }
    const orig = child.userData.__origLightMat;

    const mod = isHead ? frontMod : rearMod;
    if (!mod) { child.material = orig; return; }
    const isDefault = mod === "__default__";

    // 8) Build a fresh material (clone would keep clearcoat darkening the glow).
    //    toneMapped:false makes the lamp bypass NeutralToneMapping so emissive
    //    intensity reads correctly instead of being squashed to mid-grey.
    let color, emissive, emissiveIntensity, transparent = false, opacity = 1;
    if (isHead) {
      const xenon = !isDefault && /xenon/i.test(mod);
      const led   = !isDefault && /led/i.test(mod);
      // Three clearly-separated looks so switching light type is unmistakable:
      //   default → warm amber halogen (yellow-orange)
      //   LED     → pure crisp white (neutral, no tint)
      //   xenon   → strong cool blue (obviously "blue", not just white)
      // Xenon uses a saturated blue at a LOWER emissive intensity — pushing
      // intensity too high blooms the colour out to white, killing the blue read.
      const c = new THREE.Color(
        xenon ? 0x3a93ff :
        led   ? 0xffffff :
        isDefault ? 0xffb24d :
        0xffffff
      );
      color = c.clone();
      emissive = c.clone();
      emissiveIntensity = isDefault ? 6 : xenon ? 8 : led ? 15 : 10;
    } else {
      const smoked = !isDefault && /smoke/i.test(mod);
      const led    = !isDefault && /led/i.test(mod);
      if (smoked) {
        color = new THREE.Color(0x1a0808);
        emissive = new THREE.Color(0xaa0000);
        emissiveIntensity = 2.5;
        transparent = true;
        opacity = 0.78;
      } else {
        const c = new THREE.Color(led ? 0xff4444 : 0xff2222);
        color = c.clone();
        emissive = c.clone();
        emissiveIntensity = isDefault ? 5 : led ? 12 : 8;
      }
    }

    const m = new THREE.MeshStandardMaterial({
      color,
      emissive,
      emissiveIntensity,
      roughness: 0.35,
      metalness: 0.0,
      transparent,
      opacity,
      toneMapped: false,
    });
    const baseName = (Array.isArray(orig) ? orig[0] : orig)?.name;
    if (baseName) m.name = baseName;
    child.material = m;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 3DTuning-style visual effects
// ─────────────────────────────────────────────────────────────────────────────

// Mesh / material name fragments used to identify wheel-related parts. We split
// rims vs tyres so the rim picker only repaints the alloy and never the rubber.
const RIM_NAME_KW   = ["rim", "alloy", "hub", "spoke", "wheel_face", "wheelface"];
const TYRE_NAME_KW  = ["tire", "tyre", "tread", "rubber"];
const CALIPER_KW    = ["caliper", "calliper", "brake_caliper", "brakecaliper"];

// Body-part keywords used as a *negative* signal — if a mesh name/parent looks
// like a chassis/door/bumper, it's never a rim or caliper even if it happens
// to share a material whose name contains "wheel" (toyota/hilux.glb does this).
const BODY_PART_KW = ["chassis", "body", "frame", "door", "bonnet", "hood", "roof", "bumper", "fender", "trunk", "boot", "skirt", "panel", "grille", "mirror"];

// Roof / hood / accent surface keywords for two-tone / carbon overlays.
const ROOF_KW   = ["roof", "top_panel", "toppanel"];
const HOOD_KW   = ["hood", "bonnet"];
const INTERIOR_KW = ["interior", "dashboard", "seat", "console", "carpet", "dash", "trim_int"];

function _matchesAny(child, kws) {
  const n = (child.name || "").toLowerCase();
  const pn = (child.parent?.name || "").toLowerCase();
  const mats = Array.isArray(child.material) ? child.material : [child.material];
  const matNames = mats.map(m => (m?.name || "").toLowerCase()).filter(Boolean);
  return kws.some(kw =>
    n.includes(kw) || pn.includes(kw) || matNames.some(mn => mn.includes(kw))
  );
}

// Identify rim/alloy meshes. We match strict keywords (rim/alloy/spoke/...)
// anywhere, OR fall back to a parent-name "wheel" match — but the fallback is
// suppressed when the mesh is clearly part of a body panel (e.g. hilux.glb's
// `hilux_chassis_wheel_rf.*_0` meshes which share a wheel material but are
// actually the chassis).
function _isRimMesh(child) {
  if (_matchesAny(child, RIM_NAME_KW)) {
    if (_matchesAny(child, BODY_PART_KW)) return false;
    return true;
  }
  const pn = (child.parent?.name || "").toLowerCase();
  const parentIsWheelGroup = pn.includes("wheel") || pn.includes("rim") || pn.includes("alloy");
  if (!parentIsWheelGroup) return false;
  if (_matchesAny(child, BODY_PART_KW)) return false;
  return true;
}

// Some GLBs don't name the caliper mesh "caliper": honda/civic.glb has it as
// a "red" sub-mesh inside the wheel group, and toyota/corolla.glb names it
// `e180_brake_F_S` / `e180_brake_R_*`. This helper catches all three patterns
// so the brake-caliper picker has something to paint.
const BRAKE_NOT_CALIPER_KW = ["brakedisc", "brakerotor", "brakelight", "brakepedal", "brakecable", "brakeline"];

function _isCaliperLike(child) {
  if (_matchesAny(child, CALIPER_KW) && !_matchesAny(child, BODY_PART_KW)) return true;

  const n  = (child.name || "").toLowerCase();
  const pn = (child.parent?.name || "").toLowerCase();
  const mats = Array.isArray(child.material) ? child.material : [child.material];
  const matNames = mats.map(m => (m?.name || "").toLowerCase()).filter(Boolean);

  if (_matchesAny(child, BODY_PART_KW)) return false;

  // Corolla-style: a node parented under `*brake*` is almost always the
  // caliper — but skip discs/rotors/lights/pedals/cables that also contain
  // "brake" in their parent name.
  const parentLooksBrake = pn.includes("brake") && !BRAKE_NOT_CALIPER_KW.some(x => pn.includes(x));
  if (parentLooksBrake) {
    const looksDisc = n.includes("disc") || n.includes("rotor") || matNames.some(mn => mn.includes("disc") || mn.includes("rotor"));
    if (!looksDisc) return true;
  }

  // Civic-style: red sub-mesh under a wheel parent.
  const parentIsWheel = pn.includes("wheel") || pn.includes("rim") || pn.includes("alloy");
  if (!parentIsWheel) return false;
  const looksRed = n.includes("_red") || n.includes("red_") || matNames.some(mn => mn.includes("red"));
  return looksRed;
}

function _restoreFactory(child, key) {
  if (child.userData[key] === undefined) return false;
  child.material = child.userData[key];
  return true;
}

function _stashFactory(child, key) {
  if (child.userData[key] === undefined) {
    child.userData[key] = Array.isArray(child.material)
      ? child.material.slice()
      : child.material;
  }
}

/**
 * Recolor rim / alloy meshes. preset = key from RIM_COLORS.
 * Skips tyres (rubber) so they keep their black factory look.
 */
export function applyRimColor(root, presetKey) {
  if (!root) return;
  const preset = RIM_COLORS[presetKey] ?? RIM_COLORS.factory;

  root.traverse(child => {
    if (!child.isMesh) return;
    if (!_isRimMesh(child)) return;
    if (_matchesAny(child, TYRE_NAME_KW)) return; // never repaint tyres
    if (_isCaliperLike(child)) return;            // never repaint calipers as rims

    if (preset.hex == null) { _restoreFactory(child, "__origRimMat"); return; }
    _stashFactory(child, "__origRimMat");

    const paint = new THREE.Color(preset.hex);
    const make = () => new THREE.MeshStandardMaterial({
      color: paint.clone(),
      metalness: preset.metalness ?? 0.65,
      roughness: preset.roughness ?? 0.22,
      envMapIntensity: 1.6,
    });
    child.material = Array.isArray(child.material) ? child.material.map(make) : make();
  });
}

/** Recolor brake caliper meshes. preset = key from CALIPER_COLORS. */
export function applyCaliperColor(root, presetKey) {
  if (!root) return;
  const preset = CALIPER_COLORS[presetKey] ?? CALIPER_COLORS.factory;

  root.traverse(child => {
    if (!child.isMesh) return;
    if (!_isCaliperLike(child)) return;

    if (preset.hex == null) { _restoreFactory(child, "__origCaliperMat"); return; }
    _stashFactory(child, "__origCaliperMat");

    const paint = new THREE.Color(preset.hex);
    const make = () => new THREE.MeshStandardMaterial({
      color: paint.clone(),
      metalness: 0.30,
      roughness: 0.45,
      emissive: paint.clone().multiplyScalar(0.06),
      envMapIntensity: 1.0,
    });
    child.material = Array.isArray(child.material) ? child.material.map(make) : make();
  });
}

/**
 * Apply a two-tone accent (roof or hood) — used for roof wraps & carbon hoods.
 * surface: "roof" | "hood"
 * presetKey: key from ACCENT_COLORS
 */
export function applyAccentColor(root, surface, presetKey) {
  if (!root) return;
  const kws = surface === "hood" ? HOOD_KW : ROOF_KW;
  const stashKey = `__origAccentMat_${surface}`;
  const preset = ACCENT_COLORS[presetKey] ?? ACCENT_COLORS.off;

  root.traverse(child => {
    if (!child.isMesh) return;
    if (!_matchesAny(child, kws)) return;
    if (_matchesAny(child, INTERIOR_KW)) return; // never touch interior trim

    if (preset.hex == null) { _restoreFactory(child, stashKey); return; }
    _stashFactory(child, stashKey);

    const paint = new THREE.Color(preset.hex);
    const make = () => new THREE.MeshPhysicalMaterial({
      color: paint.clone(),
      roughness: preset.carbon ? 0.55 : 0.18,
      metalness: preset.carbon ? 0.05 : 0.35,
      clearcoat: preset.carbon ? 0.4 : 0.95,
      clearcoatRoughness: preset.carbon ? 0.55 : 0.08,
      envMapIntensity: preset.carbon ? 0.7 : 1.4,
    });
    child.material = Array.isArray(child.material) ? child.material.map(make) : make();
  });
}

/**
 * Walk the loaded car model and report which Tune-tab features actually have
 * a mesh to act on. The Tune UI uses this to hide controls that would do
 * nothing visible (e.g. Hilux has no separable hood/roof/caliper mesh).
 *   { rim, caliper, hood, roof }
 */
export function detectTuneCapabilities(root) {
  const caps = { rim: false, caliper: false, hood: false, roof: false };
  if (!root) return caps;
  root.traverse(child => {
    if (!child.isMesh) return;
    if (!caps.rim     && _isRimMesh(child) && !_matchesAny(child, TYRE_NAME_KW) && !_isCaliperLike(child)) caps.rim = true;
    if (!caps.caliper && _isCaliperLike(child)) caps.caliper = true;
    if (!caps.hood    && _matchesAny(child, HOOD_KW) && !_matchesAny(child, INTERIOR_KW)) caps.hood = true;
    if (!caps.roof    && _matchesAny(child, ROOF_KW) && !_matchesAny(child, INTERIOR_KW)) caps.roof = true;
  });
  return caps;
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

function tireDef(
  fl, fr, rl, rr,
  scale = [0.4, 0.4, 0.4],
  altScale = null,
  defaultRotation = [0, 0, 0],
  altRotation = [0, 0, 0],
) {
  const pos = [fl, fr, rl, rr];
  return {
    defaultScale:     scale,
    defaultPositions: pos,
    defaultRotation,
    altScale:         altScale ?? scale.map((s) => s * 1.05),
    altPositions:     pos,
    altRotation,
  };
}

const PROFILES = {
  honda_civic: {
    // Complete Civic Type-R model: use its own paint, lights, bumpers, and wing.
    // Light detection is now handled by the universal restyleLights function —
    // no per-car cfg needed; paintMaterials below already excludes body panels.
    paintMaterials: ["civictyper_paint"],
    restyleLights: true,
    hideExteriorMods: true,
    tires: tireDef(
      { x: -0.82, y: 0.33, z:  1.28 },
      { x:  0.82, y: 0.33, z:  1.28 },
      { x: -0.82, y: 0.33, z: -1.45 },
      { x:  0.82, y: 0.33, z: -1.45 },
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

  toyota_corolla: {
    // Sketchfab Corolla E170 — one clean paint material across the whole shell.
    // Universal light detector handles head/tail classification automatically.
    paintMaterials: ["e180body"],
    restyleLights: true,
    hideExteriorMods: true,
    tires: tireDef(
      { x: -0.78, y: 0.34, z:  1.30 },
      { x:  0.78, y: 0.34, z:  1.30 },
      { x: -0.78, y: 0.34, z: -1.30 },
      { x:  0.78, y: 0.34, z: -1.30 },
      [0.40, 0.40, 0.40]
    ),
    bumper:  { scale: [1, 1, 1], position: [0, 0.28, 2.20], rotation: [0, 0, 0] },
    xenon:   {
      default:    { scale: [1, 1, 1], pos: [0.74, 0.48, 2.12], rot: [0, 0, 0] },
      civiclight: { scale: [1, 1, 1], pos: [0.74, 0.48, 2.12], rot: [0, Math.PI, 0] },
    },
    backlight: { scale: [1, 1, 1], rightPos: [0.76, 0.48, -2.12], leftPos: [-0.76, 0.48, -2.12], rotation: [0, 0, 0] },
  },

  toyota_hilux: {
    // GTA-sourced model: the entire exterior shell (chassis + 4 doors + boot)
    // uses a single "primary" respray material. Restrict painting to it so the
    // detailed interior / trim does not get tinted body-colour and bleed through
    // the (near-clear) window glass.
    // Universal light detector handles head/tail — paintMaterials["primary"]
    // already prevents body panels from being mis-classified as lamps.
    paintMaterials: ["primary"],
    restyleLights: true,
    hideExteriorMods: true,
    // GLB is authored with the truck facing -Z; flip 180° so the front faces
    // the default +Z camera instead of showing the tailgate on load.
    modelRotationY: Math.PI,
    // Pickup truck — tall stance, large wheels. No modelScale is set because
    // most GLBs export in metres (like civic.glb, which also omits it). If your
    // Hilux loads far larger/smaller than the bumper/light add-on parts, set
    // e.g. modelScale: [0.01, 0.01, 0.01] (cm export) here.
    // NOTE: tyre/light/bumper placement is mostly adaptive (derived from the
    // car's bounding box at runtime); these values are only fallbacks.
    tires: tireDef(
      { x: -0.86, y: 0.46, z:  1.55 },
      { x:  0.86, y: 0.46, z:  1.55 },
      { x: -0.86, y: 0.46, z: -1.55 },
      { x:  0.86, y: 0.46, z: -1.55 },
      [0.46, 0.46, 0.46]
    ),
    bumper:  { scale: [1.1, 1.1, 1.1], position: [0, 0.40, 2.55], rotation: [0, 0, 0] },
    xenon:   {
      default:    { scale: [1.1, 1.1, 1.1], pos: [0.82, 0.70, 2.45], rot: [0, 0, 0] },
      civiclight: { scale: [1.1, 1.1, 1.1], pos: [0.82, 0.70, 2.45], rot: [0, Math.PI, 0] },
    },
    backlight: { scale: [1.1, 1.1, 1.1], rightPos: [0.84, 0.70, -2.45], leftPos: [-0.84, 0.70, -2.45], rotation: [0, 0, 0] },
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
  if (url.includes("/models/toyota/hilux"))   return PROFILES.toyota_hilux;
  if (url.includes("/models/toyota/corolla")) return PROFILES.toyota_corolla;
  if (url.includes("/models/toyota/supra"))   return PROFILES.toyota_supra;
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
