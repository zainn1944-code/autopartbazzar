"""One-off bulk import: sweep many Daraz car-parts search queries/pages until
TARGET_CREATED new car products exist in the catalog. Reuses the same
normalize/filter/dedup pipeline as the scheduled sync (services.parts_sync)
so city filtering, spare-part keyword filtering, vehicle-type filtering and
the store markup all stay consistent with the daily job.

Run manually: python scripts/bulk_fetch_car_parts.py
"""
import asyncio
import sys
from datetime import datetime, timezone
from pathlib import Path

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from config import get_settings
from database import AsyncSessionLocal
from models.product import Product
from services.parts_sync import (
    FeedSource,
    _fetch_feed_items,
    _find_existing_product,
    _normalize_remote_product,
)

TARGET_CREATED = 500
MAX_PAGES_PER_QUERY = 6
REQUEST_DELAY_SECONDS = 0.5

QUERIES = [
    "car brake pads", "car brake disc", "car bumper", "car headlight assembly",
    "car tail light assembly", "car side mirror", "clutch plate car",
    "timing belt car", "car radiator", "shock absorber car", "suspension arm car",
    "spark plug car", "fuel pump car", "oil filter car", "air filter car",
    "cabin filter car", "wiper blade car", "car battery", "car alternator",
    "starter motor car", "exhaust muffler car", "engine mount car",
    "wheel bearing car", "tie rod car", "ball joint car",
    "power steering pump car", "car ac compressor", "radiator fan car",
    "ignition coil car", "car door handle", "car fender", "car grille",
    "car bonnet", "alloy rim car", "car tyre", "car horn", "indicator light car",
    "fog light car", "led headlight bulb car", "car carburetor",
    "gearbox car", "differential car", "drive shaft car", "control arm car",
    "car side skirt", "car spoiler", "car hood scoop", "car number plate frame",
    "car floor mats", "car window regulator", "car door lock actuator",
]


async def main() -> None:
    settings = get_settings()
    synced_at = datetime.now(timezone.utc)

    created = 0
    updated = 0
    skipped = 0

    async with httpx.AsyncClient(
        timeout=settings.parts_sync_timeout_seconds,
        follow_redirects=True,
        headers={"User-Agent": settings.parts_sync_user_agent},
    ) as client:
        async with AsyncSessionLocal() as session:
            for query in QUERIES:
                if created >= TARGET_CREATED:
                    break
                for page in range(1, MAX_PAGES_PER_QUERY + 1):
                    if created >= TARGET_CREATED:
                        break
                    feed = FeedSource(
                        name="Daraz Bulk Import",
                        url=f"https://www.daraz.pk/catalog/?ajax=true&page={page}&q={query.replace(' ', '+')}",
                    )
                    try:
                        raw_items = await _fetch_feed_items(client, feed)
                    except Exception as exc:
                        print(f"[{query} p{page}] fetch failed: {exc}")
                        await asyncio.sleep(REQUEST_DELAY_SECONDS)
                        continue

                    if not raw_items:
                        # No more results for this query — move to the next one.
                        break

                    page_created = 0
                    for raw_item in raw_items:
                        normalized = _normalize_remote_product(raw_item, feed, settings, synced_at)
                        if normalized is None:
                            skipped += 1
                            continue
                        pid = normalized["product_id"]
                        existing = await _find_existing_product(session, normalized, product_id=pid)
                        if existing is None:
                            session.add(Product(**normalized))
                            created += 1
                            page_created += 1
                        else:
                            for field, value in normalized.items():
                                setattr(existing, field, value)
                            updated += 1

                    await session.commit()
                    print(f"[{query} p{page}] fetched={len(raw_items)} created={page_created} total_created={created}")
                    await asyncio.sleep(REQUEST_DELAY_SECONDS)

    print(f"\nDone. created={created} updated={updated} skipped={skipped}")


if __name__ == "__main__":
    asyncio.run(main())
