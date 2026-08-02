# ruff: noqa: E501
# mypy: disable-error-code="no-untyped-def,no-untyped-call,import-untyped,no-any-return,operator,attr-defined"
from __future__ import annotations

import csv
import io
from datetime import UTC, date, datetime
from decimal import Decimal

from openpyxl import load_workbook
from sqlalchemy import delete, select

from app.core.errors import ApplicationError
from app.models.imports import ImportJob, ImportStatus
from app.models.registers import Offer, PaymentStatus, Procedure, RecordSource, Sale

FIELD_MAPS = {
    "offers": {
        "name": ["name", "nom", "offre"],
        "price": ["price", "prix", "tarif"],
        "currency": ["currency", "devise"],
        "category": ["category", "categorie", "catégorie"],
    },
    "sales": {
        "reference": ["reference", "référence", "ref"],
        "sale_date": ["sale_date", "date", "date vente"],
        "client_name": ["client_name", "client"],
        "item_label": ["item_label", "produit", "service", "offre"],
        "quantity": ["quantity", "quantite", "quantité"],
        "unit_price": ["unit_price", "prix unitaire"],
        "discount": ["discount", "remise"],
        "payment_method": ["payment_method", "mode paiement"],
        "payment_status": ["payment_status", "etat paiement", "état paiement"],
    },
    "procedures": {
        "title": ["title", "titre", "procedure", "procédure"],
        "objective": ["objective", "objectif"],
        "department": ["department", "service"],
        "responsible_user_id": ["responsible_user_id", "responsable"],
    },
}
REQUIRED = {
    "offers": {"name"},
    "sales": {"reference", "sale_date", "item_label"},
    "procedures": {"title"},
}


class ImportService:
    def parse(self, filename: str, content: bytes) -> list[dict[str, object]]:
        extension = filename.lower().rsplit(".", 1)[-1]
        if extension == "csv":
            text = content.decode("utf-8-sig")
            return [dict(row) for row in csv.DictReader(io.StringIO(text))]
        if extension == "xlsx":
            workbook = load_workbook(io.BytesIO(content), read_only=True, data_only=True)
            worksheet = workbook.active
            values = list(worksheet.iter_rows(values_only=True))
            if not values:
                return []
            headers = [str(value or "").strip() for value in values[0]]
            return [
                {headers[index]: value for index, value in enumerate(row)} for row in values[1:]
            ]
        raise ApplicationError(
            "unsupported_file",
            "Seuls les fichiers CSV et XLSX sont acceptés",
            415,
        )

    def suggest(self, headers: list[str], register_type: str) -> dict[str, str]:
        suggestions: dict[str, str] = {}
        for header in headers:
            normalized = header.strip().lower()
            for field, aliases in FIELD_MAPS[register_type].items():
                if normalized in aliases:
                    suggestions[header] = field
        return suggestions

    async def preview(
        self,
        session,
        organization_id: str,
        user_id: str,
        register_type: str,
        filename: str,
        content: bytes,
    ) -> tuple[ImportJob, list[str], dict[str, str]]:
        if register_type not in FIELD_MAPS:
            raise ApplicationError("invalid_register", "Registre invalide", 400)
        rows = self.parse(filename, content)
        if not rows:
            raise ApplicationError("empty_file", "Le fichier ne contient aucune donnée", 422)
        headers = list(rows[0].keys())
        mapping = self.suggest(headers, register_type)
        duplicates: list[int] = []
        seen: set[tuple[str, ...]] = set()
        for row_number, row in enumerate(rows, start=2):
            signature = tuple(str(row.get(header, "")) for header in headers)
            if signature in seen:
                duplicates.append(row_number)
            seen.add(signature)
        job = ImportJob(
            organization_id=organization_id,
            register_type=register_type,
            filename=filename,
            status=ImportStatus.PREVIEW,
            column_mapping=mapping,
            preview_rows=rows,
            duplicate_rows=duplicates,
            row_count=len(rows),
            created_by_user_id=user_id,
        )
        session.add(job)
        await session.commit()
        await session.refresh(job)
        return job, headers, mapping

    async def confirm(
        self,
        session,
        organization_id: str,
        user_id: str,
        job_id: str,
        mapping: dict[str, str],
    ) -> ImportJob:
        job = await session.scalar(
            select(ImportJob).where(
                ImportJob.id == job_id,
                ImportJob.organization_id == organization_id,
            )
        )
        if job is None:
            raise ApplicationError("import_not_found", "Import introuvable", 404)
        if job.status != ImportStatus.PREVIEW:
            raise ApplicationError("import_not_pending", "Import déjà traité", 409)
        missing = REQUIRED[job.register_type] - set(mapping.values())
        if missing:
            raise ApplicationError(
                "mapping_incomplete",
                f"Champs requis manquants : {', '.join(sorted(missing))}",
                422,
            )
        imported_ids: list[str] = []
        errors: list[dict[str, object]] = []
        for row_number, row in enumerate(job.preview_rows, start=2):
            data = {target: row.get(source) for source, target in mapping.items()}
            try:
                record = self._build(job.register_type, organization_id, user_id, data)
                session.add(record)
                await session.flush()
                imported_ids.append(record.id)
            except Exception as exc:
                errors.append({"row": row_number, "message": str(exc)})
        if errors:
            await session.rollback()
            job = await session.scalar(
                select(ImportJob).where(
                    ImportJob.id == job_id,
                    ImportJob.organization_id == organization_id,
                )
            )
            assert job is not None
            job.status = ImportStatus.FAILED
            job.errors = errors
            job.failure_reason = "Une ou plusieurs lignes sont invalides"
            await session.commit()
            await session.refresh(job)
            return job
        job.status = ImportStatus.COMPLETED
        job.column_mapping = mapping
        job.imported_record_ids = imported_ids
        job.completed_at = datetime.now(UTC)
        await session.commit()
        await session.refresh(job)
        return job

    def _build(
        self,
        register_type: str,
        organization_id: str,
        user_id: str,
        data: dict[str, object],
    ):
        if register_type == "offers":
            return Offer(
                organization_id=organization_id,
                name=self._required_text(data, "name"),
                price=self._decimal(data.get("price"), nullable=True),
                currency=str(data.get("currency") or "XOF").upper(),
                category=self._optional_text(data.get("category")),
                source=RecordSource.EXCEL,
                created_by_user_id=user_id,
                updated_by_user_id=user_id,
            )
        if register_type == "sales":
            quantity = self._decimal(data.get("quantity"), default=Decimal("1"))
            unit_price = self._decimal(data.get("unit_price"), default=Decimal("0"))
            discount = self._decimal(data.get("discount"), default=Decimal("0"))
            payment_status = self._payment_status(data.get("payment_status"))
            return Sale(
                organization_id=organization_id,
                reference=self._required_text(data, "reference"),
                sale_date=self._date(data.get("sale_date")),
                client_name=self._optional_text(data.get("client_name")),
                item_label=self._required_text(data, "item_label"),
                quantity=quantity,
                unit_price=unit_price,
                discount=discount,
                total_amount=max(Decimal("0"), quantity * unit_price - discount),
                payment_method=self._optional_text(data.get("payment_method")),
                payment_status=payment_status,
                source=RecordSource.EXCEL,
                created_by_user_id=user_id,
                updated_by_user_id=user_id,
            )
        return Procedure(
            organization_id=organization_id,
            title=self._required_text(data, "title"),
            objective=self._optional_text(data.get("objective")),
            department=self._optional_text(data.get("department")),
            responsible_user_id=self._optional_text(data.get("responsible_user_id")),
            source=RecordSource.EXCEL,
            created_by_user_id=user_id,
            updated_by_user_id=user_id,
        )

    async def rollback(self, session, organization_id: str, job_id: str) -> ImportJob:
        job = await session.scalar(
            select(ImportJob).where(
                ImportJob.id == job_id,
                ImportJob.organization_id == organization_id,
            )
        )
        if job is None:
            raise ApplicationError("import_not_found", "Import introuvable", 404)
        if job.status != ImportStatus.COMPLETED:
            raise ApplicationError(
                "rollback_unavailable",
                "Seul un import terminé peut être annulé",
                409,
            )
        model = {"offers": Offer, "sales": Sale, "procedures": Procedure}[job.register_type]
        await session.execute(
            delete(model).where(
                model.organization_id == organization_id,
                model.id.in_(job.imported_record_ids),
            )
        )
        job.status = ImportStatus.ROLLED_BACK
        await session.commit()
        await session.refresh(job)
        return job

    @staticmethod
    def _required_text(data: dict[str, object], field: str) -> str:
        value = str(data.get(field) or "").strip()
        if not value:
            raise ValueError(f"{field} est requis")
        return value

    @staticmethod
    def _optional_text(value: object) -> str | None:
        text = str(value or "").strip()
        return text or None

    @staticmethod
    def _decimal(
        value: object,
        default: Decimal | None = None,
        nullable: bool = False,
    ) -> Decimal | None:
        if value in (None, ""):
            if nullable:
                return None
            if default is not None:
                return default
            raise ValueError("Valeur numérique requise")
        return Decimal(str(value).replace(" ", "").replace(",", "."))

    @staticmethod
    def _date(value: object) -> date:
        if isinstance(value, datetime):
            return value.date()
        if isinstance(value, date):
            return value
        return date.fromisoformat(str(value))

    @staticmethod
    def _payment_status(value: object) -> PaymentStatus:
        normalized = str(value or "unpaid").strip().lower()
        aliases = {
            "non payé": PaymentStatus.UNPAID,
            "non paye": PaymentStatus.UNPAID,
            "partiellement payé": PaymentStatus.PARTIAL,
            "partiellement paye": PaymentStatus.PARTIAL,
            "payé": PaymentStatus.PAID,
            "paye": PaymentStatus.PAID,
            "annulé": PaymentStatus.CANCELLED,
            "annule": PaymentStatus.CANCELLED,
            "remboursé": PaymentStatus.REFUNDED,
            "rembourse": PaymentStatus.REFUNDED,
        }
        return aliases.get(normalized, PaymentStatus(normalized))
