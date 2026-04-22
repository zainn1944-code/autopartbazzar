from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.review import Review
from schemas.review import ReviewCreate, ReviewRead

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.get("/{product_id}")
async def list_reviews(product_id: str, db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(Review).where(Review.product_id == product_id))
    rows = r.scalars().all()
    return [ReviewRead.model_validate(x).model_dump(by_alias=True) for x in rows]


@router.post("/{product_id}")
async def create_review(
    product_id: str,
    body: ReviewCreate,
    db: AsyncSession = Depends(get_db),
):
    if not product_id:
        raise HTTPException(status_code=400, detail="Product ID is required")
    rev = Review(product_id=product_id, text=body.text, rating=body.rating)
    db.add(rev)
    await db.commit()
    await db.refresh(rev)
    return ReviewRead.model_validate(rev).model_dump(by_alias=True)
