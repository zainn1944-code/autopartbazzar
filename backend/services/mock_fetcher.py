import asyncio
import logging
import uuid
import httpx
from sqlalchemy.future import select
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from config import get_settings
from database import AsyncSessionLocal
from models.product import Product

logger = logging.getLogger(__name__)

BIKE_KEYWORDS = (
    "bike",
    "motorcycle",
    "motorbike",
    "scooter",
    "moped",
    "vespa",
    "cd70",
    "cd 70",
    "cd125",
    "cd 125",
    "cg125",
    "cg 125",
    "honda 125",
    "yamaha ybr",
    "ybr",
    "pridor",
    "road prince",
    "70cc",
    "100cc",
    "110cc",
    "125cc",
    "150cc",
)


def _is_bike_product(title: str | None) -> bool:
    haystack = (title or "").lower()
    return any(keyword in haystack for keyword in BIKE_KEYWORDS)


async def fetch_and_store_daily_parts():
    """
    Simulates fetching real-time data from an external internet API daily.
    We use dummyjson.com's automotive category for realistic mock data.
    """
    logger.info("Starting daily fetch of real-time auto parts from the internet...")
    
    url = "https://dummyjson.com/products/category/automotive"
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=10.0)
            response.raise_for_status()
            data = response.json()
    except Exception as e:
        logger.error(f"Failed to fetch data from internet: {e}")
        return

    products_fetched = [
        product for product in data.get("products", [])
        if not _is_bike_product(product.get("title"))
    ]
    if not products_fetched:
        logger.info("No new products found on the internet today.")
        return

    settings = get_settings()
    markup_factor = 1 + (getattr(settings, "parts_markup_percent", 0.0) / 100.0)

    added_count = 0
    async with AsyncSessionLocal() as session:
        for p in products_fetched:
            # Check if we already have this product (using title as a unique proxy for demo)
            stmt = select(Product).where(Product.name == p["title"])
            result = await session.execute(stmt)
            existing = result.scalars().first()

            if not existing:
                base_price = float(p.get("price", 0))
                final_price = round(base_price * markup_factor, 2)
                final_original = round(base_price * 1.2 * markup_factor, 2)
                new_product = Product(
                    product_id=str(uuid.uuid4()),
                    name=p.get("title"),
                    price=final_price,
                    original_price=final_original, # Fake original price for discount
                    category="Accessories", # Map dummy json category to ours
                    make="Universal",
                    city="Global",
                    sale=True,
                    free_shipping=True,
                    image_url=p.get("thumbnail") or (p.get("images")[0] if p.get("images") else None)
                )
                session.add(new_product)
                added_count += 1
                
        try:
            await session.commit()
            logger.info(f"Successfully fetched and added {added_count} new real-time parts from the internet!")
        except Exception as e:
            await session.rollback()
            logger.error(f"Error saving fetched products to database: {e}")

def start_scheduler():
    """
    Initializes the APScheduler to run the fetch task daily.
    """
    scheduler = AsyncIOScheduler()
    
    # Schedule the job to run every day at midnight. 
    # (For demonstration purposes, we also run it once immediately on startup)
    scheduler.add_job(fetch_and_store_daily_parts, 'cron', hour=0, minute=0)
    
    scheduler.start()
    logger.info("Real-time internet data fetcher scheduled to run daily at midnight.")
    
    # Trigger an immediate fetch on startup so the user can see it works right away
    asyncio.create_task(fetch_and_store_daily_parts())
