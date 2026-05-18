import { useState } from "react";
import axiosInstance from "@/api/axiosInstance";
import { applyBodyPaint } from "@/lib/carCustomization.js";

const TARGET_KEYWORDS = {
  wheels:       ["tire_", "tyre", "wheel", "rim"],
  bumper_front: ["bumper", "civicfbumper"],
  bumper_rear:  ["bumper_rear", "rear_bumper"],
  lights_front: ["xenon_light", "headlight", "civicrightlight", "civiclight"],
  lights_rear:  ["back_light", "backlight", "taillight", "rearlight"],
  spoiler:      ["spoiler"],
  hood:         ["hood", "bonnet"],
  exhaust:      ["exhaust", "muffler"],
};

function applyMeshChange(carModel, threeJsChange) {
  if (!carModel || !threeJsChange) return;
  const { target_mesh, color_hex, material_properties } = threeJsChange;

  if (target_mesh === "body") {
    if (color_hex) applyBodyPaint(carModel, color_hex);
    return;
  }

  const keywords = TARGET_KEYWORDS[target_mesh] || [target_mesh.replace(/_/g, "")];

  carModel.traverse((child) => {
    if (!child.isMesh || !child.material) return;
    const name = (child.name || "").toLowerCase();
    if (!keywords.some((kw) => name.includes(kw))) return;

    const applyToMat = (mat) => {
      if (!mat) return mat;
      const m = mat.clone();
      if (color_hex) m.color.set(color_hex);
      if (material_properties) {
        if (material_properties.metalness !== undefined) m.metalness = material_properties.metalness;
        if (material_properties.roughness !== undefined) m.roughness = material_properties.roughness;
        if (material_properties.emissiveIntensity !== undefined)
          m.emissiveIntensity = material_properties.emissiveIntensity;
      }
      m.needsUpdate = true;
      return m;
    };

    if (Array.isArray(child.material)) {
      child.material = child.material.map(applyToMat);
    } else {
      child.material = applyToMat(child.material);
    }
  });
}

export function useCarAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastRecommendation, setLastRecommendation] = useState(null);

  const getRecommendation = async ({
    carMake,
    carModel,
    carYear,
    currentColor,
    selectedParts,
    selectedPartCategories,
    userBudgetPKR,
    preferredStyle,
  }) => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await axiosInstance.post("/car-ai", {
        car_make: carMake,
        car_model: carModel,
        car_year: carYear,
        current_color: currentColor,
        selected_parts: selectedParts,
        selected_part_categories: selectedPartCategories || [],
        user_budget_pkr: userBudgetPKR || null,
        preferred_style: preferredStyle || null,
      });
      setLastRecommendation(data);
      return data;
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        "Failed to get recommendation";
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const applyToModel = (carModel, threeJsChange) => {
    applyMeshChange(carModel, threeJsChange);
  };

  return { getRecommendation, applyToModel, loading, error, lastRecommendation };
}
