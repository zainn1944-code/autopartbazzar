import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import get_settings
from database import get_db
from dependencies import get_current_user
from models.order import Order
from models.user import User
from routers.orders import notify_order_confirmed
from services.payment_service import verify_jazzcash_response

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payments", tags=["payments"])


class MockComplete(BaseModel):
    order_id: int
    outcome: str = "success"  # "success" | "fail"


def _frontend_redirect(status: str, order_id: int | None) -> RedirectResponse:
    base = get_settings().frontend_base_url.rstrip("/")
    qs = f"payment={status}"
    if order_id:
        qs += f"&order={order_id}"
    # 303 forces the browser to switch JazzCash's POST into a GET.
    return RedirectResponse(url=f"{base}/order-confirmation?{qs}", status_code=303)


@router.post("/jazzcash/callback")
async def jazzcash_callback(request: Request, db: AsyncSession = Depends(get_db)):
    """JazzCash redirects the customer's browser here (form POST) after payment."""
    form = await request.form()
    response = {k: str(v) for k, v in form.items()}

    result = verify_jazzcash_response(response)
    order_id = result["order_id"]

    if not result["valid"]:
        logger.warning("JazzCash callback failed hash verification: %s", response.get("pp_TxnRefNo"))
        return _frontend_redirect("failed", order_id)

    if order_id is None:
        logger.warning("JazzCash callback had no resolvable order id")
        return _frontend_redirect("failed", None)

    order = (await db.execute(select(Order).where(Order.id == order_id))).scalar_one_or_none()
    if order is None:
        logger.warning("JazzCash callback for unknown order %s", order_id)
        return _frontend_redirect("failed", order_id)

    # Idempotent: JazzCash may deliver the callback more than once. If we've
    # already settled this order, don't re-process or re-send the email.
    if order.payment_status == "Paid":
        return _frontend_redirect("success", order_id)
    if order.payment_status == "Failed" and not result["success"]:
        return _frontend_redirect("failed", order_id)

    order.payment_ref = result["txn_ref"]
    if result["success"]:
        order.payment_status = "Paid"
        await db.commit()
        await db.refresh(order)
        await notify_order_confirmed(db, order)
        return _frontend_redirect("success", order_id)

    order.payment_status = "Failed"
    await db.commit()
    logger.info(
        "JazzCash payment failed for order %s: %s %s",
        order_id, result["response_code"], result["message"],
    )
    return _frontend_redirect("failed", order_id)


@router.post("/mock/complete")
async def mock_complete(
    body: MockComplete,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Settle an order via the built-in demo gateway (no real payment).

    Only available when the active online provider is the mock gateway, and only
    for orders that belong to the calling user — so it can't be abused to mark
    arbitrary orders paid in a real deployment.
    """
    if get_settings().online_payment_provider != "mock":
        raise HTTPException(status_code=404, detail="Not found")

    order = (
        await db.execute(
            select(Order).where(Order.id == body.order_id, Order.user_id == user.id)
        )
    ).scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")

    # Idempotent: a retried settle on an already-paid order is a no-op.
    if order.payment_status == "Paid":
        return {"status": "success", "orderId": order.id}

    if body.outcome == "success":
        order.payment_status = "Paid"
        order.payment_ref = f"MOCK-{order.id}"
        await db.commit()
        await db.refresh(order)
        await notify_order_confirmed(db, order)
        return {"status": "success", "orderId": order.id}

    order.payment_status = "Failed"
    await db.commit()
    return {"status": "failed", "orderId": order.id}
