"""
alerts.py — Outbound email alerts for Wesley Library.

Sends overdue reminders via SendGrid (preferred) or SMTP fallback.
Configure in .env:
  SENDGRID_API_KEY=SG.xxx          # SendGrid
  ALERT_FROM_EMAIL=library@...     # Sender address (required for both)
  ALERT_FROM_NAME=Wesley Library   # Optional display name

  # SMTP fallback (if no SENDGRID_API_KEY):
  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=587
  SMTP_USER=you@gmail.com
  SMTP_PASSWORD=app-password
"""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

LIBRARY_NAME = os.getenv("ALERT_FROM_NAME", "Wesley Monumental UMC Library")
FROM_EMAIL    = os.getenv("ALERT_FROM_EMAIL", "")
OVERDUE_DAYS  = 14


def _subject(title: str) -> str:
    return f"Library reminder: "{title}" is due back"


def _body_text(patron: str, title: str, days_out: int) -> str:
    return (
        f"Hi {patron},\n\n"
        f"This is a friendly reminder from {LIBRARY_NAME}.\n\n"
        f"The book "{title}" has been checked out for {days_out} day{'s' if days_out != 1 else ''}. "
        f"Our standard loan period is {OVERDUE_DAYS} days.\n\n"
        f"Please return it at your earliest convenience. Thank you!\n\n"
        f"— {LIBRARY_NAME}"
    )


def _body_html(patron: str, title: str, days_out: int) -> str:
    overdue = days_out > OVERDUE_DAYS
    color   = "#b91c1c" if overdue else "#92400e"
    label   = f"<strong style='color:{color}'>{days_out} days</strong>"
    return f"""
<div style="font-family:Georgia,serif;max-width:540px;margin:0 auto;padding:24px">
  <h2 style="color:#1a3d2b;margin-bottom:4px">{LIBRARY_NAME}</h2>
  <hr style="border:none;border-top:1px solid #d1d5db;margin-bottom:20px">
  <p>Hi {patron},</p>
  <p>This is a friendly reminder that <strong>"{title}"</strong> has been
  checked out for {label}. Our standard loan period is {OVERDUE_DAYS} days.</p>
  <p>Please return it at your earliest convenience. Thank you!</p>
  <p style="margin-top:32px;color:#6b7280;font-size:.85em">— {LIBRARY_NAME}</p>
</div>"""


def _send_via_sendgrid(to_email: str, subject: str, text: str, html: str) -> None:
    import sendgrid
    from sendgrid.helpers.mail import Mail, Email, To, Content, HtmlContent

    sg = sendgrid.SendGridAPIClient(api_key=os.environ["SENDGRID_API_KEY"])
    message = Mail(
        from_email=Email(FROM_EMAIL, LIBRARY_NAME),
        to_emails=To(to_email),
        subject=subject,
    )
    message.content = [Content("text/plain", text), Content("text/html", html)]
    sg.client.mail.send.post(request_body=message.get())


def _send_via_smtp(to_email: str, subject: str, text: str, html: str) -> None:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = f"{LIBRARY_NAME} <{FROM_EMAIL}>"
    msg["To"]      = to_email
    msg.attach(MIMEText(text, "plain"))
    msg.attach(MIMEText(html, "html"))

    host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    port = int(os.getenv("SMTP_PORT", 587))
    user = os.getenv("SMTP_USER", FROM_EMAIL)
    pw   = os.getenv("SMTP_PASSWORD", "")

    with smtplib.SMTP(host, port) as s:
        s.starttls()
        s.login(user, pw)
        s.sendmail(FROM_EMAIL, to_email, msg.as_string())


def send_one_overdue_email(patron: str, to_email: str, title: str, days_out: int) -> None:
    subject = _subject(title)
    text    = _body_text(patron, title, days_out)
    html    = _body_html(patron, title, days_out)
    if os.getenv("SENDGRID_API_KEY"):
        _send_via_sendgrid(to_email, subject, text, html)
    else:
        _send_via_smtp(to_email, subject, text, html)


def send_overdue_emails(books: list[dict], min_days: int = OVERDUE_DAYS) -> dict:
    """
    Given a list of overdue book dicts (from fetch_overdue_books),
    send reminder emails to patrons who have an email on file and are
    at or past min_days. Returns a summary dict.
    """
    if not FROM_EMAIL:
        return {"error": "ALERT_FROM_EMAIL not configured", "sent": 0, "skipped": 0, "failed": 0}

    sent = skipped = failed = 0
    details = []

    for book in books:
        days_out = int(book.get("days_out") or 0)
        if days_out < min_days:
            skipped += 1
            continue

        email  = (book.get("patron_email") or "").strip()
        patron = (book.get("checked_out_by") or "Patron").strip()
        title  = (book.get("title") or book.get("isbn") or "a library book").strip()

        if not email:
            skipped += 1
            details.append({"isbn": book.get("isbn"), "status": "skipped", "reason": "no email"})
            continue

        try:
            send_one_overdue_email(patron, email, title, days_out)
            sent += 1
            details.append({"isbn": book.get("isbn"), "patron": patron, "email": email, "status": "sent"})
        except Exception as e:
            failed += 1
            details.append({"isbn": book.get("isbn"), "patron": patron, "status": "failed", "error": str(e)})

    return {"sent": sent, "skipped": skipped, "failed": failed, "details": details}
