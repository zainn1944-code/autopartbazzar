from fastapi import APIRouter, Depends

from dependencies import require_admin_user
from services.parts_sync import fetch_and_store_daily_parts, get_last_sync_report

router = APIRouter(prefix="/admin/sync", tags=["admin-sync"])


@router.post("/trigger", dependencies=[Depends(require_admin_user)])
async def trigger_sync():
    return await fetch_and_store_daily_parts(triggered_by="admin-manual")


@router.get("/status", dependencies=[Depends(require_admin_user)])
async def sync_status():
    return get_last_sync_report()
