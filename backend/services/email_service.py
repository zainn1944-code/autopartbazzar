import smtplib
from email.mime.text import MIMEText

from config import get_settings


def send_otp_email(to_email: str, otp: str) -> None:
    settings = get_settings()
    if not settings.email_user or not settings.email_pass:
        raise RuntimeError("Email is not configured (EMAIL_USER / EMAIL_PASS)")

    msg = MIMEText(f"Your OTP is: {otp}")
    msg["Subject"] = "Your OTP Code"
    msg["From"] = settings.email_user
    msg["To"] = to_email

    with smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port) as server:
        server.login(settings.email_user, settings.email_pass)
        server.send_message(msg)
