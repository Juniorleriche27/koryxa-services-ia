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
    async def send_operations_alert(
        self,
        recipient: str,
        alert_event: str,
        organization_id: str | None,
        details: dict[str, object],
    ) -> None:
        settings = get_settings()
        if not settings.smtp_host or not settings.smtp_username or not settings.smtp_password:
            raise ApplicationError("email_unavailable", "L’envoi d’e-mail n’est pas configuré", 503)

        message = EmailMessage()
        message["Subject"] = f"[KORYXA] Alerte production — {alert_event}"
        message["From"] = f"KORYXA Notifications <{settings.email_from}>"
        message["To"] = recipient
        safe_details = "\n".join(f"- {key}: {value}" for key, value in details.items())
        message.set_content(
            "Une alerte opérationnelle a été détectée.\n\n"
            f"Événement : {alert_event}\n"
            f"Organisation : {organization_id or 'système'}\n"
            f"Détails :\n{safe_details or '- aucun'}\n\n"
            "Consultez les journaux et le runbook de production KORYXA."
        )
        try:
            await asyncio.to_thread(self._send, message)
        except (OSError, smtplib.SMTPException) as exc:
            raise ApplicationError(
                "operations_alert_delivery_failed",
                "L’alerte opérationnelle n’a pas pu être envoyée",
                502,
            ) from exc

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
    async def send_contact_lead_notification(
        self,
        lead_name: str,
        company_name: str,
        business_sector: str,
        whatsapp_phone: str,
        email: str,
        message_text: str | None,
    ) -> None:
        settings = get_settings()
        target_email = settings.operations_alert_email or "contact@koryxa.fr"
        if not settings.smtp_host or not settings.smtp_username:
            return

        message = EmailMessage()
        message["Subject"] = f"🔥 Nouveau Prospect CAURI : {lead_name} ({company_name})"
        message["From"] = f"KORYXA <{settings.email_from}>"
        message["To"] = target_email
        message.set_content(
            f"Nouveau contact / demande de démo reçu pour CAURI :\n\n"
            f"👤 Nom : {lead_name}\n"
            f"🏢 Entreprise : {company_name}\n"
            f"🏷️ Secteur : {business_sector}\n"
            f"📱 WhatsApp : {whatsapp_phone}\n"
            f"✉️ Email : {email}\n"
            f"💬 Message : {message_text or 'Aucun message'}\n"
        )
        safe_name = html.escape(lead_name)
        safe_company = html.escape(company_name)
        safe_sector = html.escape(business_sector)
        safe_phone = html.escape(whatsapp_phone)
        safe_email = html.escape(email)
        safe_msg = html.escape(message_text or 'Aucun message particulier')
        clean_phone = "".join(c for c in whatsapp_phone if c.isdigit())
        wa_link = f"https://wa.me/{clean_phone}"

        message.add_alternative(
            f"""<!doctype html><html><body style="margin:0;background:#f3fbf7;font-family:Arial,sans-serif;color:#153126">
            <div style="max-width:600px;margin:32px auto;background:white;border:1px solid #dceee4;border-radius:20px;padding:32px">
            <p style="color:#009b67;font-weight:700;letter-spacing:.12em;text-transform:uppercase;font-size:12px">KORYXA · Nouveau Prospect CAURI</p>
            <h2 style="font-family:Georgia,serif;font-size:24px;margin-top:8px">Demande de Démo Reçue</h2>
            <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px">
              <tr style="border-bottom:1px solid #edf2f7"><td style="padding:10px 0;color:#718096;width:120px">Nom :</td><td style="padding:10px 0;font-weight:bold">{safe_name}</td></tr>
              <tr style="border-bottom:1px solid #edf2f7"><td style="padding:10px 0;color:#718096">Entreprise :</td><td style="padding:10px 0;font-weight:bold">{safe_company}</td></tr>
              <tr style="border-bottom:1px solid #edf2f7"><td style="padding:10px 0;color:#718096">Secteur :</td><td style="padding:10px 0;font-weight:bold">{safe_sector}</td></tr>
              <tr style="border-bottom:1px solid #edf2f7"><td style="padding:10px 0;color:#718096">WhatsApp :</td><td style="padding:10px 0;font-weight:bold"><a href="{wa_link}" style="color:#009b67">{safe_phone}</a></td></tr>
              <tr style="border-bottom:1px solid #edf2f7"><td style="padding:10px 0;color:#718096">Email :</td><td style="padding:10px 0;font-weight:bold"><a href="mailto:{safe_email}" style="color:#009b67">{safe_email}</a></td></tr>
              <tr><td style="padding:10px 0;color:#718096" colspan="2"><strong>Message / Besoin :</strong><br/><p style="margin-top:6px;color:#2d3748;background:#f7fafc;padding:12px;border-radius:8px">{safe_msg}</p></td></tr>
            </table>
            <p style="margin-top:24px"><a href="{wa_link}" style="display:inline-block;background:#25D366;color:white;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:12px">Contacter sur WhatsApp</a></p>
            </div></body></html>""",
            subtype="html",
        )
        try:
            await asyncio.to_thread(self._send, message)
        except Exception:
            pass

    @staticmethod
    def _send(message: EmailMessage) -> None:
        settings = get_settings()
        if not settings.smtp_host or not settings.smtp_username:
            raise ApplicationError("email_unavailable", "L’envoi d’e-mail n’est pas configuré", 503)
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
