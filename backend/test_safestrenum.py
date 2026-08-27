from enum import StrEnum

import sqlalchemy as sa
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column
from sqlalchemy.types import String, TypeDecorator


class PaymentStatus(StrEnum):
    UNPAID = "unpaid"
    PARTIAL = "partial"
    PAID = "paid"

class SafeStrEnum(TypeDecorator):
    impl = String(40)
    cache_ok = True

    def __init__(self, enum_cls, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.enum_cls = enum_cls

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, self.enum_cls):
            return value.value
        return str(value).lower()

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        val_lower = str(value).strip().lower()
        for member in self.enum_cls:
            if member.value.lower() == val_lower or member.name.lower() == val_lower:
                return member
        return list(self.enum_cls)[0]

class Base(DeclarativeBase):
    pass

class Sale(Base):
    __tablename__ = "test_sales_safe"
    id: Mapped[int] = mapped_column(primary_key=True)
    payment_status: Mapped[PaymentStatus] = mapped_column(SafeStrEnum(PaymentStatus))

engine = sa.create_engine("sqlite:///:memory:")
Base.metadata.create_all(engine)

with Session(engine) as session:
    # 1. Insert UPPERCASE 'PAID'
    session.execute(sa.text("INSERT INTO test_sales_safe (id, payment_status) VALUES (1, 'PAID')"))
    # 2. Insert LOWERCASE 'paid'
    session.execute(sa.text("INSERT INTO test_sales_safe (id, payment_status) VALUES (2, 'paid')"))
    # 3. Insert 'UNPAID'
    session.execute(sa.text("INSERT INTO test_sales_safe (id, payment_status) VALUES (3, 'UNPAID')"))
    session.commit()

    s1 = session.get(Sale, 1)
    s2 = session.get(Sale, 2)
    s3 = session.get(Sale, 3)

    print("s1 (from 'PAID'):", s1.payment_status, type(s1.payment_status))
    print("s2 (from 'paid'):", s2.payment_status, type(s2.payment_status))
    print("s3 (from 'UNPAID'):", s3.payment_status, type(s3.payment_status))

    assert s1.payment_status == PaymentStatus.PAID
    assert s2.payment_status == PaymentStatus.PAID
    assert s3.payment_status == PaymentStatus.UNPAID
    print("ALL TESTS PASSED WITH 100% SUCCESS!")
