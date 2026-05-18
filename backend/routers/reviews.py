from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.review import Review
from schemas.review import ReviewCreate, ReviewRead

router = APIRouter(prefix="/reviews", tags=["reviews"])


def _stats_payload(rows: list[Review]) -> dict:
    distribution = {rating: 0 for rating in range(1, 6)}
    for row in rows:
        rounded = max(1, min(5, int(round(row.rating))))
        distribution[rounded] += 1

    total = len(rows)
    average = round(sum(row.rating for row in rows) / total, 1) if total else 0
    percentages = {
        str(rating): round((count / total) * 100) if total else 0
        for rating, count in distribution.items()
    }
    return {
        "total": total,
        "average": average,
        "distribution": {str(rating): count for rating, count in distribution.items()},
        "percentages": percentages,
    }


@router.get("/stats")
async def review_stats(
    productId: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Review)
    if productId:
        stmt = stmt.where(Review.product_id == productId)
    rows = (await db.execute(stmt)).scalars().all()
    return _stats_payload(rows)


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
