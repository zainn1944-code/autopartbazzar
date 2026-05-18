import json
import re

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from config import get_settings
from database import get_db
from models.product import Product

router = APIRouter(prefix="/car-ai", tags=["car-ai"])

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "google/gemma-3-27b-it"

SYSTEM_PROMPT = """\
You are an expert car modification AI for AutoPartBazaar, a Pakistani car parts marketplace.

Rules:
- Pick the single BEST next modification from the inventory candidates list when one fits.
- Prioritise candidates with stock_quantity > 0, is_live_listing = true, and sale = true (in that order).
- Do NOT suggest a part that is already in the user's "Applied parts" list.
- build_score reflects the overall quality of the current build (0-100): start at 40 for a stock car, add points for each meaningful upgrade.
- total_cost_pkr is the running sum of ALL applied parts plus this recommendation.
- compatibility_ok must be false (with a non-null warning) if the part is known to be incompatible with the car make/year.
- warning must be null when compatibility_ok is true.
- Respond ONLY with valid JSON. No markdown, no code fences, no preamble, no trailing text.

Return exactly this schema (no extra keys):
{
  "recommendation": {
    "product_id": "<candidate product_id or null>",
    "part_category": "color | tyres | rims | front_bumper | rear_bumper | front_lights | rear_lights | spoiler | body_kit | window_tint | exhaust | hood | suspension",
    "part_name": "<specific product name>",
    "reason": "<one sentence: why this part fits the build and style>",
    "price_pkr": 45000,
    "price_usd": 161,
    "three_js_change": {
      "type": "color_change | mesh_swap | material_change",
      "target_mesh": "body | wheels | bumper_front | bumper_rear | lights_front | lights_rear | spoiler | hood | exhaust",
      "color_hex": "#RRGGBB or null",
      "material_properties": { "metalness": 0.8, "roughness": 0.2 }
    }
  },
  "build_score": 72,
  "build_style": "Sport | JDM | Luxury | Daily Driver | Track",
  "total_cost_pkr": 125000,
  "next_3_suggestions": [
    { "part": "<part name>", "category": "<category>", "impact": "High | Medium | Low" }
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
        .limit(36)
    )
    rows = (await db.execute(stmt)).scalars().all()

    selected_categories = _normalize_selected_categories(body.selected_part_categories)
    candidates: list[dict] = []
    for product in rows:
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
    return candidates[:12]


def _merge_inventory_match(result: dict, candidates: list[dict], settings) -> dict:
    recommendation = result.setdefault("recommendation", {})
    candidate_map = {candidate["product_id"]: candidate for candidate in candidates}
    picked_product_id = str(recommendation.get("product_id") or "").strip()
    matched = candidate_map.get(picked_product_id)

    if matched:
        recommendation["product_id"] = matched["product_id"]
        recommendation["part_name"] = matched["name"]
        recommendation["part_category"] = matched["mapped_part_category"]
        recommendation["price_pkr"] = matched["price_pkr"]
        recommendation["price_usd"] = round(matched["price_pkr"] / settings.usd_to_pkr_rate, 2)
        recommendation["source_name"] = matched["source_name"]
        recommendation["source_url"] = matched["source_url"]
        recommendation["stock_quantity"] = matched["stock_quantity"]
        recommendation["is_live_listing"] = matched["is_live_listing"]
    else:
        recommendation["product_id"] = None
        recommendation.setdefault("source_name", None)
        recommendation.setdefault("source_url", None)
        recommendation.setdefault("stock_quantity", 0)
        recommendation.setdefault("is_live_listing", False)

    # Sync total_cost_pkr with the matched price when AI leaves it at 0 or null
    if matched and not result.get("total_cost_pkr"):
        result["total_cost_pkr"] = matched["price_pkr"]

    # Ensure compatibility fields always present
    result.setdefault("compatibility_ok", True)
    result.setdefault("warning", None)

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

    candidate_products = await _load_inventory_candidates(db, body)
    user_message = (
        f"Car: {body.car_make} {body.car_model} {body.car_year}\n"
        f"Current color: {body.current_color}\n"
        f"Applied parts: {', '.join(body.selected_parts) if body.selected_parts else 'None'}\n"
        f"Applied categories: {', '.join(body.selected_part_categories) if body.selected_part_categories else 'None'}\n"
        f"Budget: PKR {body.user_budget_pkr or 'not specified'}\n"
        f"Style preference: {body.preferred_style or 'not specified'}\n\n"
        "Inventory candidates (prefer one of these and copy its product_id exactly if it fits):\n"
        f"{json.dumps(candidate_products, ensure_ascii=True)}\n\n"
        "Reply with JSON only - no other text."
    )

    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        "max_tokens": 1200,
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

    return _merge_inventory_match(result, candidate_products, settings)
