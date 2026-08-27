# HTML email markup is intentionally kept inline so the template remains self-contained.
# ruff: noqa: E501

from __future__ import annotations

import asyncio
import html
import smtplib
import ssl
from email.message import EmailMessage

from app.core.config import get_settings
from app.core.errors import ApplicationError


class EmailService:
    async def send_invitation(self, recipient: str, organization_name: str, link: str) -> None:
        settings = get_settings()
        if not settings.smtp_host or not settings.smtp_username or not settings.smtp_password:
            if settings.environment == "production":
                raise ApplicationError(
                    "email_unavailable", "L’envoi d’e-mail n’est pas configuré", 503
                )
            return

        message = EmailMessage()
        message["Subject"] = f"Vous êtes invité(e) à rejoindre {organization_name}"
        message["From"] = f"KORYXA <{settings.email_from}>"
        message["To"] = recipient
        message.set_content(
            f"Vous avez été invité(e) à rejoindre {organization_name} sur Mémoire opérationnelle.\n\n"
            f"Accepter l’invitation : {link}\n\nCe lien expire dans 7 jours."
        )
        safe_name = html.escape(organization_name)
        safe_link = html.escape(link, quote=True)
        message.add_alternative(
            f"""<!doctype html><html><body style="margin:0;background:#f3fbf7;font-family:Arial,sans-serif;color:#153126">
            <div style="max-width:600px;margin:32px auto;background:white;border:1px solid #dceee4;border-radius:20px;padding:36px">
            <p style="color:#009b67;font-weight:700;letter-spacing:.12em;text-transform:uppercase">KORYXA · Mémoire opérationnelle</p>
            <h1 style="font-family:Georgia,serif;font-size:32px">Rejoignez {safe_name}</h1>
            <p style="line-height:1.7;color:#5f746b">Vous avez été invité(e) à rejoindre l’espace de cette entreprise.</p>
            <p style="margin:30px 0"><a href="{safe_link}" style="display:inline-block;background:#00a86b;color:white;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:12px">Accepter l’invitation</a></p>
            <p style="font-size:12px;color:#768a81">Ce lien personnel expire dans 7 jours. Ne le transférez pas.</p>
            </div></body></html>""",
            subtype="html",
        )
        try:
            await asyncio.to_thread(self._send, message)
        except (OSError, smtplib.SMTPException) as exc:
            raise ApplicationError(
                "email_delivery_failed", "L’e-mail d’invitation n’a pas pu être envoyé", 502
            ) from exc

    @staticmethod
    def _send(message: EmailMessage) -> None:
        settings = get_settings()
        if not settings.smtp_host or not settings.smtp_username:
            raise ApplicationError(
                "email_unavailable", "L’envoi d’e-mail n’est pas configuré", 503
            )
        password = settings.smtp_password.get_secret_value() if settings.smtp_password else ""
        if settings.smtp_use_ssl:
            with smtplib.SMTP_SSL(
                settings.smtp_host,
                settings.smtp_port,
                context=ssl.create_default_context(),
                timeout=20,
            ) as client:
                client.login(settings.smtp_username, password)
                client.send_message(message)
        else:
            with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=20) as client:
                client.starttls(context=ssl.create_default_context())
                client.login(settings.smtp_username, password)
                client.send_message(message)
