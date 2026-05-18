import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from config import get_settings


def _send(to_email: str, subject: str, body_html: str) -> None:
    settings = get_settings()
    if not settings.email_user or not settings.email_pass:
        raise RuntimeError("Email is not configured (EMAIL_USER / EMAIL_PASS)")

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.email_user
    msg["To"] = to_email
    msg.attach(MIMEText(body_html, "html"))

    with smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port) as server:
        server.login(settings.email_user, settings.email_pass)
        server.send_message(msg)


def send_otp_email(to_email: str, otp: str) -> None:
    html = f"""
    <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px;">
      <h2 style="color:#b91c1c;">AutoPart Bazaar</h2>
      <p>Your one-time password (OTP) is:</p>
      <h1 style="letter-spacing:8px;color:#1f2937;">{otp}</h1>
      <p style="color:#6b7280;font-size:13px;">Valid for 10 minutes. Do not share this code.</p>
    </div>
    """
    _send(to_email, "Your OTP Code – AutoPart Bazaar", html)


def send_order_confirmation_email(to_email: str, order_id: int, total: float, items: list[dict]) -> None:
    rows = "".join(
        f"<tr><td style='padding:6px 12px;border-bottom:1px solid #f3f4f6;'>{i.get('name','Item')}</td>"
        f"<td style='padding:6px 12px;border-bottom:1px solid #f3f4f6;text-align:center;'>{i.get('quantity',1)}</td>"
        f"<td style='padding:6px 12px;border-bottom:1px solid #f3f4f6;text-align:right;'>Rs {i.get('price',0):,.0f}</td></tr>"
        for i in items
    )
    html = f"""
    <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px;">
      <h2 style="color:#b91c1c;">AutoPart Bazaar</h2>
      <h3>Order Confirmed! 🎉</h3>
      <p>Thank you for your order. Your order <strong>#{order_id}</strong> has been received.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="padding:8px 12px;text-align:left;font-size:13px;">Item</th>
            <th style="padding:8px 12px;text-align:center;font-size:13px;">Qty</th>
            <th style="padding:8px 12px;text-align:right;font-size:13px;">Price</th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
      <p style="font-size:16px;font-weight:bold;text-align:right;">Total: Rs {total:,.0f}</p>
      <p style="color:#6b7280;font-size:13px;">We will notify you when your order is shipped.</p>
    </div>
    """
    _send(to_email, f"Order Confirmed #{order_id} – AutoPart Bazaar", html)
