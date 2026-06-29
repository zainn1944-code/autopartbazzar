import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from config import get_settings

# ── Brand palette ─────────────────────────────────────────────────────────────
_BRAND = "Auto Part Bazar"
_RED = "#b91c1c"
_DARK = "#0f172a"
_MUTED = "#6b7280"
_BORDER = "#e5e7eb"
_BG = "#f3f4f6"


def _send(to_email: str, subject: str, body_html: str) -> None:
    settings = get_settings()
    if not settings.email_user or not settings.email_pass:
        raise RuntimeError("Email is not configured (EMAIL_USER / EMAIL_PASS)")

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{_BRAND} <{settings.email_user}>"
    msg["To"] = to_email
    msg.attach(MIMEText(body_html, "html"))

    with smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port) as server:
        server.login(settings.email_user, settings.email_pass)
        server.send_message(msg)


def _layout(inner_html: str, preheader: str = "") -> str:
    """Wrap content in a consistent branded shell (header bar + card + footer).

    `preheader` is the short grey snippet shown in inbox previews (hidden in body).
    """
    return f"""\
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:{_BG};">
  <span style="display:none!important;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;">{preheader}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:{_BG};padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
             style="max-width:600px;background:#ffffff;border:1px solid {_BORDER};border-radius:12px;overflow:hidden;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
        <tr>
          <td style="background:{_DARK};padding:20px 28px;">
            <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:.3px;">Auto<span style="color:{_RED};">Part</span>Bazar</span>
          </td>
        </tr>
        <tr><td style="padding:28px;">{inner_html}</td></tr>
        <tr>
          <td style="padding:18px 28px;background:#fafafa;border-top:1px solid {_BORDER};">
            <p style="margin:0;color:{_MUTED};font-size:12px;line-height:1.6;">
              This is an automated message from {_BRAND}. Please do not reply to this email.<br>
              If you did not request this, you can safely ignore it.
            </p>
          </td>
        </tr>
      </table>
      <p style="color:#9ca3af;font-size:11px;margin:16px 0 0;">© {_BRAND}. All rights reserved.</p>
    </td></tr>
  </table>
</body>
</html>"""


def _otp_block(otp: str) -> str:
    return f"""\
    <div style="margin:24px 0;text-align:center;">
      <div style="display:inline-block;background:#fef2f2;border:1px dashed {_RED};border-radius:10px;padding:16px 28px;">
        <span style="font-size:34px;font-weight:700;letter-spacing:10px;color:{_DARK};">{otp}</span>
      </div>
    </div>"""


# ── 1) Signup / account verification OTP ──────────────────────────────────────
def send_signup_otp_email(to_email: str, otp: str) -> None:
    inner = f"""\
    <h1 style="margin:0 0 8px;font-size:22px;color:{_DARK};">Welcome to {_BRAND}! 🚗</h1>
    <p style="margin:0 0 4px;color:#374151;font-size:15px;line-height:1.6;">
      Thanks for signing up. Use the verification code below to activate your account
      and start exploring premium auto parts.
    </p>
    {_otp_block(otp)}
    <p style="margin:0;color:{_MUTED};font-size:13px;line-height:1.6;">
      This code is valid for <strong>10 minutes</strong>. Do not share it with anyone —
      {_BRAND} will never ask you for it.
    </p>"""
    _send(to_email, f"Verify your account - {_BRAND}", _layout(inner, "Your account verification code"))


# ── 2) Forgot-password OTP ────────────────────────────────────────────────────
def send_password_reset_otp_email(to_email: str, otp: str) -> None:
    inner = f"""\
    <h1 style="margin:0 0 8px;font-size:22px;color:{_DARK};">Reset your password</h1>
    <p style="margin:0 0 4px;color:#374151;font-size:15px;line-height:1.6;">
      We received a request to reset the password for your {_BRAND} account.
      Enter the one-time code below to continue.
    </p>
    {_otp_block(otp)}
    <p style="margin:0;color:{_MUTED};font-size:13px;line-height:1.6;">
      This code is valid for <strong>10 minutes</strong>. If you didn't request a password
      reset, you can ignore this email — your password will stay the same.
    </p>"""
    _send(to_email, f"Password reset code - {_BRAND}", _layout(inner, "Your password reset code"))


# Backward-compatible alias (older callers used send_otp_email for password reset).
send_otp_email = send_password_reset_otp_email


# ── 3) Order confirmation (with shipping address + price breakdown) ────────────
def send_order_confirmation_email(
    to_email: str,
    order_id: int,
    total: float,
    items: list[dict],
    shipping_address: dict | None = None,
    subtotal: float | None = None,
    shipping_fee: float | None = None,
    payment_method: str | None = None,
) -> None:
    rows = "".join(
        f"<tr>"
        f"<td style='padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:14px;color:{_DARK};'>{i.get('name','Item')}</td>"
        f"<td style='padding:10px 12px;border-bottom:1px solid #f3f4f6;text-align:center;font-size:14px;color:{_MUTED};'>{i.get('quantity',1)}</td>"
        f"<td style='padding:10px 12px;border-bottom:1px solid #f3f4f6;text-align:right;font-size:14px;color:{_DARK};'>Rs {i.get('price',0):,.0f}</td>"
        f"</tr>"
        for i in items
    )

    # Optional price breakdown rows (only shown when values are provided).
    breakdown = ""
    if subtotal is not None:
        breakdown += (
            f"<tr><td colspan='2' style='padding:6px 12px;text-align:right;color:{_MUTED};font-size:13px;'>Subtotal</td>"
            f"<td style='padding:6px 12px;text-align:right;color:{_DARK};font-size:13px;'>Rs {subtotal:,.0f}</td></tr>"
        )
    if shipping_fee is not None:
        ship_label = "Free" if shipping_fee == 0 else f"Rs {shipping_fee:,.0f}"
        breakdown += (
            f"<tr><td colspan='2' style='padding:6px 12px;text-align:right;color:{_MUTED};font-size:13px;'>Shipping</td>"
            f"<td style='padding:6px 12px;text-align:right;color:{_DARK};font-size:13px;'>{ship_label}</td></tr>"
        )

    # Shipping address card (rendered only when address is supplied).
    address_card = ""
    if shipping_address:
        a = shipping_address
        line_parts = [
            a.get("address"),
            a.get("city"),
            a.get("postalCode"),
            a.get("country"),
        ]
        addr_line = ", ".join(p for p in line_parts if p)
        address_card = f"""\
        <div style="margin:20px 0;padding:16px;background:#f9fafb;border:1px solid {_BORDER};border-radius:10px;">
          <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:{_MUTED};">Shipping to</p>
          <p style="margin:0;font-size:14px;color:{_DARK};line-height:1.6;">
            <strong>{a.get('fullName','')}</strong><br>
            {addr_line}<br>
            {('📞 ' + a.get('phone')) if a.get('phone') else ''}
          </p>
        </div>"""

    pay_line = ""
    if payment_method:
        nice = "Cash on Delivery" if payment_method.upper() == "COD" else payment_method
        pay_line = (
            f"<p style='margin:4px 0 0;color:{_MUTED};font-size:13px;'>Payment method: <strong>{nice}</strong></p>"
        )

    inner = f"""\
    <h1 style="margin:0 0 8px;font-size:22px;color:{_DARK};">Order confirmed! ✅</h1>
    <p style="margin:0 0 4px;color:#374151;font-size:15px;line-height:1.6;">
      Thank you for your order. We've received order
      <strong style="color:{_RED};">#{order_id}</strong> and it's being processed.
    </p>
    {pay_line}
    {address_card}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 0;border-collapse:collapse;">
      <thead>
        <tr style="background:#f9fafb;">
          <th align="left"   style="padding:10px 12px;font-size:12px;color:{_MUTED};text-transform:uppercase;letter-spacing:.5px;">Item</th>
          <th align="center" style="padding:10px 12px;font-size:12px;color:{_MUTED};text-transform:uppercase;letter-spacing:.5px;">Qty</th>
          <th align="right"  style="padding:10px 12px;font-size:12px;color:{_MUTED};text-transform:uppercase;letter-spacing:.5px;">Price</th>
        </tr>
      </thead>
      <tbody>{rows}</tbody>
      <tfoot>
        {breakdown}
        <tr>
          <td colspan="2" style="padding:12px;text-align:right;font-size:16px;font-weight:700;color:{_DARK};border-top:2px solid {_BORDER};">Total</td>
          <td style="padding:12px;text-align:right;font-size:16px;font-weight:700;color:{_RED};border-top:2px solid {_BORDER};">Rs {total:,.0f}</td>
        </tr>
      </tfoot>
    </table>
    <p style="margin:20px 0 0;color:{_MUTED};font-size:13px;line-height:1.6;">
      We'll send you another email once your order ships. Thanks for shopping with {_BRAND}!
    </p>"""
    _send(to_email, f"Order Confirmed #{order_id} - {_BRAND}", _layout(inner, f"Your order #{order_id} is confirmed"))
