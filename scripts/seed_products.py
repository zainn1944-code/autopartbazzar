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
from models.product import Product  # noqa: E402


USD_TO_PKR = 279.31
EXCHANGE_RATE_SOURCE = "https://wise.com/gb/currency-converter/usd-to-pkr-rate/history"

WEB_PRODUCTS = [
    {
        "product_id": "1",
        "name": "Pirelli P Zero AS Plus 3",
        "category": "Tyres",
        "make": "Toyota",
        "price_usd": 202.05,
        "source": "Tire Rack",
        "source_url": "https://www.tirerack.com/tires/TireSearchResults.jsp?autoMake=Toyota&autoModel=GR+Corolla&autoYear=2025&diameter=18&ratio=40&vehicleSearch=true&width=235%2F",
        "sale": False,
        "free_shipping": True,
        "image_url": "/product-images/pirelli-pzero-as-plus-3.jpg",
    },
    {
        "product_id": "2",
        "name": "LED Headlight Assembly Pair",
        "category": "Electrical",
        "make": "Toyota",
        "price_usd": 499.00,
        "source": "eBay",
        "source_url": "https://www.ebay.com/itm/365880640177",
        "sale": False,
        "free_shipping": True,
        "image_url": "/product-images/toyota-led-headlight-pair.jpg",
    },
    {
        "product_id": "3",
        "name": "Front Bumper Grille Assembly",
        "category": "Bumpers",
        "make": "Toyota",
        "price_usd": 54.59,
        "source": "eBay",
        "source_url": "https://www.ebay.com/itm/326401454293",
        "sale": False,
        "free_shipping": True,
        "image_url": "/product-images/toyota-front-bumper-grille.jpg",
    },
    {
        "product_id": "4",
        "name": "TYC Tail Light Assembly 11-6180-00",
        "category": "Electrical",
        "make": "Honda",
        "price_usd": 109.99,
        "source": "AutoZone",
        "source_url": "https://www.autozone.com/collision-body-parts-and-hardware/tail-light-assembly/honda/civic/2025",
        "sale": False,
        "free_shipping": False,
        "image_url": "/product-images/tyc-tail-light-11-6180-00.jpeg",
    },
    {
        "product_id": "5",
        "name": "Duralast Disc Brake Rotor 74046DL",
        "category": "Brakes",
        "make": "Honda",
        "price_usd": 72.99,
        "source": "AutoZone",
        "source_url": "https://www.autozone.com/brakes-and-traction-control/brake-rotor/honda/civic/2025",
        "sale": False,
        "free_shipping": False,
        "image_url": "/product-images/disc-brake-rotor.jpeg",
    },
    {
        "product_id": "6",
        "name": "Pirelli P Zero AS Plus 3",
        "category": "Tyres",
        "make": "Honda",
        "price_usd": 251.66,
        "source": "Tire Rack",
        "source_url": "https://www.tirerack.com/tires/TireSearchResults.jsp?autoMake=Honda&autoModClar=&autoModel=Civic+Type+R&autoYear=2025&diameter=18&minLoadRating=XL&minSpeedRating=Z&performance=ALL&ratio=35&skipOver=true&sortCode=54300&width=265%2F",
        "sale": False,
        "free_shipping": True,
        "image_url": "/product-images/pirelli-pzero-as-plus-3.jpg",
    },
    {
        "product_id": "7",
        "name": "Front Outer Bumper Cover Grille",
        "category": "Bumpers",
        "make": "BMW",
        "price_usd": 35.95,
        "source": "eBay",
        "source_url": "https://www.ebay.com/itm/277430462512",
        "sale": False,
        "free_shipping": False,
        "image_url": "/product-images/bmw-bumper-cover-grille.jpeg",
    },
    {
        "product_id": "8",
        "name": "Front Kidney Grille G20/G21/G28",
        "category": "Bumpers",
        "make": "BMW",
        "price_usd": 56.07,
        "source": "eBay",
        "source_url": "https://www.ebay.com/itm/227128403541",
        "sale": False,
        "free_shipping": True,
        "image_url": "/product-images/bmw-kidney-grille.jpg",
    },
    {
        "product_id": "9",
        "name": "Front Fog Light Assembly L&R",
        "category": "Electrical",
        "make": "BMW",
        "price_usd": 190.30,
        "original_price_usd": 213.82,
        "source": "eBay",
        "source_url": "https://www.ebay.com/itm/375676041018",
        "sale": True,
        "free_shipping": False,
        "image_url": "/product-images/bmw-fog-light-assembly.webp",
    },
]


def convert_usd_to_pkr(amount: float | None) -> float | None:
    if amount is None:
        return None
    return round(amount * USD_TO_PKR)


async def main() -> None:
    created = 0
    updated = 0

    async with AsyncSessionLocal() as db:
        for item in WEB_PRODUCTS:
            db_row = {
                "product_id": item["product_id"],
                "name": item["name"],
                "price": convert_usd_to_pkr(item["price_usd"]),
                "original_price": convert_usd_to_pkr(item.get("original_price_usd")),
                "category": item["category"],
                "make": item["make"],
                "city": None,
                "sale": item["sale"],
                "free_shipping": item["free_shipping"],
                "image_url": item.get("image_url"),
                "model_url": None,
            }

            result = await db.execute(
                select(Product).where(Product.product_id == db_row["product_id"])
            )
            existing = result.scalar_one_or_none()

            if existing is None:
                db.add(Product(**db_row))
                created += 1
            else:
                for key, value in db_row.items():
                    setattr(existing, key, value)
                updated += 1

        await db.commit()

    print(f"Seeded {len(WEB_PRODUCTS)} products. Created: {created}, updated: {updated}")
    print(
        f"Prices converted to PKR using 1 USD = {USD_TO_PKR} PKR from {EXCHANGE_RATE_SOURCE}"
    )
    print("Web sources used:")
    for item in WEB_PRODUCTS:
        print(
            f"- [{item['source']}] {item['make']} / {item['name']} -> {item['source_url']}"
        )


if __name__ == "__main__":
    asyncio.run(main())
