import io
from datetime import datetime, timezone
from PIL import Image
from src.services.ocr.mock_provider import MockOCRProvider
from src.services.receipt_processing_service import receipt_processing_service


def create_dummy_png_bytes() -> bytes:
    img = Image.new("RGB", (200, 400), color=(255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def test_categorization_hierarchy_user_rule_overrides_merchant_default(client, auth_headers):
    """Priority 1: UserMerchantRule must take precedence over known merchant default category."""
    cats = client.get("/api/v1/categories", headers=auth_headers).json()
    dining_cat = next(c for c in cats if c["name"] == "Food & Dining")
    custom_cat = client.post(
        "/api/v1/categories",
        json={"name": "Special Work Dinners"},
        headers=auth_headers,
    ).json()

    # User creates a rule mapping "SWIGGY" to Special Work Dinners
    client.post(
        "/api/v1/rules",
        json={"merchant_pattern": "SWIGGY", "category_id": custom_cat["id"], "priority": 10},
        headers=auth_headers,
    )

    # When logging a transaction with merchant "Swiggy", category should be Special Work Dinners
    tx = client.post(
        "/api/v1/transactions",
        json={"amount": 350.00, "merchant_raw_name": "Swiggy Restaurant"},
        headers=auth_headers,
    ).json()

    assert tx["category_id"] == custom_cat["id"]


def test_categorization_hierarchy_merchant_default(client, auth_headers, db_session):
    """Priority 2: Known merchant default category is used when no UserMerchantRule matches."""
    from src.models.merchant import Merchant
    cats = client.get("/api/v1/categories", headers=auth_headers).json()
    travel_cat = next(c for c in cats if c["name"] == "Transportation")

    # Seed a known merchant record with a global default category
    merchant = Merchant(
        name="City Metro Rides",
        clean_name="CITY METRO RIDES",
        default_category_id=travel_cat["id"],
    )
    db_session.add(merchant)
    db_session.commit()

    # Next transaction without category should automatically pick up the known merchant's category
    tx2 = client.post(
        "/api/v1/transactions",
        json={"amount": 200.00, "merchant_raw_name": "City Metro Rides"},
        headers=auth_headers,
    ).json()

    assert tx2["category_id"] == travel_cat["id"]


def test_categorization_hierarchy_fallback_to_uncategorized(client, auth_headers):
    """Priority 3: Fallback to system default Uncategorized category when no rule or merchant default exists."""
    cats = client.get("/api/v1/categories", headers=auth_headers).json()
    uncat = next(c for c in cats if c["name"] == "Uncategorized")

    tx = client.post(
        "/api/v1/transactions",
        json={"amount": 99.00, "merchant_raw_name": "Unknown Random Vendor 12345"},
        headers=auth_headers,
    ).json()

    assert tx["category_id"] == uncat["id"]


def test_receipt_scan_auto_assigns_predicted_category(client, auth_headers):
    """Verify that scanning a receipt automatically assigns the predicted category to the draft transaction."""
    cats = client.get("/api/v1/categories", headers=auth_headers).json()
    bills_cat = next(c for c in cats if c["name"] == "Utilities & Bills")

    # User creates rule for "ELECTRICITY" -> Utilities & Bills
    client.post(
        "/api/v1/rules",
        json={"merchant_pattern": "BESCOM", "category_id": bills_cat["id"], "priority": 5},
        headers=auth_headers,
    )

    mock = MockOCRProvider(
        default_text="Google Pay\nPaid to BESCOM Electricity\n₹1200.00\nUTR: 888777666555"
    )
    receipt_processing_service.set_ocr_provider(mock)

    scan_resp = client.post(
        "/api/v1/transactions/scan-receipt",
        files={"file": ("bill.png", create_dummy_png_bytes(), "image/png")},
        headers=auth_headers,
    )
    assert scan_resp.status_code == 201
    draft_tx = scan_resp.json()["transaction"]
    assert draft_tx["status"] == "PENDING_CONFIRMATION"
    assert draft_tx["category_id"] == bills_cat["id"]


def test_substring_matching_rule(client, auth_headers):
    """Normalized substring matching: Rule 'SWIGGY' matches 'Swiggy Limited'."""
    cats = client.get("/api/v1/categories", headers=auth_headers).json()
    dining_cat = next(c for c in cats if c["name"] == "Food & Dining")

    client.post(
        "/api/v1/rules",
        json={"merchant_pattern": "SWIGGY", "category_id": dining_cat["id"], "priority": 10},
        headers=auth_headers,
    )

    tx = client.post(
        "/api/v1/transactions",
        json={"amount": 420.00, "merchant_raw_name": "Swiggy Limited"},
        headers=auth_headers,
    ).json()

    assert tx["category_id"] == dining_cat["id"]


def test_global_merchant_defaults_not_overwritten_by_confirmation(client, auth_headers, db_session):
    """Confirming a transaction with a different category must NOT mutate the global merchant default."""
    from src.models.merchant import Merchant
    cats = client.get("/api/v1/categories", headers=auth_headers).json()
    travel_cat = next(c for c in cats if c["name"] == "Transportation")
    dining_cat = next(c for c in cats if c["name"] == "Food & Dining")

    # Global verified merchant has default category: Transportation
    merchant = Merchant(
        name="Airport Express Shuttle",
        clean_name="AIRPORT EXPRESS SHUTTLE",
        default_category_id=travel_cat["id"],
    )
    db_session.add(merchant)
    db_session.commit()

    # Create draft receipt transaction
    mock = MockOCRProvider(default_text="Paid ₹500 to Airport Express Shuttle")
    receipt_processing_service.set_ocr_provider(mock)
    scan_resp = client.post(
        "/api/v1/transactions/scan-receipt",
        files={"file": ("shuttle.png", create_dummy_png_bytes(), "image/png")},
        headers=auth_headers,
    )
    tx_id = scan_resp.json()["transaction"]["id"]

    # User confirms transaction selecting 'Food & Dining' instead
    confirm_payload = {
        "amount": 500.00,
        "category_id": dining_cat["id"],
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "merchant_name": "Airport Express Shuttle",
    }
    confirm_resp = client.post(
        f"/api/v1/transactions/{tx_id}/confirm",
        json=confirm_payload,
        headers=auth_headers,
    )
    assert confirm_resp.status_code == 200
    assert confirm_resp.json()["category_id"] == dining_cat["id"]

    # Verify that the global merchant default category was NOT modified in the database
    db_session.refresh(merchant)
    assert merchant.default_category_id == travel_cat["id"]


def test_raw_merchant_name_categorization_without_resolved_merchant(db_session):
    """CategorizationService must categorize using merchant_raw_name even when no Merchant entity exists."""
    from src.models.user import User
    from src.models.rule import UserMerchantRule
    from src.services.categorization_service import categorization_service

    # Create user
    user = User(email="raw_cat_test@example.com", hashed_password="pw", full_name="User")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    # Add rule for raw pattern "CHAIPATTI" -> category 1
    rule = UserMerchantRule(user_id=user.id, merchant_pattern="CHAIPATTI", category_id=1, priority=10)
    db_session.add(rule)
    db_session.commit()

    # Predict category with only merchant_raw_name and merchant_id=None
    result = categorization_service.predict_category(
        db=db_session,
        user_id=user.id,
        merchant_raw_name="Chaipatti Tea Cafe Indiranagar",
        merchant_id=None,
    )
    assert result.category_id == 1
    assert result.source == "user_rule"
    assert result.matched_rule_id == rule.id


def test_rule_matches_merchant_clean_name(db_session):
    """CategorizationService must match rule pattern against merchant.clean_name."""
    import pytest
    from src.models.user import User
    from src.models.merchant import Merchant
    from src.models.rule import UserMerchantRule
    from src.services.categorization_service import categorization_service

    user = User(email="clean_name_test@example.com", hashed_password="pw", full_name="User")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    # Merchant has clean_name UBER RIDES
    merchant = Merchant(name="Uber Cab", clean_name="UBER RIDES", default_category_id=None)
    db_session.add(merchant)
    db_session.commit()
    db_session.refresh(merchant)

    # Rule pattern matches UBER
    rule = UserMerchantRule(user_id=user.id, merchant_pattern="UBER", category_id=4, priority=10)
    db_session.add(rule)
    db_session.commit()

    # merchant_raw_name does not match UBER, but merchant.clean_name does
    result = categorization_service.predict_category(
        db=db_session,
        user_id=user.id,
        merchant_raw_name="Driver Joe",
        merchant_id=merchant.id,
    )
    assert result.category_id == 4
    assert result.source == "user_rule"
    assert result.matched_rule_id == rule.id


def test_rule_matches_upi_vpa(db_session):
    """CategorizationService must match rule pattern against candidate upi_vpa."""
    from src.models.user import User
    from src.models.rule import UserMerchantRule
    from src.services.categorization_service import categorization_service

    user = User(email="vpa_test@example.com", hashed_password="pw", full_name="User")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    # Rule pattern matches AIRTEL
    rule = UserMerchantRule(user_id=user.id, merchant_pattern="AIRTEL", category_id=5, priority=10)
    db_session.add(rule)
    db_session.commit()

    result = categorization_service.predict_category(
        db=db_session,
        user_id=user.id,
        merchant_raw_name="Telecom Operator",
        upi_vpa="airtel.billpay@hdfcbank",
    )
    assert result.category_id == 5
    assert result.source == "user_rule"
    assert result.matched_rule_id == rule.id


def test_missing_uncategorized_category_raises_runtime_error(db_session):
    """If the required system default 'Uncategorized' category is missing, raise explicit RuntimeError."""
    import pytest
    from src.models.category import Category
    from src.models.user import User
    from src.services.categorization_service import categorization_service

    user = User(email="missing_uncat@example.com", hashed_password="pw", full_name="User")
    db_session.add(user)
    db_session.commit()

    # Delete the Uncategorized category from database
    db_session.query(Category).filter(Category.name == "Uncategorized").delete()
    db_session.commit()

    with pytest.raises(RuntimeError, match="Required system category 'Uncategorized' is missing."):
        categorization_service.predict_category(
            db=db_session,
            user_id=user.id,
            merchant_raw_name="Unknown Store Without Defaults",
        )
