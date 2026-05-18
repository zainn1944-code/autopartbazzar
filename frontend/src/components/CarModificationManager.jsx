import { useEffect } from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import {
  makeCenteredGroup,
  adaptiveWheelPositions,
  adaptiveBumperPos,
  adaptiveLightPositions,
  removeAttachedParts,
  enhanceTailLightEmissive,
  getCustomizationProfile,
} from "@/lib/carCustomization.js";

// Re-export so Garage.jsx can import from one consistent source
export {
  makeCenteredGroup,
  adaptiveWheelPositions,
  adaptiveBumperPos,
  adaptiveLightPositions,
};

// ─── Modification appliers ────────────────────────────────────────────────────

function applyTires(carModel, carBox, profile, tireModelPath) {
  const tp       = profile.tires;
  const useAlt   = tireModelPath.includes("tire1.glb");
  const scaleArr = useAlt ? tp.altScale      : tp.defaultScale;
  const profPos  = useAlt ? tp.altPositions  : tp.defaultPositions;
  const rotArr   = useAlt ? tp.altRotation   : tp.defaultRotation;
  const wheelY   = profPos[0].y;

  new GLTFLoader().load(tireModelPath, (gltf) => {
    const tireModel = gltf.scene;
    tireModel.scale.set(scaleArr[0], scaleArr[1], scaleArr[2]);
    const tireGroup = makeCenteredGroup(tireModel);

    const positions = carBox ? adaptiveWheelPositions(carBox, wheelY) : profPos;

    removeAttachedParts(carModel, (n) => n.includes("tire") || n.includes("wheel") || n.includes("rim"));

    positions.forEach((pos, i) => {
      const clone = tireGroup.clone(true);
      clone.position.set(pos.x, pos.y, pos.z);
      clone.rotation.set(rotArr[0], rotArr[1], rotArr[2]);
      clone.name = `tire_${i}`;
      carModel.add(clone);
    });
  });
}

function applyBumper(carModel, carBox, profile, bumperModelPath) {
  const bp  = profile.bumper;
  const pos = carBox ? adaptiveBumperPos(carBox, bp.position) : bp.position;

  new GLTFLoader().load(bumperModelPath, (gltf) => {
    const bumperModel = gltf.scene;
    bumperModel.scale.set(bp.scale[0], bp.scale[1], bp.scale[2]);
    const group = makeCenteredGroup(bumperModel);
    group.position.set(pos[0], pos[1], pos[2]);
    group.rotation.set(bp.rotation[0], bp.rotation[1], bp.rotation[2]);
    const old = carModel.getObjectByName("bumper");
    if (old) carModel.remove(old);
    group.name = "bumper";
    carModel.add(group);
  });
}

function applyFrontLights(carModel, carBox, profile, modelPath) {
  const preset = modelPath.includes("civiclight.glb")
    ? profile.xenon.civiclight
    : profile.xenon.default;
  const aPos = carBox
    ? adaptiveLightPositions(carBox, preset.pos[1], preset.pos[0])
    : null;
  const xPos = aPos ? aPos.xenonPos : preset.pos;
  const xRot = aPos ? aPos.xenonRot : preset.rot;

  new GLTFLoader().load(modelPath, (gltf) => {
    const rightScene = gltf.scene;
    rightScene.scale.set(preset.scale[0], preset.scale[1], preset.scale[2]);

    const rightGroup = makeCenteredGroup(rightScene);
    rightGroup.position.set( xPos[0], xPos[1], xPos[2]);
    rightGroup.rotation.set( xRot[0], xRot[1], xRot[2]);
    rightGroup.name = "xenon_light_right";

    const leftGroup = rightGroup.clone(true);
    leftGroup.position.set(-xPos[0], xPos[1], xPos[2]);
    leftGroup.rotation.set( xRot[0], -xRot[1], xRot[2]);
    leftGroup.name = "xenon_light_left";

    removeAttachedParts(carModel, (n) => n === "xenon_light_right" || n === "xenon_light_left");
    carModel.add(rightGroup);
    carModel.add(leftGroup);
  });
}

function applyRearLights(carModel, carBox, profile, modelPath) {
  const cfg  = profile.backlight;
  const aPos = carBox
    ? adaptiveLightPositions(carBox, cfg.rightPos[1], Math.abs(cfg.rightPos[0]))
    : null;
  const rPos = aPos ? aPos.rLightRPos : cfg.rightPos;
  const lPos = aPos ? aPos.rLightLPos : cfg.leftPos;
  const rot  = aPos ? aPos.lightRot   : cfg.rotation;

  new GLTFLoader().load(modelPath, (gltf) => {
    removeAttachedParts(carModel, (n) => n.includes("back_light"));

    [
      { scene: gltf.scene.clone(true), pos: rPos, name: "back_light_right" },
      { scene: gltf.scene.clone(true), pos: lPos, name: "back_light_left"  },
    ].forEach(({ scene, pos, name }) => {
      scene.scale.set(cfg.scale[0], cfg.scale[1], cfg.scale[2]);
      const group = makeCenteredGroup(scene);
      group.position.set(pos[0], pos[1], pos[2]);
      group.rotation.set(rot[0], rot[1], rot[2]);
      group.name = name;
      enhanceTailLightEmissive(group);
      carModel.add(group);
    });
  });
}

// ─── React component ──────────────────────────────────────────────────────────

export default function CarModificationManager({ carModel, carBox, selectedParts, carMake, modelUrl }) {
  const profile = getCustomizationProfile(carMake, modelUrl);

  useEffect(() => {
    if (carModel && selectedParts.tyres?.model)
      applyTires(carModel, carBox, profile, selectedParts.tyres.model);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carModel, carBox, selectedParts.tyres]);

  useEffect(() => {
    if (carModel && selectedParts.frontBumpers?.model)
      applyBumper(carModel, carBox, profile, selectedParts.frontBumpers.model);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carModel, carBox, selectedParts.frontBumpers]);

  useEffect(() => {
    if (carModel && selectedParts.frontLights?.model)
      applyFrontLights(carModel, carBox, profile, selectedParts.frontLights.model);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carModel, carBox, selectedParts.frontLights]);

  useEffect(() => {
    if (carModel && selectedParts.rearLights?.model)
      applyRearLights(carModel, carBox, profile, selectedParts.rearLights.model);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carModel, carBox, selectedParts.rearLights]);

  return null;
}
