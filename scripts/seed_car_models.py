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
        "make": "Toyota",
        "car": "Corolla",
        "model": 2022.0,
        "model_url": "",
        "source_url": "https://sketchfab.com/3d-models/toyota-corolla-4703efa36e4b4aa9a342db3153ce3edd",
    },
    {
        "make": "Toyota",
        "car": "Camry",
        "model": 2024.0,
        "model_url": "",
        "source_url": "https://sketchfab.com/3d-models/toyota-camry-v80-98c70e5aa53446728fea4d8f448bbf33",
    },
    {
        "make": "Toyota",
        "car": "Hilux",
        "model": 2026.0,
        "model_url": "",
        "source_url": "https://sketchfab.com/3d-models/toyota-hilux-417915f419f945c8a424b2a7943eb25a",
    },
    {
        "make": "Honda",
        "car": "Civic",
        "model": 2023.0,
        "model_url": "/carmodels/civic2.glb",
        "source_url": "https://sketchfab.com/3d-models/honda-civic-ff844e296f214e709c0d0691d031c68b",
    },
    {
        "make": "Honda",
        "car": "Accord",
        "model": 2017.0,
        "model_url": "",
        "source_url": "https://sketchfab.com/3d-models/honda-accord-2017-68892cd369e84a218e5e5dcf82365ee3",
    },
    {
        "make": "Honda",
        "car": "CR-V",
        "model": 2023.0,
        "model_url": "",
        "source_url": "https://sketchfab.com/3d-models/honda-cr-v-4d0751311d76473b81377f5bd2da273b",
    },
    {
        "make": "BMW",
        "car": "3 Series",
        "model": 2012.0,
        "model_url": "/carmodels/bmw.glb",
        "source_url": "https://sketchfab.com/3d-models/bmw-3-series-e91-2004-2012-b048a2c6a67d416eb31d4c620e5b4426",
    },
    {
        "make": "BMW",
        "car": "M3",
        "model": 1990.0,
        "model_url": "",
        "source_url": "https://sketchfab.com/3d-models/free-bmw-m3-e30-ac3c7013434e403e8faff87948caf422",
    },
    {
        "make": "BMW",
        "car": "X5",
        "model": 2021.0,
        "model_url": "",
        "source_url": "https://sketchfab.com/3d-models/bmw-x5-f1adb5c9133f4938a9ee03076c2a1e5a",
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

        await db.commit()

    print(f"Seeded {len(CAR_MODELS)} car model entries.")
    print("Source pages used to assemble the catalog:")
    for item in CAR_MODELS:
        print(f"- {item['make']} {item['car']}: {item['source_url']}")


if __name__ == "__main__":
    asyncio.run(main())
