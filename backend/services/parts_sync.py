from __future__ import annotations

import asyncio
import json
import logging
import re
import uuid
from copy import deepcopy
from dataclasses import dataclass
from datetime import datetime, timezone
from urllib.parse import urljoin, urlparse

import httpx
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import and_, or_, select

from config import get_settings
from database import AsyncSessionLocal
from models.product import Product

try:
    from bs4 import BeautifulSoup
except ImportError:  # pragma: no cover - optional dependency fallback
    BeautifulSoup = None

logger = logging.getLogger(__name__)

_scheduler: AsyncIOScheduler | None = None
_last_sync_report: dict = {
    "status": "idle",
    "triggeredBy": None,
    "syncedAt": None,
    "feeds": [],
    "created": 0,
    "updated": 0,
    "skipped": 0,
    "errors": [],
}


@dataclass(slots=True)
class FeedSource:
    name: str
    url: str


def _set_last_sync_report(report: dict) -> dict:
    global _last_sync_report
    _last_sync_report = deepcopy(report)
    return deepcopy(_last_sync_report)


def get_last_sync_report() -> dict:
    return deepcopy(_last_sync_report)


def _derive_source_name(url: str) -> str:
    host = urlparse(url).netloc.lower().replace("www.", "")
    if not host:
        return "Remote Feed"
    label = host.split(":")[0].split(".")[0].replace("-", " ").strip()
    return label.title() if label else "Remote Feed"


def _parse_feed_sources(raw: str | None) -> list[FeedSource]:
    if not raw:
        return []

    feeds: list[FeedSource] = []
    for chunk in raw.split(","):
        entry = chunk.strip()
        if not entry:
            continue
        if "|" in entry:
            name, url = entry.split("|", 1)
            source_name = name.strip() or _derive_source_name(url.strip())
            source_url = url.strip()
        else:
            source_url = entry
            source_name = _derive_source_name(entry)
        if source_url:
            feeds.append(FeedSource(name=source_name, url=source_url))
    return feeds


def _pick_first(*values):
    for value in values:
        if value is None:
            continue
        if isinstance(value, str):
            text = value.strip()
            if text:
                return text
            continue
        if isinstance(value, (list, tuple)):
            for item in value:
                picked = _pick_first(item)
                if picked is not None:
                    return picked
            continue
        return value
    return None


def _to_float(value) -> float | None:
    if value in (None, "", False):
        return None
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        cleaned = re.sub(r"[^\d.\-]", "", value)
        if cleaned in {"", "-", ".", "-."}:
            return None
        try:
            return float(cleaned)
        except ValueError:
            return None
    return None


def _to_int(value, default: int = 0) -> int:
    number = _to_float(value)
    if number is None:
        return default
    return max(default, int(number))


def _to_bool(value, default: bool = False) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return value != 0
    if isinstance(value, str):
        return value.strip().lower() in {"1", "true", "yes", "y", "on", "available", "in_stock"}
    return default


def _normalize_whitespace(value: str | None) -> str | None:
    if value is None:
        return None
    if isinstance(value, dict):
        value = _pick_first(value.get("name"), value.get("url"), value.get("@id"), value.get("value"))
    elif isinstance(value, (list, tuple)):
        value = _pick_first(*value)
    elif not isinstance(value, str):
        value = str(value)
    if value is None:
        return None
    text = re.sub(r"\s+", " ", value).strip()
    return text or None


def _guess_category(*text_values: str | None) -> str:
    haystack = " ".join(filter(None, (_normalize_whitespace(v) for v in text_values))).lower()
    keyword_map = {
        "Tyres": ("tyre", "tire", "wheel", "rim"),
        "Bumpers": ("bumper", "grille", "splitter", "lip"),
        "Electrical": ("headlight", "tail light", "taillight", "fog light", "light", "lamp", "led"),
        "Brakes": ("brake", "rotor", "disc", "caliper", "pad"),
        "Filters": ("filter", "air intake", "oil filter", "cabin filter"),
        "Engine": ("engine", "turbo", "exhaust", "radiator", "suspension", "muffler"),
    }
    for category, keywords in keyword_map.items():
        if any(keyword in haystack for keyword in keywords):
            return category
    return "Accessories"


def _guess_make(*text_values: str | None) -> str | None:
    haystack = " ".join(filter(None, (_normalize_whitespace(v) for v in text_values))).lower()
    for make in ("Honda", "Toyota", "BMW", "Lamborghini", "Suzuki", "Kia", "Hyundai", "Audi", "Mercedes"):
        if make.lower() in haystack:
            return make
    return None


_SPARE_PART_KEYWORDS = frozenset({
    # engine & drivetrain
    "engine", "piston", "cylinder", "camshaft", "crankshaft", "gearbox", "transmission",
    "clutch", "differential", "driveshaft", "axle", "timing belt", "timing chain",
    # fuel & air
    "carburetor", "carburettor", "injector", "fuel pump", "air filter", "oil filter",
    "fuel filter", "throttle", "intake manifold",
    # electrical
    "alternator", "starter motor", "ignition coil", "distributor", "sensor", "ecu",
    "spark plug", "battery", "rectifier",
    # cooling & exhaust
    "radiator", "thermostat", "water pump", "exhaust", "muffler", "catalytic converter",
    "intercooler", "coolant",
    # suspension & steering
    "suspension", "shock absorber", "strut", "spring", "control arm", "tie rod",
    "ball joint", "wheel bearing", "steering rack", "power steering",
    # brakes
    "brake", "rotor", "caliper", "brake pad", "drum", "abs sensor",
    # tyres & wheels
    "tyre", "tire", "rim", "alloy wheel",
    # body parts
    "bumper", "bonnet", "hood", "door panel", "side mirror", "fender", "grille",
    "headlight", "tail light", "taillight", "fog light", "indicator light",
    # bike-specific
    "sprocket", "chain kit", "handlebar", "throttle cable", "fork seal", "swingarm",
    "bike piston", "bike carburetor", "bike exhaust",
    # general spare-part signals
    "spare part", "auto part", "car part", "bike part", "replacement part",
    "oem", "genuine part", "aftermarket", "spare",
})

_NON_PART_KEYWORDS = frozenset({
    "laptop", "mobile", "phone", "computer", "tablet", "furniture",
    "clothes", "shoes", "property", "apartment", "flat", "plot", "house",
    "food", "cosmetic", "beauty", "medicine",
})


def _is_vehicle_spare_part(title: str | None, description: str | None, category: str | None) -> bool:
    haystack = " ".join(filter(None, [
        _normalize_whitespace(title),
        _normalize_whitespace(description),
        _normalize_whitespace(category),
    ])).lower()

    if any(kw in haystack for kw in _NON_PART_KEYWORDS):
        return False

    return any(kw in haystack for kw in _SPARE_PART_KEYWORDS)


_PROVINCE_OF = {"lahore": "punjab", "karachi": "sindh", "islamabad": "islamabad capital territory", "peshawar": "khyber pakhtunkhwa"}

def _is_target_city(city: str | None, filter_city: str) -> bool:
    if not filter_city:
        return True
    if city is None:
        return True  # city unknown — feed URL already scoped to target city
    city_lower = city.lower()
    filter_lower = filter_city.lower()
    if filter_lower in city_lower:
        return True
    # Accept province-level match (Daraz returns "Punjab" for Lahore items)
    province = _PROVINCE_OF.get(filter_lower)
    return province is not None and province in city_lower


def _make_absolute_url(raw_url: str | None, base_url: str) -> str | None:
    text = _normalize_whitespace(raw_url)
    if not text:
        return None
    return urljoin(base_url, text)


def _looks_like_product(payload: dict) -> bool:
    return bool(_pick_first(payload.get("name"), payload.get("title"), payload.get("product_name"))) and (
        _pick_first(
            payload.get("price"),
            payload.get("price_pkr"),
            payload.get("priceAmount"),
            payload.get("offers"),
            payload.get("images"),
        )
        is not None
    )


def _extract_olx_listings(next_data: dict) -> list[dict]:
    """Extract ad listings from OLX Pakistan's __NEXT_DATA__ JSON structure."""
    try:
        page_props = next_data.get("props", {}).get("pageProps", {})
        # OLX nests ads under multiple possible keys
        ads = (
            page_props.get("state", {}).get("listing", {}).get("ads")
            or page_props.get("state", {}).get("ads")
            or page_props.get("ads")
            or []
        )
        products = []
        for ad in ads:
            if not isinstance(ad, dict):
                continue
            title = ad.get("title")
            price_data = ad.get("price", {})
            if isinstance(price_data, dict):
                price = price_data.get("value")
                currency = price_data.get("currency_code", "PKR")
            else:
                price = price_data
                currency = "PKR"
            if not title or price is None:
                continue
            location = ad.get("main_info", {}).get("location", {}) if isinstance(ad.get("main_info"), dict) else {}
            city_data = location.get("city", {})
            city = city_data.get("name") if isinstance(city_data, dict) else city_data
            photos = ad.get("photos") or []
            image = photos[0].get("link") if photos and isinstance(photos[0], dict) else None
            products.append({
                "name": title,
                "price": price,
                "priceCurrency": currency,
                "description": ad.get("description"),
                "city": city,
                "image_url": image,
                "source_url": ad.get("url"),
                "external_id": str(ad.get("id", "")),
            })
        return products
    except (AttributeError, TypeError):
        return []


def _extract_daraz_items(payload: dict) -> list[dict]:
    """Map Daraz catalog JSON response to our normalizer-compatible format."""
    list_items = payload.get("mods", {}).get("listItems", [])
    if not list_items:
        return []
    out = []
    for item in list_items:
        if not isinstance(item, dict):
            continue
        # priceShow: "Rs. 1,299" — extract numeric part as fallback
        price_raw = item.get("price") or item.get("priceShow", "")
        price = price_raw if isinstance(price_raw, (int, float)) else re.sub(r"[^\d.]", "", str(price_raw))
        orig_raw = item.get("originalPrice") or item.get("originalPriceShow", "")
        orig = orig_raw if isinstance(orig_raw, (int, float)) else re.sub(r"[^\d.]", "", str(orig_raw)) or None
        out.append({
            "name": item.get("name"),
            "price": price,
            "original_price": orig,
            "image_url": item.get("image"),
            "description": item.get("description"),
            "city": item.get("location"),          # "Punjab" — province level
            "make": item.get("brandName"),
            "source_url": item.get("itemUrl") or item.get("productUrl"),
            "external_id": str(item.get("itemId") or item.get("nid") or ""),
        })
    return out


def _extract_products_from_json(payload) -> list[dict]:
    if isinstance(payload, list):
        return [item for item in payload if isinstance(item, dict)]

    if not isinstance(payload, dict):
        return []

    # Daraz catalog API
    if "mods" in payload and "listItems" in payload.get("mods", {}):
        items = _extract_daraz_items(payload)
        if items:
            return items

    if _looks_like_product(payload):
        return [payload]

    for key in ("products", "items", "results", "data", "records"):
        value = payload.get(key)
        if isinstance(value, list):
            return [item for item in value if isinstance(item, dict)]
        if isinstance(value, dict):
            nested = _extract_products_from_json(value)
            if nested:
                return nested

    collected: list[dict] = []
    for value in payload.values():
        if isinstance(value, dict):
            collected.extend(_extract_products_from_json(value))
        elif isinstance(value, list):
            collected.extend(item for item in value if isinstance(item, dict) and _looks_like_product(item))
    return collected


def _iter_json_ld_nodes(node):
    if isinstance(node, list):
        for item in node:
            yield from _iter_json_ld_nodes(item)
        return

    if not isinstance(node, dict):
        return

    node_type = node.get("@type")
    type_values = node_type if isinstance(node_type, list) else [node_type]
    normalized_types = {str(value).lower() for value in type_values if value}

    if "product" in normalized_types:
        yield node
    elif "itemlist" in normalized_types:
        for item in node.get("itemListElement", []):
            if isinstance(item, dict):
                target = item.get("item", item)
                yield from _iter_json_ld_nodes(target)

    for value in node.values():
        if isinstance(value, (dict, list)):
            yield from _iter_json_ld_nodes(value)


def _extract_products_from_html(html: str, page_url: str) -> list[dict]:
    if BeautifulSoup is None:
        title_match = re.search(r"<title>(.*?)</title>", html, re.IGNORECASE | re.DOTALL)
        title = _normalize_whitespace(title_match.group(1) if title_match else None)
        price_match = re.search(
            r'property=["\']product:price:amount["\']\s+content=["\']([^"\']+)["\']',
            html,
            re.IGNORECASE,
        )
        image_match = re.search(
            r'property=["\']og:image["\']\s+content=["\']([^"\']+)["\']',
            html,
            re.IGNORECASE,
        )
        description_match = re.search(
            r'(?:name|property)=["\'](?:description|og:description)["\']\s+content=["\']([^"\']+)["\']',
            html,
            re.IGNORECASE,
        )
        if title and price_match:
            return [
                {
                    "name": title,
                    "price": price_match.group(1),
                    "image": image_match.group(1) if image_match else None,
                    "description": description_match.group(1) if description_match else None,
                    "url": page_url,
                }
            ]
        return []

    soup = BeautifulSoup(html, "html.parser")
    products: list[dict] = []

    for script in soup.find_all("script", attrs={"type": "application/ld+json"}):
        raw = script.string or script.get_text(strip=True)
        if not raw:
            continue
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            continue
        for node in _iter_json_ld_nodes(data):
            products.append(node)

    if products:
        return products

    # Next.js SSR: __NEXT_DATA__ tag (used by OLX Pakistan, PakWheels, etc.)
    next_data_tag = soup.find("script", attrs={"id": "__NEXT_DATA__"})
    if next_data_tag:
        try:
            next_data = json.loads(next_data_tag.string or "")
            olx_products = _extract_olx_listings(next_data)
            if olx_products:
                return olx_products
        except (json.JSONDecodeError, AttributeError):
            pass

    # Daraz / React: window.pageData or window.__PRELOADED_STATE__
    _SSR_PATTERNS = [
        r'window\.__PRELOADED_STATE__\s*=\s*(\{.+?\})\s*;',
        r'window\.pageData\s*=\s*(\{.+?\})\s*;',
        r'window\.PageData\s*=\s*(\{.+?\})\s*;',
    ]
    for script_tag in soup.find_all("script"):
        raw = script_tag.string or ""
        if not raw or len(raw) < 200:
            continue
        for pattern in _SSR_PATTERNS:
            match = re.search(pattern, raw, re.DOTALL)
            if not match:
                continue
            try:
                payload = json.loads(match.group(1))
                extracted = _extract_products_from_json(payload)
                if extracted:
                    products.extend(extracted)
            except (json.JSONDecodeError, IndexError):
                continue
        if products:
            break

    if products:
        return products

    title = _pick_first(
        soup.find("meta", attrs={"property": "og:title"}) and soup.find("meta", attrs={"property": "og:title"}).get("content"),
        soup.title.string if soup.title else None,
    )
    price = _pick_first(
        soup.find("meta", attrs={"property": "product:price:amount"})
        and soup.find("meta", attrs={"property": "product:price:amount"}).get("content"),
        soup.find("meta", attrs={"itemprop": "price"}) and soup.find("meta", attrs={"itemprop": "price"}).get("content"),
    )
    image = _pick_first(
        soup.find("meta", attrs={"property": "og:image"}) and soup.find("meta", attrs={"property": "og:image"}).get("content"),
    )
    description = _pick_first(
        soup.find("meta", attrs={"name": "description"}) and soup.find("meta", attrs={"name": "description"}).get("content"),
        soup.find("meta", attrs={"property": "og:description"})
        and soup.find("meta", attrs={"property": "og:description"}).get("content"),
    )

    if title and price is not None:
        return [
            {
                "name": title,
                "price": price,
                "image": image,
                "description": description,
                "url": page_url,
            }
        ]

    return []


def _extract_offer_value(offers, field: str):
    if isinstance(offers, list):
        for offer in offers:
            value = _extract_offer_value(offer, field)
            if value is not None:
                return value
        return None
    if isinstance(offers, dict):
        return offers.get(field)
    return None


def _normalize_remote_product(raw: dict, feed: FeedSource, settings, synced_at: datetime) -> dict | None:
    title = _normalize_whitespace(_pick_first(raw.get("name"), raw.get("title"), raw.get("product_name")))
    if not title:
        return None

    description = _normalize_whitespace(
        _pick_first(raw.get("description"), raw.get("summary"), raw.get("body"))
    )
    offers = raw.get("offers")
    currency = str(
        _pick_first(
            raw.get("currency"),
            raw.get("priceCurrency"),
            _extract_offer_value(offers, "priceCurrency"),
            _extract_offer_value(offers, "price_currency"),
            "PKR",
        )
    ).upper()

    price = _to_float(
        _pick_first(
            raw.get("price_pkr"),
            raw.get("price"),
            raw.get("current_price"),
            raw.get("sale_price"),
            raw.get("priceAmount"),
            _extract_offer_value(offers, "price"),
            _extract_offer_value(offers, "lowPrice"),
        )
    )
    original_price = _to_float(
        _pick_first(
            raw.get("original_price"),
            raw.get("originalPrice"),
            raw.get("compare_at_price"),
            raw.get("list_price"),
            _extract_offer_value(offers, "highPrice"),
        )
    )

    if price is None:
        return None

    if currency == "USD":
        price = round(price * settings.usd_to_pkr_rate, 2)
        if original_price is not None:
            original_price = round(original_price * settings.usd_to_pkr_rate, 2)

    image_url = _make_absolute_url(
        _pick_first(raw.get("image_url"), raw.get("thumbnail"), raw.get("image"), raw.get("images")),
        feed.url,
    )
    source_url = _make_absolute_url(
        _pick_first(raw.get("source_url"), raw.get("url"), raw.get("@id"), feed.url),
        feed.url,
    )
    category = _pick_first(raw.get("category"), raw.get("product_type"), raw.get("@type"))
    make = _pick_first(raw.get("make"), raw.get("brand"))

    normalized = {
        "name": title,
        "description": description,
        "price": price,
        "original_price": original_price if original_price and original_price > price else None,
        "category": _normalize_whitespace(category) or _guess_category(title, description),
        "make": _normalize_whitespace(make) or _guess_make(title, description),
        "city": _normalize_whitespace(_pick_first(raw.get("city"), raw.get("location"))),
        "sale": _to_bool(raw.get("sale"), default=bool(original_price and original_price > price)),
        "free_shipping": _to_bool(raw.get("free_shipping")),
        "stock_quantity": _to_int(
            _pick_first(raw.get("stock_quantity"), raw.get("stock"), raw.get("inventory"), raw.get("quantity")),
            default=10,
        ),
        "image_url": image_url,
        "model_url": _normalize_whitespace(raw.get("model_url")),
        "source_name": _normalize_whitespace(_pick_first(raw.get("source"), raw.get("source_name"))) or feed.name,
        "source_url": source_url,
        "external_id": _normalize_whitespace(
            str(_pick_first(raw.get("external_id"), raw.get("id"), raw.get("sku"), raw.get("product_id"), raw.get("mpn")) or "")
        )
        or None,
        "is_live_listing": True,
        "last_synced_at": synced_at,
    }

    # Filter: Lahore region only
    filter_city = getattr(settings, "parts_filter_city", "Lahore")
    if not _is_target_city(normalized["city"], filter_city):
        return None

    # Filter: car / bike spare parts only (description + title must match spare-part keywords)
    if not _is_vehicle_spare_part(normalized["name"], normalized.get("description"), normalized.get("category")):
        return None

    # Default city to filter city when raw data has no location field
    if normalized["city"] is None and filter_city:
        normalized["city"] = filter_city

    return normalized


def _generate_product_id(source_name: str, external_id: str | None) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", f"{source_name}-{external_id or uuid.uuid4().hex[:10]}".lower()).strip("-")
    return (slug or uuid.uuid4().hex)[:64]


async def _find_existing_product(session, normalized: dict, product_id: str | None = None) -> Product | None:
    conditions = []
    # Always check by generated product_id first — prevents duplicate key errors
    if product_id:
        conditions.append(Product.product_id == product_id)
    if normalized.get("external_id") and normalized.get("source_name"):
        conditions.append(
            and_(
                Product.external_id == normalized["external_id"],
                Product.source_name == normalized["source_name"],
            )
        )
    if normalized.get("source_url"):
        conditions.append(Product.source_url == normalized["source_url"])
    if normalized.get("name") and normalized.get("source_name"):
        conditions.append(
            and_(
                Product.name == normalized["name"],
                Product.source_name == normalized["source_name"],
                or_(Product.make == normalized.get("make"), Product.make.is_(None)),
            )
        )

    if not conditions:
        return None

    with session.no_autoflush:
        result = await session.execute(select(Product).where(or_(*conditions)).order_by(Product.id.desc()))
    return result.scalars().first()


async def _fetch_feed_items(client: httpx.AsyncClient, feed: FeedSource) -> list[dict]:
    response = await client.get(feed.url)
    response.raise_for_status()

    content_type = response.headers.get("content-type", "").lower()
    if "json" in content_type:
        return _extract_products_from_json(response.json())

    try:
        payload = response.json()
    except ValueError:
        payload = None
    if payload is not None:
        items = _extract_products_from_json(payload)
        if items:
            return items

    return _extract_products_from_html(response.text, str(response.url))


async def fetch_and_store_daily_parts(triggered_by: str = "manual") -> dict:
    settings = get_settings()
    feeds = _parse_feed_sources(settings.parts_feed_urls)
    synced_at = datetime.now(timezone.utc)

    if not feeds:
        return _set_last_sync_report(
            {
                "status": "skipped",
                "triggeredBy": triggered_by,
                "syncedAt": synced_at.isoformat(),
                "feeds": [],
                "created": 0,
                "updated": 0,
                "skipped": 0,
                "errors": ["PARTS_FEED_URLS is empty. Configure at least one feed URL before syncing."],
            }
        )

    logger.info("Starting parts sync from %s feed(s) [%s].", len(feeds), triggered_by)

    created = 0
    updated = 0
    skipped = 0
    errors: list[str] = []
    feed_reports: list[dict] = []

    async with httpx.AsyncClient(
        timeout=settings.parts_sync_timeout_seconds,
        follow_redirects=True,
        headers={"User-Agent": settings.parts_sync_user_agent},
    ) as client:
        async with AsyncSessionLocal() as session:
            for feed in feeds:
                feed_created = 0
                feed_updated = 0
                feed_skipped = 0
                try:
                    raw_items = await _fetch_feed_items(client, feed)
                except Exception as exc:
                    message = f"{feed.name}: fetch failed ({exc})"
                    logger.error(message)
                    errors.append(message)
                    feed_reports.append(
                        {
                            "name": feed.name,
                            "url": feed.url,
                            "fetched": 0,
                            "created": 0,
                            "updated": 0,
                            "skipped": 0,
                            "error": str(exc),
                        }
                    )
                    continue

                for raw_item in raw_items:
                    normalized = _normalize_remote_product(raw_item, feed, settings, synced_at)
                    if normalized is None:
                        feed_skipped += 1
                        continue

                    pid = _generate_product_id(normalized["source_name"], normalized.get("external_id"))
                    existing = await _find_existing_product(session, normalized, product_id=pid)
                    if existing is None:
                        normalized["product_id"] = pid
                        session.add(Product(**normalized))
                        feed_created += 1
                    else:
                        for field, value in normalized.items():
                            setattr(existing, field, value)
                        feed_updated += 1

                created += feed_created
                updated += feed_updated
                skipped += feed_skipped
                feed_reports.append(
                    {
                        "name": feed.name,
                        "url": feed.url,
                        "fetched": len(raw_items),
                        "created": feed_created,
                        "updated": feed_updated,
                        "skipped": feed_skipped,
                    }
                )

            try:
                await session.commit()
            except Exception as exc:
                await session.rollback()
                logger.error("Parts sync commit failed: %s", exc)
                errors.append(f"Database commit failed: {exc}")

    report = {
        "status": "completed" if not errors else "completed_with_errors",
        "triggeredBy": triggered_by,
        "syncedAt": synced_at.isoformat(),
        "feeds": feed_reports,
        "created": created,
        "updated": updated,
        "skipped": skipped,
        "errors": errors,
    }
    logger.info("Parts sync finished. Created=%s Updated=%s Skipped=%s", created, updated, skipped)
    return _set_last_sync_report(report)


def start_scheduler() -> AsyncIOScheduler | None:
    settings = get_settings()
    feeds = _parse_feed_sources(settings.parts_feed_urls)
    if not settings.parts_sync_enabled:
        logger.info("Parts sync scheduler is disabled.")
        return None
    if not feeds:
        logger.warning("Parts sync is enabled but PARTS_FEED_URLS is empty. Scheduler will not start.")
        return None

    global _scheduler
    if _scheduler and _scheduler.running:
        return _scheduler

    _scheduler = AsyncIOScheduler()
    _scheduler.add_job(
        fetch_and_store_daily_parts,
        "cron",
        hour=settings.parts_sync_hour,
        minute=settings.parts_sync_minute,
        kwargs={"triggered_by": "scheduler"},
    )
    _scheduler.start()
    logger.info(
        "Parts sync scheduled daily at %02d:%02d for %s feed(s).",
        settings.parts_sync_hour,
        settings.parts_sync_minute,
        len(feeds),
    )

    if settings.parts_sync_run_on_startup:
        asyncio.create_task(fetch_and_store_daily_parts(triggered_by="startup"))

    return _scheduler


def stop_scheduler() -> None:
    global _scheduler
    if _scheduler:
        _scheduler.shutdown(wait=False)
        _scheduler = None
