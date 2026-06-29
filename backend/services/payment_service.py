"""JazzCash online payment integration (HTTP POST / Page Redirection).

Flow:
  1. build_jazzcash_payment() builds the signed form fields the browser POSTs
     to JazzCash's hosted checkout page.
  2. The customer pays on JazzCash and is redirected (browser POST) back to
     pp_ReturnURL.
  3. verify_jazzcash_response() recomputes the secure hash on the returned
     fields and tells us whether the payment succeeded.

The secure hash is an HMAC-SHA256 over the alphabetically-sorted, non-empty
field values joined by '&', prefixed with the integrity salt, keyed by the
same integrity salt (the standard JazzCash algorithm).
"""

import hashlib
import hmac
from datetime import datetime, timedelta

from config import get_settings


def _secure_hash(fields: dict[str, str], integrity_salt: str) -> str:
    # Only pp_* / ppmpf_* fields with non-empty values participate, sorted by key.
    relevant = {
        k: v
        for k, v in fields.items()
        if k.lower().startswith("pp") and k != "pp_SecureHash" and str(v) != ""
    }
    ordered_values = [str(relevant[k]) for k in sorted(relevant, key=str.lower)]
    message = integrity_salt + "&" + "&".join(ordered_values)
    return hmac.new(
        integrity_salt.encode("utf-8"),
        message.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest().upper()


def build_jazzcash_payment(order_id: int, amount: float, description: str) -> dict:
    """Return {url, fields} for an auto-submitting browser form to JazzCash."""
    settings = get_settings()
    if not settings.jazzcash_enabled:
        raise RuntimeError("JazzCash is not configured (set JAZZCASH_* in .env)")

    now = datetime.now()
    txn_ref = f"T{now.strftime('%Y%m%d%H%M%S')}{order_id}"
    # Amount is sent in the smallest currency unit (paisa), no decimals.
    amount_paisa = str(int(round(amount * 100)))

    fields = {
        "pp_Version": "1.1",
        # Empty TxnType → JazzCash hosted page offers wallet + card + OTC.
        "pp_TxnType": settings.jazzcash_txn_type or "",
        "pp_Language": "EN",
        "pp_MerchantID": settings.jazzcash_merchant_id,
        "pp_SubMerchantID": "",
        "pp_Password": settings.jazzcash_password,
        "pp_BankID": "",
        "pp_ProductID": "",
        "pp_TxnRefNo": txn_ref,
        "pp_Amount": amount_paisa,
        "pp_TxnCurrency": "PKR",
        "pp_TxnDateTime": now.strftime("%Y%m%d%H%M%S"),
        "pp_BillReference": f"order{order_id}",
        "pp_Description": description[:255] or "Auto Part Bazar order",
        "pp_TxnExpiryDateTime": (now + timedelta(hours=1)).strftime("%Y%m%d%H%M%S"),
        "pp_ReturnURL": settings.jazzcash_return_url,
        "ppmpf_1": str(order_id),
        "ppmpf_2": "",
        "ppmpf_3": "",
        "ppmpf_4": "",
        "ppmpf_5": "",
    }
    fields["pp_SecureHash"] = _secure_hash(fields, settings.jazzcash_integrity_salt)

    return {
        "provider": "jazzcash",
        "url": settings.jazzcash_post_url,
        "fields": fields,
        "txnRefNo": txn_ref,
    }


def build_mock_payment(order_id: int, amount: float) -> dict:
    """Built-in demo gateway: send the customer to an in-app payment screen.

    No external account and no real money — the mock screen calls back to
    /payments/mock/complete to settle the order. Used when no real gateway is
    configured (PAYMENT_MODE=auto/mock).
    """
    return {
        "provider": "mock",
        "redirectUrl": f"/mock-payment?order={order_id}&amount={int(round(amount))}",
    }


def verify_jazzcash_response(response: dict[str, str]) -> dict:
    """Validate JazzCash's callback. Returns {valid, success, order_id, txn_ref, message}."""
    settings = get_settings()
    salt = settings.jazzcash_integrity_salt or ""

    received_hash = (response.get("pp_SecureHash") or "").upper()
    expected_hash = _secure_hash(response, salt)
    valid = bool(received_hash) and hmac.compare_digest(received_hash, expected_hash)

    response_code = response.get("pp_ResponseCode") or ""
    # "000" = success; "121" = pending/in-progress on some flows.
    success = valid and response_code == "000"

    order_id = response.get("ppmpf_1") or ""
    if not order_id:
        bill_ref = response.get("pp_BillReference") or ""
        if bill_ref.startswith("order"):
            order_id = bill_ref[len("order"):]

    return {
        "valid": valid,
        "success": success,
        "order_id": int(order_id) if str(order_id).isdigit() else None,
        "txn_ref": response.get("pp_TxnRefNo") or "",
        "response_code": response_code,
        "message": response.get("pp_ResponseMessage") or "",
    }
