from src.models.merchant import Merchant
from src.services.merchant_resolution_service import merchant_resolution_service


def test_resolve_known_merchant_by_vpa(db_session):
    known = Merchant(
        name="Swiggy",
        clean_name="SWIGGY",
        upi_vpa="swiggy@icici",
    )
    db_session.add(known)
    db_session.commit()

    result = merchant_resolution_service.resolve(
        db=db_session,
        raw_name="Swiggy Delivery",
        vpa="swiggy@icici",
    )
    assert result.is_resolved is True
    assert result.merchant_id == known.id
    assert result.merchant_name == "Swiggy"


def test_resolve_known_merchant_by_name(db_session):
    known = Merchant(
        name="Zomato",
        clean_name="ZOMATO",
        upi_vpa=None,
    )
    db_session.add(known)
    db_session.commit()

    result = merchant_resolution_service.resolve(
        db=db_session,
        raw_name="Zomato",
        vpa=None,
    )
    assert result.is_resolved is True
    assert result.merchant_id == known.id


def test_unresolved_merchant_does_not_create_db_record(db_session):
    initial_count = db_session.query(Merchant).count()

    result = merchant_resolution_service.resolve(
        db=db_session,
        raw_name="Obscure Local Vendor 123",
        vpa="vendor@obscurebank",
    )
    # Must preserve raw name, but leave merchant_id None
    assert result.is_resolved is False
    assert result.merchant_id is None
    assert result.merchant_name == "Obscure Local Vendor 123"

    # Crucial safety rule check: No permanent record created in DB!
    final_count = db_session.query(Merchant).count()
    assert final_count == initial_count
