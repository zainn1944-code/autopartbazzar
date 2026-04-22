from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.car_model import CarModel

router = APIRouter(prefix="/getCarModel", tags=["car-models"])


@router.get("")
async def get_car_model(
    db: AsyncSession = Depends(get_db),
    id: int | None = Query(None),
    make: str | None = Query(None),
    car: str | None = Query(None),
    model: float | None = Query(None),
):
    try:
        if id is not None:
            r = await db.execute(
                select(CarModel).where(CarModel.id == id).order_by(CarModel.id).limit(1)
            )
            row = r.scalars().first()
        elif make and car and model is not None:
            r = await db.execute(
                select(CarModel)
                .where(CarModel.make == make, CarModel.car == car, CarModel.model == model)
                .order_by(CarModel.id)
                .limit(1)
            )
            row = r.scalars().first()
        elif make and car:
            r = await db.execute(
                select(CarModel)
                .where(CarModel.make == make, CarModel.car == car)
                .order_by(CarModel.id)
                .limit(1)
            )
            row = r.scalars().first()
        else:
            return {"success": False, "error": "Invalid request parameters"}

        if not row:
            return {"success": False, "error": "Model not found"}

        return {"success": True, "modelUrl": row.model_url}
    except Exception:
        return {"success": False, "error": "Server error"}
