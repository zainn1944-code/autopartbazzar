import asyncio

from sqlalchemy import select

from database import AsyncSessionLocal
from models.car_model import CarModel
from models.product import Product


CAR_MODELS = [
    {
        "make": "BMW",
        "car": "i8",
        "model": 2021.0,
        "model_url": "http://localhost:5173/CarModels/bmw.glb",
    },
    {
        "make": "Honda",
        "car": "Civic",
        "model": 2024.0,
        "model_url": "http://localhost:5173/models/civicfbumper.glb",
    },
    {
        "make": "Honda",
        "car": "Civic",
        "model": 2023.0,
        "model_url": "http://localhost:5173/models/civiclight.glb",
    },
    {
        "make": "Toyota",
        "car": "Corolla",
        "model": 2023.0,
        "model_url": "http://localhost:5173/models/backlight.glb",
    },
    {
        "make": "Toyota",
        "car": "Corolla",
        "model": 2022.0,
        "model_url": "http://localhost:5173/models/tire.glb",
    },
]


PRODUCTS = [
    {
        "product_id": "1",
        "name": "Sport Tyres",
        "price": 1200.0,
        "original_price": 1500.0,
        "category": "Tyres",
        "make": "Toyota",
        "city": "Lahore",
        "sale": True,
        "free_shipping": False,
        "image_url": "https://via.placeholder.com/640x480?text=Sport+Tyres",
        "model_url": "http://localhost:5173/models/tire.glb",
    },
    {
        "product_id": "2",
        "name": "Front Bumper",
        "price": 1500.0,
        "original_price": 1800.0,
        "category": "Body Parts",
        "make": "Honda",
        "city": "Karachi",
        "sale": False,
        "free_shipping": True,
        "image_url": "https://via.placeholder.com/640x480?text=Front+Bumper",
        "model_url": "http://localhost:5173/models/civicfbumper.glb",
    },
    {
        "product_id": "3",
        "name": "Black Sports Lights",
        "price": 1350.0,
        "original_price": 1600.0,
        "category": "Lights",
        "make": "Honda",
        "city": "Islamabad",
        "sale": True,
        "free_shipping": True,
        "image_url": "https://via.placeholder.com/640x480?text=Black+Sports+Lights",
        "model_url": "http://localhost:5173/models/civiclight.glb",
    },
]


async def upsert_car_models() -> tuple[int, int]:
    created = 0
    updated = 0
    async with AsyncSessionLocal() as session:
        for row in CAR_MODELS:
            q = await session.execute(
                select(CarModel).where(
                    CarModel.make == row["make"],
                    CarModel.car == row["car"],
                    CarModel.model == row["model"],
                )
            )
            existing = q.scalar_one_or_none()
            if existing is None:
                session.add(CarModel(**row))
                created += 1
            else:
                existing.model_url = row["model_url"]
                updated += 1
        await session.commit()
    return created, updated


async def upsert_products() -> tuple[int, int]:
    created = 0
    updated = 0
    async with AsyncSessionLocal() as session:
        for row in PRODUCTS:
            q = await session.execute(select(Product).where(Product.product_id == row["product_id"]))
            existing = q.scalar_one_or_none()
            if existing is None:
                session.add(Product(**row))
                created += 1
            else:
                for key, value in row.items():
                    setattr(existing, key, value)
                updated += 1
        await session.commit()
    return created, updated


async def main() -> None:
    car_created, car_updated = await upsert_car_models()
    prod_created, prod_updated = await upsert_products()

    print("Seed complete.")
    print(f"Car models -> created: {car_created}, updated: {car_updated}")
    print(f"Products   -> created: {prod_created}, updated: {prod_updated}")


if __name__ == "__main__":
    asyncio.run(main())

