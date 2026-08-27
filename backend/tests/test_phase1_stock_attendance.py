from decimal import Decimal

from app.models.organization import Organization
from app.schemas.registers import (
    OfferCreate,
    StockAdjustmentRequest,
)
from app.services.attendance import AttendanceService, haversine_distance_meters


def test_haversine_distance():
    # Abidjan Plateau (5.3261, -4.0197) to nearby point (5.3262, -4.0197) ~ 11 meters
    dist = haversine_distance_meters(5.3261, -4.0197, 5.3262, -4.0197)
    assert 10 <= dist <= 15

    # Same location = 0 meters
    assert haversine_distance_meters(5.3261, -4.0197, 5.3261, -4.0197) == 0.0


def test_dynamic_totp_token_generation_and_verification():
    svc = AttendanceService()
    org = Organization(
        id="org-test-uuid-123",
        tenant_id="tenant-123",
        name="Boutique Koryxa",
        slug="boutique-koryxa",
        business_category="retail",
        latitude=5.3261,
        longitude=-4.0197,
        geofence_radius_meters=50,
        created_by_user_id="usr-1",
    )

    kiosk_data = svc.generate_kiosk_token(org)
    assert len(kiosk_data.token) == 8
    assert kiosk_data.expires_in_seconds > 0
    assert "koryxa:checkin:org-test-uuid-123:" in kiosk_data.qr_payload

    # Valid token passes verification
    assert svc.verify_token(org.id, kiosk_data.token) is True

    # Bad token fails
    assert svc.verify_token(org.id, "WRONGTOK") is False


def test_offer_stock_schemas():
    offer = OfferCreate(
        name="Sac de Riz 50kg",
        price=Decimal("22000.00"),
        track_stock=True,
        stock_quantity=Decimal("50.00"),
        min_stock_alert=Decimal("5.00"),
        cost_price=Decimal("18000.00"),
    )
    assert offer.track_stock is True
    assert offer.stock_quantity == Decimal("50.00")
    assert offer.cost_price == Decimal("18000.00")

    adjustment = StockAdjustmentRequest(
        quantity_delta=Decimal("20.00"),
        reason="reassort_fournisseur",
        notes="Livraison camion 12",
    )
    assert adjustment.quantity_delta == Decimal("20.00")
