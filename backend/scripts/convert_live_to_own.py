"""One-time cleanup: turn previously fetched "live listings" into our own products.

Older syncs stored fetched parts with is_live_listing=True plus the source name
and the external web link (e.g. a Daraz URL). We now keep fetched parts as plain
catalogue products, so this script converts any rows left over from the old
behaviour: it clears the source name + web link and flips them to normal,
addable-to-cart products.

Run from the backend directory:

    python -m scripts.convert_live_to_own
"""

import asyncio

from sqlalchemy import select

from database import AsyncSessionLocal
from models.product import Product


async def main() -> None:
    async with AsyncSessionLocal() as session:
        rows = (
            await session.execute(
                select(Product).where(
                    (Product.is_live_listing.is_(True))
                    | (Product.source_url.is_not(None))
                    | (Product.source_name.is_not(None))
                )
            )
        ).scalars().all()

        for product in rows:
            product.is_live_listing = False
            product.source_url = None
            product.source_name = None
            # Give synced parts some stock so they can be added to the cart.
            if not product.stock_quantity:
                product.stock_quantity = 10

        await session.commit()
        print(f"Converted {len(rows)} fetched product(s) into your own catalogue products.")


if __name__ == "__main__":
    asyncio.run(main())
