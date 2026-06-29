import hashlib
import json
import re
import time
import uuid

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from config import get_settings
from database import get_db
from models.ai_event import AIRecommendationEvent
from models.product import Product
from services.jwt_tokens import decode_token

router = APIRouter(prefix="/car-ai", tags=["car-ai"])
security = HTTPBearer(auto_error=False)

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "google/gemma-3-27b-it"

CACHE_TTL_SECONDS = 600  # 10 minutes
CACHE_MAX_ENTRIES = 256
BUDGET_HEADROOM = 1.05  # allow 5% overshoot before trimming

VALID_EVENTS = {"applied", "dismissed", "viewed"}

SYSTEM_PROMPT = """\
You are an expert car modification AI for AutoPartBazaar, a Pakistani car parts marketplace.

Rules:
- Produce a COMPLETE build: 5-8 recommendations in priority order (most impactful first).
- Each recommendation covers a DIFFERENT part_category. Never repeat a category.
- Skip any category already in the user's "Applied categories" list.
- Prioritise candidates with stock_quantity > 0, is_live_listing = true, and sale = true (in that order).
- Only use product_ids from the inventory candidates list. Set product_id to null if no candidate fits.
- total_cost_pkr is the running sum of ALL applied parts PLUS every recommendation in this build.
- If the user's budget is set, total_cost_pkr MUST stay within budget. Drop lower-priority items if needed.
- build_score reflects the overall build quality (0-100): start at 40 for a stock car, add points for each recommendation.
- compatibility_ok must be false (with a non-null warning) if any part is known incompatible with the car make/year.
- warning must be null when compatibility_ok is true.
- Respond ONLY with valid JSON. No markdown, no code fences, no preamble, no trailing text.

Return exactly this schema (no extra keys):
{
  "recommendations": [
    {
      "product_id": "<candidate product_id or null>",
      "part_category": "color | tyres | rims | front_bumper | rear_bumper | front_lights | rear_lights | spoiler | body_kit | window_tint | exhaust | hood | suspension",
      "part_name": "<specific product name>",
      "reason": "<one sentence: why this part fits the build and style>",
      "price_pkr": 45000,
      "price_usd": 161,
      "priority": 1,
      "three_js_change": {
        "type": "color_change | mesh_swap | material_change",
        "target_mesh": "body | wheels | bumper_front | bumper_rear | lights_front | lights_rear | spoiler | hood | exhaust",
        "color_hex": "#RRGGBB or null",
        "material_properties": { "metalness": 0.8, "roughness": 0.2 }
      }
    }
  ],
  "build_score": 72,
  "build_style": "Sport | JDM | Luxury | Daily Driver | Track",
  "total_cost_pkr": 125000,
  "next_3_suggestions": [
    { "product_id": "<candidate product_id or null>", "part": "<part name>", "category": "<category>", "impact": "High | Medium | Low", "price_pkr": 18000 }
  ],
  "compatibility_ok": true,
  "warning": null
}
"""

FRONTEND_CATEGORY_TO_AI = {
    "frontbumpers": "front_bumper",
    "frontlights": "front_lights",
    "rearlights": "rear_lights",
    "tyres": "tyres",
}


class CarAIRequest(BaseModel):
    car_make: str
    car_model: str
    car_year: int
    current_color: str
    selected_parts: list[str] = []
    selected_part_categories: list[str] = []
    user_budget_pkr: int | None = None
    preferred_style: str | None = None


class CarAITrackRequest(BaseModel):
    recommendation_id: str
    event: str
    product_id: str | None = None
    car_make: str | None = None
    car_model: str | None = None
    build_style: str | None = None


# ── In-process response cache ─────────────────────────────────────────────────
# Keyed on (car, style, budget bucket, applied parts/categories). 10-minute TTL.
# Bounded to CACHE_MAX_ENTRIES to keep memory predictable; oldest entries are
# evicted when full. Same instance survives across requests inside one worker.
_response_cache: dict[str, tuple[float, dict]] = {}


def _cache_key(body: CarAIRequest) -> str:
    budget_bucket = (body.user_budget_pkr // 10_000) if body.user_budget_pkr else None
    payload = {
        "make": body.car_make.strip().lower(),
        "model": body.car_model.strip().lower(),
        "year": body.car_year,
        "color": (body.current_color or "").lower(),
        "parts": sorted(p.lower() for p in body.selected_parts),
        "cats": sorted(c.lower() for c in body.selected_part_categories),
        "budget": budget_bucket,
        "style": (body.preferred_style or "").lower(),
    }
    encoded = json.dumps(payload, sort_keys=True).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def _cache_get(key: str) -> dict | None:
    entry = _response_cache.get(key)
    if entry is None:
        return None
    expires_at, value = entry
    if expires_at < time.monotonic():
        _response_cache.pop(key, None)
        return None
    return value


def _cache_set(key: str, value: dict) -> None:
    if len(_response_cache) >= CACHE_MAX_ENTRIES:
        # Drop the oldest entry to keep the cache bounded.
        oldest_key = min(_response_cache, key=lambda k: _response_cache[k][0])
        _response_cache.pop(oldest_key, None)
    _response_cache[key] = (time.monotonic() + CACHE_TTL_SECONDS, value)


def _extract_json(text: str) -> dict:
    text = text.strip()
    fenced = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if fenced:
        text = fenced.group(1)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    block = re.search(r"\{.*\}", text, re.DOTALL)
    if block:
        return json.loads(block.group())
    raise ValueError("No JSON object found in model response")


def _map_inventory_part_category(product: Product) -> str:
    text = f"{product.category or ''} {product.name or ''}".lower()
    if any(keyword in text for keyword in ("rim", "alloy wheel")):
        return "rims"
    if any(keyword in text for keyword in ("tyre", "tire", "wheel")):
        return "tyres"
    if any(keyword in text for keyword in ("tail light", "taillight", "rear light")):
        return "rear_lights"
    if any(keyword in text for keyword in ("headlight", "fog light", "front light", "lamp", "led")):
        return "front_lights"
    if any(keyword in text for keyword in ("bumper", "grille", "splitter", "lip")):
        return "front_bumper"
    if any(keyword in text for keyword in ("exhaust", "muffler")):
        return "exhaust"
    if any(keyword in text for keyword in ("hood", "bonnet")):
        return "hood"
    if any(keyword in text for keyword in ("suspension", "coilover", "shock")):
        return "suspension"
    return "body_kit"


def _normalize_selected_categories(categories: list[str]) -> set[str]:
    normalized: set[str] = set()
    for category in categories:
        cleaned = re.sub(r"[^a-z]", "", category.lower())
        normalized.add(FRONTEND_CATEGORY_TO_AI.get(cleaned, cleaned))
    return normalized


async def _load_inventory_candidates(db: AsyncSession, body: CarAIRequest) -> list[dict]:
    make_value = body.car_make.strip()
    # Cast a wider net (60) when a budget is set so the post-budget filter still
    # has enough variety to return a complete build.
    fetch_limit = 60 if body.user_budget_pkr else 36
    stmt = (
        select(Product)
        .where(
            or_(
                Product.make.ilike(make_value),
                Product.make.is_(None),
                Product.make == "",
                Product.make.ilike("%universal%"),
            )
        )
        .order_by(Product.stock_quantity.desc(), Product.is_live_listing.desc(), Product.sale.desc(), Product.id.desc())
        .limit(fetch_limit)
    )
    rows = (await db.execute(stmt)).scalars().all()

    selected_categories = _normalize_selected_categories(body.selected_part_categories)
    budget_ceiling = body.user_budget_pkr * BUDGET_HEADROOM if body.user_budget_pkr else None

    candidates: list[dict] = []
    for product in rows:
        # Hard budget pre-filter: a single part costing more than the entire
        # budget can never appear in a valid full build.
        if budget_ceiling is not None and product.price > budget_ceiling:
            continue

        mapped_category = _map_inventory_part_category(product)
        candidates.append(
            {
                "product_id": product.product_id,
                "name": product.name,
                "category": product.category,
                "mapped_part_category": mapped_category,
                "price_pkr": round(product.price),
                "sale": product.sale,
                "stock_quantity": product.stock_quantity,
                "make": product.make,
                "source_name": product.source_name,
                "source_url": product.source_url,
                "is_live_listing": product.is_live_listing,
                "score": (
                    (20 if product.stock_quantity > 0 else 0)
                    + (12 if product.is_live_listing else 0)
                    + (8 if product.sale else 0)
                    + (6 if mapped_category not in selected_categories else 0)
                    + (4 if body.user_budget_pkr and product.price <= body.user_budget_pkr else 0)
                ),
            }
        )

    candidates.sort(key=lambda item: (item["score"], item["stock_quantity"], item["price_pkr"] > 0), reverse=True)
    return candidates[:20]


def _enforce_budget(result: dict, budget_pkr: int | None) -> dict:
    """Drop the lowest-priority recommendations until total fits the budget."""
    if not budget_pkr:
        return result

    recs = result.get("recommendations") or []
    if not recs:
        return result

    ceiling = budget_pkr * BUDGET_HEADROOM

    def _running_total() -> float:
        return sum(float(r.get("price_pkr") or 0) for r in recs)

    if _running_total() <= ceiling:
        return result

    # Sort once by priority ascending → drop highest priority numbers (lowest impact) first.
    recs.sort(key=lambda r: r.get("priority") if isinstance(r.get("priority"), int) else 99)
    while recs and _running_total() > ceiling:
        recs.pop()  # remove tail = lowest priority

    result["recommendations"] = recs
    result["total_cost_pkr"] = round(_running_total())
    if "warning" not in result or not result.get("warning"):
        result["warning"] = f"Build trimmed to fit your PKR {budget_pkr:,} budget."
    return result


def _enrich_with_inventory(result: dict, candidates: list[dict], settings) -> dict:
    """Replace LLM-stated fields with real inventory data wherever a product_id matches."""
    candidate_map = {c["product_id"]: c for c in candidates}
    recs = result.get("recommendations") or []

    enriched_recs = []
    total = 0.0
    for rec in recs:
        picked_id = str(rec.get("product_id") or "").strip()
        matched = candidate_map.get(picked_id)

        if matched:
            rec["product_id"] = matched["product_id"]
            rec["part_name"] = matched["name"]
            rec["part_category"] = matched["mapped_part_category"]
            rec["price_pkr"] = matched["price_pkr"]
            rec["price_usd"] = round(matched["price_pkr"] / settings.usd_to_pkr_rate, 2)
            rec["source_name"] = matched["source_name"]
            rec["source_url"] = matched["source_url"]
            rec["stock_quantity"] = matched["stock_quantity"]
            rec["is_live_listing"] = matched["is_live_listing"]
        else:
            rec["product_id"] = None
            rec.setdefault("source_name", None)
            rec.setdefault("source_url", None)
            rec.setdefault("stock_quantity", 0)
            rec.setdefault("is_live_listing", False)

        enriched_recs.append(rec)
        total += float(rec.get("price_pkr") or 0)

    result["recommendations"] = enriched_recs

    # Recompute total_cost from enriched prices so it always reflects real inventory.
    if enriched_recs:
        result["total_cost_pkr"] = round(total)

    # Enrich next_3_suggestions: attach product_id/price/source where possible.
    next_3 = result.get("next_3_suggestions") or []
    used_ids = {r.get("product_id") for r in enriched_recs if r.get("product_id")}
    enriched_next: list[dict] = []
    for suggestion in next_3:
        sid = str(suggestion.get("product_id") or "").strip()
        matched = candidate_map.get(sid)
        if not matched:
            # Try to find a candidate matching the suggested category that isn't already used.
            target_cat = (suggestion.get("category") or "").lower()
            for c in candidates:
                if c["product_id"] in used_ids:
                    continue
                if c["mapped_part_category"] == target_cat:
                    matched = c
                    break
        if matched:
            suggestion["product_id"] = matched["product_id"]
            suggestion["part"] = matched["name"]
            suggestion["category"] = matched["mapped_part_category"]
            suggestion["price_pkr"] = matched["price_pkr"]
            suggestion["source_name"] = matched["source_name"]
            suggestion["source_url"] = matched["source_url"]
            suggestion["stock_quantity"] = matched["stock_quantity"]
            suggestion.setdefault("impact", "Medium")
            used_ids.add(matched["product_id"])
        else:
            suggestion["product_id"] = None
            suggestion.setdefault("price_pkr", None)
            suggestion.setdefault("source_name", None)
            suggestion.setdefault("source_url", None)
            suggestion.setdefault("stock_quantity", 0)
            suggestion.setdefault("impact", "Low")
        enriched_next.append(suggestion)
    result["next_3_suggestions"] = enriched_next

    # Compatibility defaults.
    result.setdefault("compatibility_ok", True)
    result.setdefault("warning", None)

    # Expose the top candidates so the frontend can show alternatives later if it wants.
    result["inventory_matches"] = candidates[:5]
    return result


@router.post("")
async def get_car_recommendation(
    request: Request,
    body: CarAIRequest,
    db: AsyncSession = Depends(get_db),
):
    settings = get_settings()
    if not settings.gemma_api_key:
        raise HTTPException(
            status_code=503,
            detail="AI service not configured - add GEMMA_API_KEY to backend/.env",
        )

    cache_key = _cache_key(body)
    cached = _cache_get(cache_key)
    if cached is not None:
        # Issue a fresh recommendation_id so apply/dismiss telemetry stays unique
        # per click even when the underlying build is cached.
        cached_copy = dict(cached)
        cached_copy["recommendation_id"] = uuid.uuid4().hex
        cached_copy["cached"] = True
        return cached_copy

    candidate_products = await _load_inventory_candidates(db, body)
    user_message = (
        f"Car: {body.car_make} {body.car_model} {body.car_year}\n"
        f"Current color: {body.current_color}\n"
        f"Applied parts: {', '.join(body.selected_parts) if body.selected_parts else 'None'}\n"
        f"Applied categories: {', '.join(body.selected_part_categories) if body.selected_part_categories else 'None'}\n"
        f"Budget: PKR {body.user_budget_pkr or 'not specified'}\n"
        f"Style preference: {body.preferred_style or 'not specified'}\n\n"
        "Inventory candidates (pick 5-8 different categories, copy product_id exactly):\n"
        f"{json.dumps(candidate_products, ensure_ascii=True)}\n\n"
        "Reply with JSON only - no other text."
    )

    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        "max_tokens": 2000,
        "temperature": 0.3,
    }

    headers = {
        "Authorization": f"Bearer {settings.gemma_api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": str(request.base_url).rstrip("/"),
        "X-Title": "AutoPartBazaar",
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(OPENROUTER_URL, headers=headers, json=payload)

    resp_json = resp.json()

    if resp.status_code != 200 or "choices" not in resp_json:
        err_msg = (
            resp_json.get("error", {}).get("message")
            or resp_json.get("message")
            or f"HTTP {resp.status_code} — response: {resp.text[:300]}"
        )
        raise HTTPException(status_code=502, detail=f"OpenRouter error: {err_msg}")

    choices = resp_json.get("choices") or []
    if not choices:
        raise HTTPException(status_code=502, detail="OpenRouter returned an empty choices list")

    raw = choices[0]["message"]["content"]

    try:
        result = _extract_json(raw)
    except (json.JSONDecodeError, ValueError) as exc:
        raise HTTPException(status_code=502, detail="AI returned malformed JSON") from exc

    # If the model accidentally returned the old single-recommendation shape,
    # promote it into a one-element recommendations array so the rest of the
    # pipeline stays uniform.
    if "recommendations" not in result and "recommendation" in result:
        result["recommendations"] = [result.pop("recommendation")]

    result = _enrich_with_inventory(result, candidate_products, settings)
    result = _enforce_budget(result, body.user_budget_pkr)

    result["recommendation_id"] = uuid.uuid4().hex
    result["cached"] = False

    # Cache before issuing recommendation_id so each call gets a fresh one.
    cacheable = {k: v for k, v in result.items() if k != "recommendation_id"}
    _cache_set(cache_key, cacheable)

    return result


@router.post("/track", status_code=204)
async def track_recommendation_event(
    body: CarAITrackRequest,
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: AsyncSession = Depends(get_db),
):
    if body.event not in VALID_EVENTS:
        raise HTTPException(
            status_code=400,
            detail=f"event must be one of {sorted(VALID_EVENTS)}",
        )

    user_id: int | None = None
    if credentials and credentials.credentials:
        payload = decode_token(credentials.credentials)
        if payload and payload.sub:
            try:
                user_id = int(payload.sub)
            except ValueError:
                user_id = None

    event = AIRecommendationEvent(
        recommendation_id=body.recommendation_id,
        user_id=user_id,
        product_id=body.product_id,
        event=body.event,
        car_make=body.car_make,
        car_model=body.car_model,
        build_style=body.build_style,
    )
    db.add(event)
    await db.commit()
    return None
