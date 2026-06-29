from __future__ import annotations

import asyncio
import os
import sys
from pathlib import Path

from sqlalchemy import select

ROOT = Path(__file__).resolve().parents[1]
os.chdir(ROOT / "backend")
sys.path.insert(0, str(ROOT / "backend"))

from database import AsyncSessionLocal  # noqa: E402
from models.car_model import CarModel  # noqa: E402


CAR_MODELS = [
    {
        "make": "Honda",
        "car": "Civic",
        "model": 2023.0,
        "model_url": "/models/honda/civic.glb",
        "source_url": "https://sketchfab.com/3d-models/honda-civic-ff844e296f214e709c0d0691d031c68b",
    },
    {
        "make": "Toyota",
        "car": "Hilux",
        "model": 2026.0,
        "model_url": "/models/toyota/hilux.glb",
        "source_url": "https://poly.pizza/m/8-0nFArehjd",
    },
    {
        "make": "Toyota",
        "car": "Corolla",
        "model": 2017.0,
        "model_url": "/models/toyota/corolla.glb",
        "source_url": "https://sketchfab.com/3d-models/toyota-corolla-e170-2017",
    },
]


async def main() -> None:
    async with AsyncSessionLocal() as db:
        for item in CAR_MODELS:
            result = await db.execute(
                select(CarModel).where(
                    CarModel.make == item["make"],
                    CarModel.car == item["car"],
                )
            )
            rows = result.scalars().all()
            row = rows[0] if rows else None
            if row is None:
                row = CarModel(
                    make=item["make"],
                    car=item["car"],
                    model=item["model"],
                    model_url=item["model_url"],
                )
                db.add(row)
            else:
                row.model = item["model"]
                row.model_url = item["model_url"]
                for duplicate in rows[1:]:
                    await db.delete(duplicate)

        # Remove any catalog rows that are no longer part of the curated list
        keep = {(item["make"], item["car"]) for item in CAR_MODELS}
        existing = await db.execute(select(CarModel))
        for row in existing.scalars().all():
            if (row.make, row.car) not in keep:
                await db.delete(row)

        await db.commit()

    print(f"Seeded {len(CAR_MODELS)} car model entries.")
    print("Source pages used to assemble the catalog:")
    for item in CAR_MODELS:
        print(f"- {item['make']} {item['car']}: {item['source_url']}")


if __name__ == "__main__":
    asyncio.run(main())
