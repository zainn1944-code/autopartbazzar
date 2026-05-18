"""
Scraper for autostore.pk — fetches car parts/accessories and seeds into the database.
Focuses on CAR products only, skips bikes/motorcycles.
"""
from __future__ import annotations

import asyncio
import hashlib
import os
import re
import sys
import time
from pathlib import Path
from urllib.parse import urljoin

import httpx
from bs4 import BeautifulSoup
from sqlalchemy import select

ROOT = Path(__file__).resolve().parents[1]
os.chdir(ROOT / "backend")
sys.path.insert(0, str(ROOT / "backend"))

from database import AsyncSessionLocal  # noqa: E402
from models.product import Product  # noqa: E402

BASE_URL = "https://www.autostore.pk"

# Car categories to scrape: (slug, internal_category, pages_to_scrape)
CAR_CATEGORIES = [
    ("car-accessories/exterior-accessories", "Exterior", 3),
    ("car-accessories/interior-accessories", "Interior", 3),
    ("car-accessories/mats", "Interior", 2),
    ("car-parts/wiper-blades", "Exterior", 2),
    ("car-parts/spark-plugs", "Engine", 2),
    ("car-parts/side-mirrors", "Exterior", 2),
    ("car-parts/mud-flap", "Exterior", 1),
    ("car-electronics/security-systems", "Electrical", 2),
    ("car-electronics/car-camera", "Electrical", 2),
    ("car-electronics", "Electrical", 2),
    ("led-lights/led-head-lights", "Electrical", 2),
    ("led-lights/drl-fog-lamps", "Electrical", 2),
    ("led-lights/led-tail-lights", "Electrical", 2),
    ("car-filters/air-filters", "Engine", 2),
    ("car-filters/ac-filter", "Interior", 2),
    ("oils-and-additives/engine-oil", "Engine", 2),
    ("car-parts", "Parts", 3),
]

# Keywords that identify bike/motorcycle products — skip these
BIKE_KEYWORDS = [
    "bike", "motorcycle", "motorbike", "scooter", "moped", "vespa",
    "cd70", "cd125", "125cc", "70cc", "honda 125", "yamaha ybr",
    "honda cg", "ravi", "metro", "road prince",
]

# Extract car make from product name
MAKES = [
    "Toyota", "Honda", "Suzuki", "Kia", "Hyundai", "BMW", "Mercedes",
    "Nissan", "MG", "Audi", "Ford", "Mazda", "Mitsubishi", "Daihatsu",
    "Changan", "Prince", "Proton", "FAW", "DFSK", "Haval", "Chery",
    "Peugeot", "Renault", "Volkswagen", "Subaru", "Lexus", "Land Rover",
    "Jeep", "Isuzu",
]

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

REQUEST_DELAY = 0.8  # seconds between requests — be polite


def is_bike_product(name: str) -> bool:
    name_lower = name.lower()
    return any(kw in name_lower for kw in BIKE_KEYWORDS)


def extract_make(name: str) -> str | None:
    for make in MAKES:
        if make.lower() in name.lower():
            return make
    return None


def parse_price(price_text: str) -> float | None:
    """Parse 'Rs 4,500' or '4,500' into float."""
    cleaned = re.sub(r"[^\d,.]", "", price_text.replace(",", ""))
    try:
        return float(cleaned)
    except (ValueError, TypeError):
        return None


def make_product_id(name: str, source_url: str) -> str:
    slug = hashlib.md5(source_url.encode()).hexdigest()[:12]
    return f"as_{slug}"


def _real_url(img_tag, attrs=("data-lazy-src", "data-src", "src")) -> str | None:
    """Return the first non-placeholder image URL from an <img> tag."""
    for attr in attrs:
        url = img_tag.get(attr, "")
        if url and "blank.gif" not in url and url.startswith("http"):
            return url
    return None


def extract_image_from_soup(soup: BeautifulSoup) -> str | None:
    """Try various selectors to find the real product image URL on a product page."""
    # Priority: main gallery image with wp-post-image class
    img = soup.select_one("img.wp-post-image")
    if img:
        url = _real_url(img)
        if url:
            return url

    # Fallback: any image inside the WooCommerce gallery
    for img in soup.select(".woocommerce-product-gallery img"):
        url = _real_url(img)
        if url:
            return url

    # Last resort: og:image meta tag
    og = soup.select_one('meta[property="og:image"]')
    if og:
        url = og.get("content", "")
        if url and url.startswith("http"):
            return url

    return None


def extract_image_from_card(card: BeautifulSoup) -> str | None:
    """Extract image from a product listing card."""
    img = card.select_one("img")
    if not img:
        return None
    return _real_url(img)


async def fetch_product_image(client: httpx.AsyncClient, product_url: str) -> str | None:
    """Visit the individual product page to get the real image URL."""
    try:
        await asyncio.sleep(REQUEST_DELAY)
        r = await client.get(product_url, timeout=15, follow_redirects=True)
        if r.status_code != 200:
            return None
        soup = BeautifulSoup(r.text, "html.parser")
        return extract_image_from_soup(soup)
    except Exception:
        return None


async def scrape_category_page(
    client: httpx.AsyncClient, url: str, internal_category: str
) -> list[dict]:
    """Scrape one page of a category listing. Returns list of product dicts."""
    products = []
    try:
        await asyncio.sleep(REQUEST_DELAY)
        r = await client.get(url, timeout=20, follow_redirects=True)
        if r.status_code != 200:
            print(f"  [skip] HTTP {r.status_code} for {url}")
            return []
        soup = BeautifulSoup(r.text, "html.parser")

        cards = soup.select("li.product")
        if not cards:
            # Try alternative selectors
            cards = soup.select(".products .product")

        for card in cards:
            # Product link
            a_tag = card.select_one("a.woocommerce-loop-product__link") or card.select_one("a")
            if not a_tag:
                continue
            product_url = a_tag.get("href", "")
            if not product_url or not product_url.startswith("http"):
                product_url = urljoin(BASE_URL, product_url)

            # Name
            title_el = card.select_one(".woocommerce-loop-product__title") or card.select_one("h2")
            if not title_el:
                continue
            name = title_el.get_text(strip=True)
            if not name:
                continue

            # Skip bikes
            if is_bike_product(name):
                continue

            # Price — prefer sale price
            price = None
            ins_el = card.select_one("ins .woocommerce-Price-amount")
            if not ins_el:
                ins_el = card.select_one(".price .woocommerce-Price-amount")
            if ins_el:
                price = parse_price(ins_el.get_text(strip=True))

            # Original price (crossed out)
            original_price = None
            del_el = card.select_one("del .woocommerce-Price-amount")
            if del_el:
                original_price = parse_price(del_el.get_text(strip=True))

            # Image — from card first, visit product page if needed
            image_url = extract_image_from_card(card)

            products.append({
                "name": name,
                "price": price,
                "original_price": original_price,
                "category": internal_category,
                "make": extract_make(name),
                "image_url": image_url,
                "product_url": product_url,
                "sale": original_price is not None,
            })

    except httpx.TimeoutException:
        print(f"  [timeout] {url}")
    except Exception as e:
        print(f"  [error] {url}: {e}")

    return products


async def scrape_all() -> list[dict]:
    """Scrape all configured categories. Returns deduplicated product list."""
    all_products: list[dict] = []
    seen_urls: set[str] = set()

    async with httpx.AsyncClient(headers=HEADERS) as client:
        for cat_slug, internal_category, max_pages in CAR_CATEGORIES:
            for page_num in range(1, max_pages + 1):
                if page_num == 1:
                    url = f"{BASE_URL}/category/{cat_slug}/"
                else:
                    url = f"{BASE_URL}/category/{cat_slug}/page/{page_num}/"

                print(f"  Fetching {url}")
                page_products = await scrape_category_page(client, url, internal_category)

                new_products = []
                for p in page_products:
                    if p["product_url"] not in seen_urls:
                        seen_urls.add(p["product_url"])
                        new_products.append(p)

                print(f"    Found {len(new_products)} new products on this page")
                all_products.extend(new_products)

                # If page returned 0 products, stop paginating this category
                if not page_products:
                    break

        # For products missing images, visit individual pages concurrently (semaphore=6)
        missing_image = [p for p in all_products if not p["image_url"]]
        print(f"\nFetching images for {len(missing_image)} products (6 concurrent)...")
        semaphore = asyncio.Semaphore(6)

        async def fetch_with_sem(product: dict) -> None:
            async with semaphore:
                img = await fetch_product_image(client, product["product_url"])
                if img:
                    product["image_url"] = img

        await asyncio.gather(*[fetch_with_sem(p) for p in missing_image])

    return all_products


async def seed_products(products: list[dict]) -> None:
    """Upsert scraped products into the database."""
    created = updated = skipped = 0

    async with AsyncSessionLocal() as db:
        for item in products:
            if not item["price"]:
                skipped += 1
                continue

            product_id = make_product_id(item["name"], item["product_url"])

            db_row = {
                "product_id": product_id,
                "name": item["name"],
                "price": item["price"],
                "original_price": item.get("original_price"),
                "category": item["category"],
                "make": item.get("make"),
                "city": "Karachi",
                "sale": item.get("sale", False),
                "free_shipping": False,
                "stock_quantity": 25,
                "image_url": item.get("image_url"),
                "model_url": None,
                "source_name": "AutoStore PK",
                "source_url": item["product_url"],
                "external_id": item["product_url"],
                "is_live_listing": True,
            }

            result = await db.execute(
                select(Product).where(Product.product_id == product_id)
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

    print(f"\nSeeded {created + updated} products from AutoStore PK")
    print(f"  Created : {created}")
    print(f"  Updated : {updated}")
    print(f"  Skipped (no price): {skipped}")


async def main() -> None:
    print("=== AutoStore PK Scraper ===")
    print("Scraping car parts from autostore.pk (skipping bikes)...\n")

    start = time.time()
    products = await scrape_all()
    elapsed = time.time() - start

    print(f"\nTotal unique car products scraped: {len(products)}")
    print(f"Scraping took: {elapsed:.1f}s")

    # Print summary
    categories: dict[str, int] = {}
    makes: dict[str, int] = {}
    no_image = 0
    for p in products:
        categories[p["category"]] = categories.get(p["category"], 0) + 1
        if p.get("make"):
            makes[p["make"]] = makes.get(p["make"], 0) + 1
        if not p.get("image_url"):
            no_image += 1

    print("\nProducts by category:")
    for cat, count in sorted(categories.items(), key=lambda x: -x[1]):
        print(f"  {cat}: {count}")

    print("\nProducts by make (top 10):")
    for make, count in sorted(makes.items(), key=lambda x: -x[1])[:10]:
        print(f"  {make}: {count}")

    print(f"\nProducts without image: {no_image}")

    # Sample preview
    print("\nSample products (first 5):")
    for p in products[:5]:
        print(f"  [{p['category']}] {p['name'][:60]} | Rs {p['price']} | {p['make'] or 'Unknown'}")
        print(f"    Image: {p.get('image_url', 'N/A')}")

    print("\nSeeding into database...")
    await seed_products(products)


if __name__ == "__main__":
    asyncio.run(main())
