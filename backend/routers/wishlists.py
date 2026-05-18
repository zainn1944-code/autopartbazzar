from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from database import get_db
from dependencies import get_current_user
from models.user import User
from models.product import Product
from models.wishlist import Wishlist

router = APIRouter(prefix="/wishlists", tags=["wishlists"])


@router.get("")
async def get_wishlist(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Wishlist).where(Wishlist.user_id == current_user.id)
    )
    items = result.scalars().all()

    product_ids = [item.product_id for item in items]
    if not product_ids:
        return []

    prod_result = await db.execute(
        select(Product).where(Product.id.in_(product_ids))
    )
    products = {p.id: p for p in prod_result.scalars().all()}

    return [
        {
            "wishlist_id": item.id,
            "product_id": item.product_id,
            "name": products[item.product_id].name if item.product_id in products else None,
            "price": products[item.product_id].price if item.product_id in products else None,
            "image_url": products[item.product_id].image_url if item.product_id in products else None,
        }
        for item in items
    ]


@router.post("/{product_id}", status_code=status.HTTP_201_CREATED)
async def add_to_wishlist(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    product = await db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    entry = Wishlist(user_id=current_user.id, product_id=product_id)
    db.add(entry)
    try:
        await db.commit()
        await db.refresh(entry)
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already in wishlist")

    return {"wishlist_id": entry.id, "product_id": product_id}


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_from_wishlist(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Wishlist).where(
            Wishlist.user_id == current_user.id,
            Wishlist.product_id == product_id,
        )
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not in wishlist")

    await db.delete(entry)
    await db.commit()
