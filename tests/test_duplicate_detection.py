from datetime import datetime, timezone, timedelta
from decimal import Decimal

from src.models.transaction import Transaction, TransactionStatus
from src.models.user import User
from src.services.duplicate_detection_service import duplicate_detection_service


def test_duplicate_primary_upi_ref(db_session):
    user = User(email="dup1@example.com", hashed_password="pwd", is_active=True)
    db_session.add(user)
    db_session.commit()

    # Existing transaction with UTR 123456789012
    tx = Transaction(
        user_id=user.id,
        amount=Decimal("500.00"),
        upi_reference_id="123456789012",
        status=TransactionStatus.CONFIRMED,
    )
    db_session.add(tx)
    db_session.commit()

    # Check duplicate
    dup_res = duplicate_detection_service.detect_duplicate(
        db=db_session,
        user_id=user.id,
        upi_reference_id="123456789012",
        amount=Decimal("500.00"),
    )
    assert dup_res.is_duplicate is True
    assert dup_res.existing_transaction_id == tx.id
    assert "123456789012" in dup_res.reason


def test_duplicate_tenant_isolation(db_session):
    user1 = User(email="u1@example.com", hashed_password="pwd", is_active=True)
    user2 = User(email="u2@example.com", hashed_password="pwd", is_active=True)
    db_session.add_all([user1, user2])
    db_session.commit()

    # User 1 has transaction
    tx = Transaction(
        user_id=user1.id,
        amount=Decimal("300.00"),
        upi_reference_id="999888777666",
        status=TransactionStatus.CONFIRMED,
    )
    db_session.add(tx)
    db_session.commit()

    # Check duplicate for User 2 -> must NOT flag as duplicate
    dup_res = duplicate_detection_service.detect_duplicate(
        db=db_session,
        user_id=user2.id,
        upi_reference_id="999888777666",
        amount=Decimal("300.00"),
    )
    assert dup_res.is_duplicate is False


def test_duplicate_fallback_amount_and_window(db_session):
    user = User(email="fallback@example.com", hashed_password="pwd", is_active=True)
    db_session.add(user)
    db_session.commit()

    now = datetime.now(timezone.utc)

    # Existing transaction without UTR
    tx = Transaction(
        user_id=user.id,
        amount=Decimal("750.00"),
        merchant_raw_name="Reliance Fresh",
        timestamp=now,
        status=TransactionStatus.CONFIRMED,
    )
    db_session.add(tx)
    db_session.commit()

    # New transaction without UTR, within 2 hours
    dup_res = duplicate_detection_service.detect_duplicate(
        db=db_session,
        user_id=user.id,
        upi_reference_id=None,
        amount=Decimal("750.00"),
        merchant_raw_name="Reliance Fresh",
        timestamp=now + timedelta(hours=2),
    )
    assert dup_res.is_duplicate is True
    assert dup_res.existing_transaction_id == tx.id
