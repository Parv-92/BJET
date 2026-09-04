def test_create_and_get_transaction(client, auth_headers):
    # Fetch a default category ID
    cat_resp = client.get("/api/v1/categories", headers=auth_headers)
    food_cat = next(c for c in cat_resp.json() if c["name"] == "Food & Dining")

    # Create transaction
    payload = {
        "amount": 450.50,
        "currency": "INR",
        "merchant_raw_name": "Swiggy",
        "upi_vpa": "swiggy@icici",
        "category_id": food_cat["id"],
        "payment_app": "Google Pay",
        "notes": "Dinner order",
        "upi_reference_id": "UPI1234567890",
    }
    create_resp = client.post("/api/v1/transactions", json=payload, headers=auth_headers)
    assert create_resp.status_code == 201
    tx_data = create_resp.json()
    assert float(tx_data["amount"]) == 450.50
    assert tx_data["merchant_raw_name"] == "Swiggy"
    assert tx_data["status"] == "CONFIRMED"
    assert tx_data["has_receipt"] is False
    tx_id = tx_data["id"]

    # Retrieve by ID (detailed response)
    get_resp = client.get(f"/api/v1/transactions/{tx_id}", headers=auth_headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == tx_id
    assert "has_receipt" in get_resp.json()

    # Retrieve list (lightweight response: has_receipt included, no raw_extracted_text)
    list_resp = client.get("/api/v1/transactions", headers=auth_headers)
    assert list_resp.status_code == 200
    list_data = list_resp.json()
    assert len(list_data) >= 1
    item = next(t for t in list_data if t["id"] == tx_id)
    assert "has_receipt" in item
    assert "raw_extracted_text" not in item  # Lightweight response excludes large OCR text


def test_update_transaction_category(client, auth_headers):
    cat_resp = client.get("/api/v1/categories", headers=auth_headers)
    food_cat = next(c for c in cat_resp.json() if c["name"] == "Food & Dining")
    groceries_cat = next(c for c in cat_resp.json() if c["name"] == "Groceries")

    # Create initial transaction
    payload = {
        "amount": 250.00,
        "merchant_raw_name": "Blinkit",
        "category_id": food_cat["id"],
    }
    tx_resp = client.post("/api/v1/transactions", json=payload, headers=auth_headers)
    tx_id = tx_resp.json()["id"]

    # Update category to Groceries
    update_resp = client.put(
        f"/api/v1/transactions/{tx_id}",
        json={"category_id": groceries_cat["id"], "notes": "Corrected category"},
        headers=auth_headers,
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["category_id"] == groceries_cat["id"]
    assert update_resp.json()["notes"] == "Corrected category"


def test_delete_transaction(client, auth_headers):
    payload = {"amount": 100.00, "merchant_raw_name": "Local Chai"}
    tx_resp = client.post("/api/v1/transactions", json=payload, headers=auth_headers)
    tx_id = tx_resp.json()["id"]

    del_resp = client.delete(f"/api/v1/transactions/{tx_id}", headers=auth_headers)
    assert del_resp.status_code == 204

    get_resp = client.get(f"/api/v1/transactions/{tx_id}", headers=auth_headers)
    assert get_resp.status_code == 404


def test_put_transaction_lifecycle_protection(client, auth_headers, db_session):
    """PUT /transactions/{id} must not allow arbitrary lifecycle transitions involving PENDING_CONFIRMATION."""
    from datetime import datetime, timezone
    from decimal import Decimal
    from src.models.transaction import Transaction, TransactionStatus

    # 1. Draft transaction in PENDING_CONFIRMATION
    draft_tx = Transaction(
        user_id=1,
        amount=Decimal("199.00"),
        currency="INR",
        status=TransactionStatus.PENDING_CONFIRMATION,
        merchant_raw_name="Draft Store",
    )
    db_session.add(draft_tx)
    db_session.commit()
    db_session.refresh(draft_tx)

    # Attempting to confirm via PUT must be rejected with 400
    put_resp1 = client.put(
        f"/api/v1/transactions/{draft_tx.id}",
        json={"status": "CONFIRMED"},
        headers=auth_headers,
    )
    assert put_resp1.status_code == 400
    assert "cannot be confirmed or transitioned via put" in put_resp1.json()["detail"].lower()

    # 2. Confirmed transaction
    confirmed_tx = Transaction(
        user_id=1,
        amount=Decimal("350.00"),
        currency="INR",
        status=TransactionStatus.CONFIRMED,
        merchant_raw_name="Confirmed Store",
    )
    db_session.add(confirmed_tx)
    db_session.commit()
    db_session.refresh(confirmed_tx)

    # Attempting to revert to PENDING_CONFIRMATION via PUT must be rejected with 400
    put_resp2 = client.put(
        f"/api/v1/transactions/{confirmed_tx.id}",
        json={"status": "PENDING_CONFIRMATION"},
        headers=auth_headers,
    )
    assert put_resp2.status_code == 400
    assert "cannot be transitioned into pending_confirmation" in put_resp2.json()["detail"].lower()
