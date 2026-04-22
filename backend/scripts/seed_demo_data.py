import asyncio

from sqlalchemy import select

from database import AsyncSessionLocal
from models.car_model import CarModel
from models.product import Product
from models.review import Review


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
    {
        "make": "Suzuki",
        "car": "Swift",
        "model": 2022.0,
        "model_url": "http://localhost:5173/models/swift-bumper.glb",
    },
    {
        "make": "Kia",
        "car": "Sportage",
        "model": 2024.0,
        "model_url": "http://localhost:5173/models/sportage-brake.glb",
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
        "name": "Civic Front Bumper",
        "price": 1500.0,
        "original_price": 1800.0,
        "category": "Bumpers",
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
        "category": "Electrical",
        "make": "Honda",
        "city": "Islamabad",
        "sale": True,
        "free_shipping": True,
        "image_url": "https://via.placeholder.com/640x480?text=Black+Sports+Lights",
        "model_url": "http://localhost:5173/models/civiclight.glb",
    },
    {
        "product_id": "4",
        "name": "Corolla Rear Light Pair",
        "price": 2200.0,
        "original_price": 2450.0,
        "category": "Electrical",
        "make": "Toyota",
        "city": "Faisalabad",
        "sale": True,
        "free_shipping": False,
        "image_url": "https://via.placeholder.com/640x480?text=Rear+Lights",
        "model_url": "http://localhost:5173/models/backlight.glb",
    },
    {
        "product_id": "5",
        "name": "Swift Front Bumper Lip",
        "price": 1850.0,
        "original_price": 2100.0,
        "category": "Bumpers",
        "make": "Suzuki",
        "city": "Rawalpindi",
        "sale": False,
        "free_shipping": True,
        "image_url": "https://via.placeholder.com/640x480?text=Swift+Bumper",
        "model_url": "http://localhost:5173/models/swift-bumper.glb",
    },
    {
        "product_id": "6",
        "name": "Sportage Brake Pad Set",
        "price": 3200.0,
        "original_price": 3550.0,
        "category": "Brakes",
        "make": "Kia",
        "city": "Peshawar",
        "sale": True,
        "free_shipping": True,
        "image_url": "https://via.placeholder.com/640x480?text=Brake+Pad+Set",
        "model_url": "http://localhost:5173/models/sportage-brake.glb",
    },
    {
        "product_id": "7",
        "name": "Universal Cabin Air Filter",
        "price": 900.0,
        "original_price": 1100.0,
        "category": "Filters",
        "make": "Suzuki",
        "city": "Multan",
        "sale": False,
        "free_shipping": True,
        "image_url": "https://via.placeholder.com/640x480?text=Cabin+Filter",
        "model_url": None,
    },
    {
        "product_id": "8",
        "name": "BMW i8 Performance Tyre",
        "price": 5400.0,
        "original_price": 5900.0,
        "category": "Tyres",
        "make": "BMW",
        "city": "Karachi",
        "sale": True,
        "free_shipping": False,
        "image_url": "https://via.placeholder.com/640x480?text=BMW+Tyre",
        "model_url": "http://localhost:5173/CarModels/bmw.glb",
    },
]


REVIEWS = [
    {"product_id": "1", "text": "Road grip is solid and the delivery was quick.", "rating": 4.5},
    {"product_id": "1", "text": "Worth it for city driving and daily use.", "rating": 4.0},
    {"product_id": "2", "text": "Fitting matched my Civic well.", "rating": 4.0},
    {"product_id": "3", "text": "Brightness is good and installation was easy.", "rating": 5.0},
    {"product_id": "4", "text": "Looks clean at night and feels premium.", "rating": 4.5},
    {"product_id": "5", "text": "Decent finish, could use better packaging.", "rating": 3.5},
    {"product_id": "6", "text": "Braking response improved after replacing the old set.", "rating": 4.5},
    {"product_id": "7", "text": "Good value filter for regular maintenance.", "rating": 4.0},
    {"product_id": "8", "text": "Pricey but the quality matches the claim.", "rating": 4.5},
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


async def upsert_reviews() -> tuple[int, int]:
    created = 0
    updated = 0
    async with AsyncSessionLocal() as session:
        for row in REVIEWS:
            q = await session.execute(
                select(Review).where(
                    Review.product_id == row["product_id"],
                    Review.text == row["text"],
                )
            )
            existing = q.scalar_one_or_none()
            if existing is None:
                session.add(Review(**row))
                created += 1
            else:
                existing.rating = row["rating"]
                updated += 1
        await session.commit()
    return created, updated


async def main() -> None:
    car_created, car_updated = await upsert_car_models()
    prod_created, prod_updated = await upsert_products()
    review_created, review_updated = await upsert_reviews()

    print("Seed complete.")
    print(f"Car models -> created: {car_created}, updated: {car_updated}")
    print(f"Products   -> created: {prod_created}, updated: {prod_updated}")
    print(f"Reviews    -> created: {review_created}, updated: {review_updated}")


if __name__ == "__main__":
    asyncio.run(main())
