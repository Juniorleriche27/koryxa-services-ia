# ruff: noqa: E501
# mypy: disable-error-code="no-untyped-def,no-untyped-call,attr-defined,no-any-return,comparison-overlap"
from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ApplicationError
from app.models.radar import AlertStatus, RadarAlert
from app.models.registers import Offer, Procedure, Sale
from app.models.workflow import (
    ActionComment,
    ActionStatus,
    AuditEvent,
    CorrectiveAction,
    ValidationRequest,
    ValidationStatus,
)
from app.schemas.workflow import ActionCreate, ActionUpdate, ValidationCreate, ValidationDecision

ALLOWED_FIELDS = {
    "offer": {
        "name",
        "description",
        "category",
        "price",
        "currency",
        "billing_unit",
        "conditions",
        "responsible_user_id",
        "effective_from",
        "expires_at",
        "status",
    },
    "sale": {
        "client_name",
        "item_label",
        "quantity",
        "unit_price",
        "discount",
        "total_amount",
        "currency",
        "payment_method",
        "payment_status",
        "seller_user_id",
        "sales_channel",
        "comment",
        "status",
    },
    "procedure": {
        "title",
        "objective",
        "department",
        "trigger",
        "responsible_user_id",
        "expected_result",
        "validation_date",
        "next_review_date",
        "status",
    },
}
MODELS = {"offer": Offer, "sale": Sale, "procedure": Procedure}


class WorkflowService:
    async def create_validation(
        self,
        session: AsyncSession,
        organization_id: str,
        user_id: str,
        data: ValidationCreate,
    ) -> ValidationRequest:
        await self._get_record(session, organization_id, data.record_type, data.record_id)
        if data.field_name not in ALLOWED_FIELDS.get(data.record_type, set()):
            raise ApplicationError("field_not_allowed", "Champ non validable", 422)
        validation = ValidationRequest(
            organization_id=organization_id,
            requested_by_user_id=user_id,
            **data.model_dump(),
        )
        session.add(validation)
        await session.flush()
        await self._audit(
            session,
            organization_id,
            "validation",
            validation.id,
            "validation.created",
            user_id,
            data.model_dump(mode="json"),
        )
        await session.commit()
        await session.refresh(validation)
        return validation

    async def decide_validation(
        self,
        session: AsyncSession,
        organization_id: str,
        user_id: str,
        validation_id: str,
        data: ValidationDecision,
    ) -> ValidationRequest:
        validation = await self._get_validation(session, organization_id, validation_id)
        if validation.status != ValidationStatus.PENDING:
            raise ApplicationError("validation_closed", "Cette validation est déjà traitée", 409)
        if data.decision == ValidationStatus.PENDING:
            raise ApplicationError("invalid_decision", "Décision finale requise", 422)
        final_value = None
        if data.decision == ValidationStatus.ACCEPTED:
            final_value = validation.proposed_value
        elif data.decision == ValidationStatus.CORRECTED:
            if data.corrected_value is None:
                raise ApplicationError("corrected_value_required", "Valeur corrigée requise", 422)
            final_value = data.corrected_value
        if data.decision in {ValidationStatus.ACCEPTED, ValidationStatus.CORRECTED}:
            record = await self._get_record(
                session,
                organization_id,
                validation.record_type,
                validation.record_id,
            )
            converted = self._convert_value(record, validation.field_name, final_value)
            setattr(record, validation.field_name, converted)
            if hasattr(record, "updated_by_user_id"):
                record.updated_by_user_id = user_id
            validation.final_value = self._json_value(converted)
        validation.status = data.decision
        validation.decided_by_user_id = user_id
        validation.justification = data.justification
        validation.decided_at = datetime.now(UTC)
        await self._audit(
            session,
            organization_id,
            "validation",
            validation.id,
            f"validation.{data.decision.value}",
            user_id,
            {
                "record_type": validation.record_type,
                "record_id": validation.record_id,
                "field_name": validation.field_name,
                "old_value": validation.old_value,
                "proposed_value": validation.proposed_value,
                "final_value": validation.final_value,
                "justification": data.justification,
            },
        )
        await session.commit()
        await session.refresh(validation)
        return validation

    async def list_validations(
        self,
        session: AsyncSession,
        organization_id: str,
        status: ValidationStatus | None,
    ) -> list[ValidationRequest]:
        statement = select(ValidationRequest).where(
            ValidationRequest.organization_id == organization_id
        )
        if status is not None:
            statement = statement.where(ValidationRequest.status == status)
        result = await session.scalars(statement.order_by(ValidationRequest.created_at.desc()))
        return list(result.all())

    async def create_action(
        self,
        session: AsyncSession,
        organization_id: str,
        user_id: str,
        data: ActionCreate,
    ) -> CorrectiveAction:
        if data.alert_id:
            alert = await self._get_alert(session, organization_id, data.alert_id)
            record_type = data.record_type or alert.record_type
            record_id = data.record_id or alert.record_id
        else:
            alert = None
            record_type = data.record_type
            record_id = data.record_id
        if record_type and record_id:
            await self._get_record(session, organization_id, record_type, record_id)
        action = CorrectiveAction(
            organization_id=organization_id,
            created_by_user_id=user_id,
            record_type=record_type,
            record_id=record_id,
            **data.model_dump(exclude={"record_type", "record_id"}),
        )
        session.add(action)
        if alert is not None and alert.status == AlertStatus.OPEN:
            alert.status = AlertStatus.ACKNOWLEDGED
        await session.flush()
        await self._audit(
            session,
            organization_id,
            "action",
            action.id,
            "action.created",
            user_id,
            data.model_dump(mode="json"),
        )
        await session.commit()
        await session.refresh(action)
        return action

    async def update_action(
        self,
        session: AsyncSession,
        organization_id: str,
        user_id: str,
        action_id: str,
        data: ActionUpdate,
    ) -> CorrectiveAction:
        action = await self._get_action(session, organization_id, action_id)
        changes = data.model_dump(exclude_unset=True, mode="json")
        previous_status = action.status
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(action, field, value)
        if data.status == ActionStatus.COMPLETED:
            if not action.resolution_evidence and not action.resolution_comment:
                raise ApplicationError(
                    "resolution_evidence_required",
                    "Une preuve ou un commentaire de résolution est requis",
                    422,
                )
            action.completed_by_user_id = user_id
            action.completed_at = datetime.now(UTC)
            if action.alert_id:
                alert = await self._get_alert(session, organization_id, action.alert_id)
                alert.status = AlertStatus.RESOLVED
        elif data.status is not None and data.status != ActionStatus.COMPLETED:
            action.completed_by_user_id = None
            action.completed_at = None
        await self._audit(
            session,
            organization_id,
            "action",
            action.id,
            "action.updated",
            user_id,
            {"previous_status": previous_status.value, "changes": changes},
        )
        await session.commit()
        await session.refresh(action)
        return action

    async def list_actions(
        self,
        session: AsyncSession,
        organization_id: str,
        status: ActionStatus | None,
        responsible_user_id: str | None,
    ) -> list[CorrectiveAction]:
        statement = select(CorrectiveAction).where(
            CorrectiveAction.organization_id == organization_id
        )
        if status is not None:
            statement = statement.where(CorrectiveAction.status == status)
        if responsible_user_id:
            statement = statement.where(CorrectiveAction.responsible_user_id == responsible_user_id)
        result = await session.scalars(statement.order_by(CorrectiveAction.created_at.desc()))
        return list(result.all())

    async def add_comment(
        self,
        session: AsyncSession,
        organization_id: str,
        user_id: str,
        action_id: str,
        body: str,
    ) -> ActionComment:
        await self._get_action(session, organization_id, action_id)
        comment = ActionComment(
            organization_id=organization_id,
            action_id=action_id,
            author_user_id=user_id,
            body=body,
        )
        session.add(comment)
        await session.flush()
        await self._audit(
            session,
            organization_id,
            "action",
            action_id,
            "action.comment_added",
            user_id,
            {"comment_id": comment.id},
        )
        await session.commit()
        await session.refresh(comment)
        return comment

    async def list_comments(
        self,
        session: AsyncSession,
        organization_id: str,
        action_id: str,
    ) -> list[ActionComment]:
        await self._get_action(session, organization_id, action_id)
        result = await session.scalars(
            select(ActionComment)
            .where(
                ActionComment.organization_id == organization_id,
                ActionComment.action_id == action_id,
            )
            .order_by(ActionComment.created_at)
        )
        return list(result.all())

    async def audit_events(
        self,
        session: AsyncSession,
        organization_id: str,
        entity_type: str | None,
        entity_id: str | None,
    ) -> list[AuditEvent]:
        statement = select(AuditEvent).where(AuditEvent.organization_id == organization_id)
        if entity_type:
            statement = statement.where(AuditEvent.entity_type == entity_type)
        if entity_id:
            statement = statement.where(AuditEvent.entity_id == entity_id)
        result = await session.scalars(statement.order_by(AuditEvent.created_at.desc()))
        return list(result.all())

    async def _get_validation(self, session, organization_id, validation_id):
        item = await session.scalar(
            select(ValidationRequest).where(
                ValidationRequest.id == validation_id,
                ValidationRequest.organization_id == organization_id,
            )
        )
        if item is None:
            raise ApplicationError("validation_not_found", "Validation introuvable", 404)
        return item

    async def _get_action(self, session, organization_id, action_id):
        item = await session.scalar(
            select(CorrectiveAction).where(
                CorrectiveAction.id == action_id,
                CorrectiveAction.organization_id == organization_id,
            )
        )
        if item is None:
            raise ApplicationError("action_not_found", "Action introuvable", 404)
        return item

    async def _get_alert(self, session, organization_id, alert_id):
        item = await session.scalar(
            select(RadarAlert).where(
                RadarAlert.id == alert_id,
                RadarAlert.organization_id == organization_id,
            )
        )
        if item is None:
            raise ApplicationError("alert_not_found", "Alerte introuvable", 404)
        return item

    async def _get_record(self, session, organization_id, record_type, record_id):
        model = MODELS.get(record_type)
        if model is None:
            raise ApplicationError("invalid_record_type", "Type d'enregistrement invalide", 422)
        item = await session.scalar(
            select(model).where(
                model.id == record_id,
                model.organization_id == organization_id,
            )
        )
        if item is None:
            raise ApplicationError("record_not_found", "Enregistrement introuvable", 404)
        return item

    async def _audit(
        self, session, organization_id, entity_type, entity_id, event_type, actor, payload
    ):
        session.add(
            AuditEvent(
                organization_id=organization_id,
                entity_type=entity_type,
                entity_id=entity_id,
                event_type=event_type,
                actor_user_id=actor,
                payload=payload,
            )
        )

    @staticmethod
    def _convert_value(record, field_name, value):
        current = getattr(record, field_name)
        if value is None:
            return None
        if isinstance(current, Decimal):
            return Decimal(str(value))
        enum_type = type(current)
        if hasattr(enum_type, "__members__"):
            return enum_type(value)
        return value

    @staticmethod
    def _json_value(value):
        if isinstance(value, Decimal):
            return str(value)
        if hasattr(value, "value"):
            return value.value
        return value
