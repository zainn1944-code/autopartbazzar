import React, { useState } from "react";

const VISUAL_THEMES = {
  Tyres: {
    accent: "#f59e0b",
    glow: "rgba(245, 158, 11, 0.28)",
    label: "Grip ready",
  },
  Bumpers: {
    accent: "#ef4444",
    glow: "rgba(239, 68, 68, 0.28)",
    label: "Body kit",
  },
  Electrical: {
    accent: "#38bdf8",
    glow: "rgba(56, 189, 248, 0.25)",
    label: "Powered part",
  },
  Brakes: {
    accent: "#a855f7",
    glow: "rgba(168, 85, 247, 0.25)",
    label: "Brake system",
  },
  default: {
    accent: "#94a3b8",
    glow: "rgba(148, 163, 184, 0.22)",
    label: "Auto part",
  },
};

const ProductVisual = ({
  name,
  make,
  category,
  imageUrl,
  className = "",
  imageClassName = "",
  compact = false,
}) => {
  const [imageFailed, setImageFailed] = useState(false);
  const theme = VISUAL_THEMES[category] || VISUAL_THEMES.default;
  const showImage = Boolean(imageUrl) && !imageFailed;
  const wrapperClassName = className || "relative h-full w-full overflow-hidden rounded-lg";

  if (showImage) {
    return (
      <img
        src={imageUrl}
        alt={name}
        onError={() => setImageFailed(true)}
        className={
          imageClassName || "h-full w-full object-contain bg-gray-800 p-4"
        }
      />
    );
  }

  return (
    <div
      className={wrapperClassName}
      style={{
        background:
          "linear-gradient(160deg, rgba(30,41,59,1) 0%, rgba(17,24,39,1) 55%, rgba(2,6,23,1) 100%)",
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at top right, ${theme.glow} 0%, transparent 35%), radial-gradient(circle at bottom left, rgba(255,255,255,0.06) 0%, transparent 32%)`,
        }}
      />
      <div className="absolute inset-x-0 top-0 h-px bg-white/15" />
      <div className="relative z-10 flex h-full flex-col justify-between p-4 text-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            {category && (
              <p className="text-xs uppercase tracking-[0.24em] text-white/60">
                {category}
              </p>
            )}
            {make && (
              <p className="mt-1 text-sm font-medium text-white/75">{make}</p>
            )}
          </div>
          <div
            className="h-10 w-10 rounded-full border border-white/10"
            style={{
              background: `linear-gradient(135deg, ${theme.accent}, rgba(15,23,42,0.35))`,
              boxShadow: `0 0 24px ${theme.glow}`,
            }}
          />
        </div>

        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.3em] text-white/50">
            {theme.label}
          </p>
          <h3 className={compact ? "text-sm font-semibold" : "text-lg font-semibold leading-snug"}>
            {name}
          </h3>
          <p className="mt-2 text-xs text-white/55">
            Web-sourced listing with local fallback visual.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProductVisual;
