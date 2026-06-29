from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from dependencies import get_current_user
from models.saved_build import SavedBuild
from models.user import User

router = APIRouter(prefix="/builds", tags=["saved-builds"])

MAX_BUILDS_PER_USER = 25


class BuildIn(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    car_make: str = Field(..., min_length=1, max_length=64)
    car_model: str = Field(..., min_length=1, max_length=64)
    car_year: int | None = None
    model_url: str | None = Field(None, max_length=512)
    config: dict


class BuildOut(BaseModel):
    id: int
    name: str
    car_make: str
    car_model: str
    car_year: int | None
    model_url: str | None
    config: dict
    created_at: datetime
    updated_at: datetime


def _serialize(build: SavedBuild) -> BuildOut:
    return BuildOut(
        id=build.id,
        name=build.name,
        car_make=build.car_make,
        car_model=build.car_model,
        car_year=build.car_year,
        model_url=build.model_url,
        config=build.config,
        created_at=build.created_at,
        updated_at=build.updated_at,
    )


@router.get("", response_model=list[BuildOut])
async def list_builds(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(SavedBuild)
        .where(SavedBuild.user_id == current_user.id)
        .order_by(SavedBuild.updated_at.desc())
    )
    rows = (await db.execute(stmt)).scalars().all()
    return [_serialize(b) for b in rows]


@router.post("", response_model=BuildOut, status_code=status.HTTP_201_CREATED)
async def create_build(
    body: BuildIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Soft cap: prevent runaway accumulation per user.
    count_stmt = select(SavedBuild).where(SavedBuild.user_id == current_user.id)
    existing = (await db.execute(count_stmt)).scalars().all()
    if len(existing) >= MAX_BUILDS_PER_USER:
        raise HTTPException(
            status_code=400,
            detail=f"You've reached the maximum of {MAX_BUILDS_PER_USER} saved builds. Delete one first.",
        )

    build = SavedBuild(
        user_id=current_user.id,
        name=body.name.strip(),
        car_make=body.car_make,
        car_model=body.car_model,
        car_year=body.car_year,
        model_url=body.model_url,
        config=body.config,
    )
    db.add(build)
    await db.commit()
    await db.refresh(build)
    return _serialize(build)


@router.get("/{build_id}", response_model=BuildOut)
async def get_build(
    build_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    build = await db.get(SavedBuild, build_id)
    if not build or build.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Build not found")
    return _serialize(build)


@router.put("/{build_id}", response_model=BuildOut)
async def update_build(
    build_id: int,
    body: BuildIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    build = await db.get(SavedBuild, build_id)
    if not build or build.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Build not found")
    build.name = body.name.strip()
    build.car_make = body.car_make
    build.car_model = body.car_model
    build.car_year = body.car_year
    build.model_url = body.model_url
    build.config = body.config
    await db.commit()
    await db.refresh(build)
    return _serialize(build)


@router.delete("/{build_id}", status_code=204)
async def delete_build(
    build_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    build = await db.get(SavedBuild, build_id)
    if not build or build.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Build not found")
    await db.delete(build)
    await db.commit()
    return None
