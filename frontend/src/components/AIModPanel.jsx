import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useCarAI } from "@/hooks/useCarAI.js";

const BUILD_STYLES = ["Sport", "JDM", "Luxury", "Daily Driver", "Track"];

const IMPACT_COLOR = {
  High:   { dot: "bg-red-500",    badge: "border-red-500/30 bg-red-500/10 text-red-400" },
  Medium: { dot: "bg-yellow-400", badge: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400" },
  Low:    { dot: "bg-gray-500",   badge: "border-white/10 bg-white/5 text-gray-500" },
};

const STYLE_ICON = {
  Sport:         "⚡",
  JDM:           "🎌",
  Luxury:        "💎",
  "Daily Driver":"🛣️",
  Track:         "🏁",
};

function Spinner({ size = 16 }) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 24 24" fill="none"
      className="animate-spin"
      style={{ flexShrink: 0 }}
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function SkeletonLine({ w = "full", h = "3" }) {
  return (
    <div
      className={`w-${w} h-${h} rounded-full bg-white/8 animate-pulse`}
      style={{ width: w === "full" ? "100%" : w }}
    />
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="flex items-center justify-between">
        <SkeletonLine w="28" h="2" />
        <SkeletonLine w="16" h="4" />
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-white/5 to-white/15 animate-pulse" />
      </div>
      <div className="space-y-2 pt-1">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center justify-between">
            <SkeletonLine w="40" h="3" />
            <SkeletonLine w="16" h="3" />
          </div>
        ))}
      </div>
    </div>
  );
}

function AnimatedScore({ target, duration = 900 }) {
  const [display, setDisplay] = useState(0);
  const raf = useRef(null);

  useEffect(() => {
    const start = performance.now();
    const from = 0;
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (target - from) * eased));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);

  return display;
}

function ScoreBar({ score }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => setWidth(Math.min(score, 100)), 80);
    return () => clearTimeout(id);
  }, [score]);

  const color =
    score >= 75 ? "from-emerald-600 to-emerald-400" :
    score >= 50 ? "from-yellow-600 to-yellow-400" :
                  "from-red-700 to-red-400";

  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700 ease-out`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">
      {children}
    </p>
  );
}

function Divider() {
  return <div className="h-px w-full bg-white/8" />;
}

function BuildItem({ rec, index, isApplied, isDismissed, onApply, onDismiss }) {
  const priceLabel = rec.price_pkr ? `Rs ${rec.price_pkr.toLocaleString()}` : "—";
  const live = rec.is_live_listing;
  const canApply = !!rec.three_js_change;

  return (
    <div
      className={`rounded-xl border px-3 py-2.5 transition-all ${
        isApplied
          ? "border-emerald-500/30 bg-emerald-500/5"
          : isDismissed
          ? "border-white/5 bg-white/[0.01] opacity-50"
          : "border-white/10 bg-white/[0.03] hover:border-white/20"
      }`}
    >
      <div className="flex items-start gap-2.5">
        <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-white/8 text-[10px] font-bold text-gray-300">
          {index + 1}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-bold leading-snug text-white">{rec.part_name}</p>
            <span className="mt-0.5 shrink-0 rounded-full border border-white/12 bg-white/5 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest text-gray-400">
              {rec.part_category?.replace(/_/g, " ")}
            </span>
          </div>
          {rec.reason && (
            <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-gray-400">{rec.reason}</p>
          )}
          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-white">{priceLabel}</span>
              {live && (
                <span className="flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/8 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest text-emerald-400">
                  <span className="inline-block h-1 w-1 animate-pulse rounded-full bg-emerald-400" />
                  Live
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {rec.product_id && (
                <Link
                  to={`/productdetail/${rec.product_id}`}
                  className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-semibold text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
                >
                  View
                </Link>
              )}
              {!isDismissed && !isApplied && (
                <button
                  onClick={onDismiss}
                  className="rounded-md border border-white/8 px-2 py-1 text-[10px] font-semibold text-gray-500 transition-colors hover:border-white/20 hover:text-gray-300"
                >
                  Skip
                </button>
              )}
              <button
                onClick={onApply}
                disabled={isApplied || !canApply}
                className={`rounded-md px-2.5 py-1 text-[10px] font-bold transition-all ${
                  isApplied
                    ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 cursor-default"
                    : !canApply
                    ? "border border-white/8 bg-white/5 text-gray-600 cursor-not-allowed"
                    : "border border-red-500/35 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                }`}
              >
                {isApplied ? "✓ Applied" : "Apply"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AIModPanel({
  carMake,
  carModel,
  carYear,
  currentColor,
  selectedParts,
  selectedPartCategories,
  onPartApplied,
  carModelRef,
  paintMaterials,
}) {
  const [style, setStyle] = useState("Sport");
  const [budget, setBudget] = useState("");
  const [appliedIds, setAppliedIds] = useState(() => new Set());
  const [dismissedIds, setDismissedIds] = useState(() => new Set());

  const { getRecommendation, applyToModel, trackEvent, loading, error, lastRecommendation } = useCarAI();

  // Reset per-item state whenever a new recommendation arrives.
  useEffect(() => {
    setAppliedIds(new Set());
    setDismissedIds(new Set());
  }, [lastRecommendation?.recommendation_id]);

  const handleGetRecommendation = async () => {
    await getRecommendation({
      carMake,
      carModel,
      carYear,
      currentColor,
      selectedParts,
      selectedPartCategories,
      userBudgetPKR: budget ? parseInt(budget, 10) : null,
      preferredStyle: style,
    });
  };

  const itemKey = (rec, idx) => rec.product_id || `${rec.part_category}-${idx}`;

  const handleApply = (rec, idx) => {
    const key = itemKey(rec, idx);
    if (rec.three_js_change && carModelRef) {
      applyToModel(carModelRef, rec.three_js_change, paintMaterials);
    }
    setAppliedIds(prev => new Set(prev).add(key));
    onPartApplied?.(rec);
    trackEvent({
      recommendationId: lastRecommendation?.recommendation_id,
      event: "applied",
      productId: rec.product_id,
      carMake,
      carModel,
      buildStyle: lastRecommendation?.build_style ?? style,
    });
  };

  const handleDismiss = (rec, idx) => {
    const key = itemKey(rec, idx);
    setDismissedIds(prev => new Set(prev).add(key));
    trackEvent({
      recommendationId: lastRecommendation?.recommendation_id,
      event: "dismissed",
      productId: rec.product_id,
      carMake,
      carModel,
      buildStyle: lastRecommendation?.build_style ?? style,
    });
  };

  const handleApplyAll = () => {
    recommendations.forEach((rec, idx) => {
      const key = itemKey(rec, idx);
      if (appliedIds.has(key) || dismissedIds.has(key)) return;
      handleApply(rec, idx);
    });
  };

  const recommendations = lastRecommendation?.recommendations ?? [];
  const nextSuggestions = lastRecommendation?.next_3_suggestions ?? [];
  const score = lastRecommendation?.build_score ?? 0;
  const compatOk = lastRecommendation?.compatibility_ok !== false;
  const totalCost = lastRecommendation?.total_cost_pkr ?? 0;
  const appliedCount = appliedIds.size;
  const pendingCount = recommendations.filter(
    (r, i) => !appliedIds.has(itemKey(r, i)) && !dismissedIds.has(itemKey(r, i))
  ).length;

  return (
    <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-600/20 text-red-400">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-white">AI Recommendations</h4>
          <p className="text-[10px] text-gray-500">Full build · Live inventory</p>
        </div>
      </div>

      {/* ── Style Selector ──────────────────────────────────────────────── */}
      <div className="mb-4">
        <SectionLabel>Build Style</SectionLabel>
        <div className="flex flex-wrap gap-1.5">
          {BUILD_STYLES.map((s) => (
            <button
              key={s}
              onClick={() => setStyle(s)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all ${
                style === s
                  ? "bg-red-600 text-white shadow-[0_0_14px_rgba(220,38,38,0.35)]"
                  : "border border-white/12 text-gray-400 hover:border-white/25 hover:text-gray-200"
              }`}
            >
              <span>{STYLE_ICON[s]}</span>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* ── Budget ─────────────────────────────────────────────────────── */}
      <div className="mb-5">
        <SectionLabel>Budget (PKR) — Optional</SectionLabel>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500">Rs</span>
          <input
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="e.g. 150,000"
            className="w-full rounded-xl border border-white/10 bg-black/40 py-2.5 pl-8 pr-3 text-sm text-white placeholder-gray-600 outline-none transition-all focus:border-red-500/60 focus:ring-1 focus:ring-red-500/20"
          />
        </div>
      </div>

      {/* ── CTA ────────────────────────────────────────────────────────── */}
      <button
        onClick={handleGetRecommendation}
        disabled={loading}
        className="mb-5 flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-red-600 to-red-500 py-3.5 text-sm font-bold tracking-wide text-white shadow-[0_0_24px_rgba(220,38,38,0.25)] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_32px_rgba(220,38,38,0.4)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
      >
        {loading ? (
          <>
            <Spinner size={15} />
            <span>Building your full kit…</span>
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            {recommendations.length > 0 ? "Get a New Build" : "Get AI Build"}
          </>
        )}
      </button>

      {/* ── Loading Skeleton ────────────────────────────────────────────── */}
      {loading && <LoadingSkeleton />}

      {/* ── Error ──────────────────────────────────────────────────────── */}
      {!loading && error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/8 p-4">
          <div className="mb-2 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="text-red-400 shrink-0">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-xs font-semibold text-red-400">Recommendation failed</p>
          </div>
          <p className="mb-3 text-xs leading-relaxed text-red-300/80">{error}</p>
          <button
            onClick={handleGetRecommendation}
            className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/20"
          >
            Try Again
          </button>
        </div>
      )}

      {/* ── Result Card ────────────────────────────────────────────────── */}
      {!loading && lastRecommendation && recommendations.length > 0 && (
        <div className="space-y-0 overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm">

          {/* Build Score Header */}
          <div className="px-4 pt-4 pb-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-white tabular-nums">
                  <AnimatedScore target={score} />
                </span>
                <span className="text-sm text-gray-500">/100</span>
              </div>
              <div className="flex items-center gap-2">
                {compatOk ? (
                  <span className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Compatible
                  </span>
                ) : (
                  <span className="flex items-center gap-1 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-yellow-400">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-yellow-400" />
                    Check Fit
                  </span>
                )}
                <span className="rounded-full border border-red-500/25 bg-red-500/8 px-2.5 py-0.5 text-[10px] font-semibold text-red-400">
                  {lastRecommendation.build_style}
                </span>
              </div>
            </div>
            <ScoreBar score={score} />
            <div className="mt-1.5 flex items-center justify-between text-[10px] text-gray-600">
              <span>Build Score</span>
              <span>
                {appliedCount}/{recommendations.length} applied · Rs {totalCost.toLocaleString()}
              </span>
            </div>
          </div>

          <Divider />

          {/* Build List */}
          <div className="space-y-2 px-4 py-3">
            <div className="flex items-center justify-between">
              <SectionLabel>Recommended Build</SectionLabel>
              {pendingCount > 1 && (
                <button
                  onClick={handleApplyAll}
                  className="rounded-md border border-red-500/35 bg-red-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-red-300 transition-colors hover:bg-red-500/20"
                >
                  Apply All ({pendingCount})
                </button>
              )}
            </div>
            {recommendations.map((rec, idx) => {
              const key = itemKey(rec, idx);
              return (
                <BuildItem
                  key={key}
                  rec={rec}
                  index={idx}
                  isApplied={appliedIds.has(key)}
                  isDismissed={dismissedIds.has(key)}
                  onApply={() => handleApply(rec, idx)}
                  onDismiss={() => handleDismiss(rec, idx)}
                />
              );
            })}
          </div>

          {/* Next suggestions — clickable */}
          {nextSuggestions.length > 0 && (
            <>
              <Divider />
              <div className="px-4 py-3">
                <SectionLabel>Consider Next</SectionLabel>
                <div className="space-y-1.5">
                  {nextSuggestions.map((s, i) => {
                    const ic = IMPACT_COLOR[s.impact] ?? IMPACT_COLOR.Low;
                    const content = (
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${ic.dot}`} />
                          <span className="truncate text-xs text-gray-300">{s.part}</span>
                          {s.price_pkr && (
                            <span className="text-[10px] text-gray-500">Rs {s.price_pkr.toLocaleString()}</span>
                          )}
                        </div>
                        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${ic.badge}`}>
                          {s.impact}
                        </span>
                      </div>
                    );
                    return s.product_id ? (
                      <Link
                        key={i}
                        to={`/productdetail/${s.product_id}`}
                        className="block rounded-lg border border-transparent px-2 py-1.5 transition-colors hover:border-white/10 hover:bg-white/5"
                      >
                        {content}
                      </Link>
                    ) : (
                      <div key={i} className="px-2 py-1.5">
                        {content}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Compatibility / budget warning */}
          {lastRecommendation.warning &&
            lastRecommendation.warning !== "null" &&
            lastRecommendation.warning !== null && (
              <>
                <Divider />
                <div className="flex items-start gap-2 px-4 py-3">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="mt-0.5 shrink-0 text-yellow-400">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <p className="text-xs leading-relaxed text-yellow-400/90">
                    {lastRecommendation.warning}
                  </p>
                </div>
              </>
            )}
        </div>
      )}
    </div>
  );
}
