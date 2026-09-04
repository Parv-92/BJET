from datetime import datetime, timezone


def test_set_and_get_budget(client, auth_headers):
    cat_resp = client.get("/api/v1/categories", headers=auth_headers)
    dining_cat = next(c for c in cat_resp.json() if c["name"] == "Food & Dining")

    now = datetime.now(timezone.utc)
    month = now.month
    year = now.year

    # Set budget of 5000 (Initial creation returns 201 Created)
    payload = {
        "category_id": dining_cat["id"],
        "month": month,
        "year": year,
        "amount_limit": 5000.00,
    }
    set_resp = client.post("/api/v1/budgets", json=payload, headers=auth_headers)
    assert set_resp.status_code == 201
    assert float(set_resp.json()["amount_limit"]) == 5000.00

    # Updating the same budget via POST upsert returns 200 OK
    payload["amount_limit"] = 6000.00
    update_resp = client.post("/api/v1/budgets", json=payload, headers=auth_headers)
    assert update_resp.status_code == 200
    assert float(update_resp.json()["amount_limit"]) == 6000.00

    # Add a transaction for this category
    tx_payload = {
        "amount": 1200.00,
        "category_id": dining_cat["id"],
        "merchant_raw_name": "Restaurant",
        "timestamp": now.isoformat(),
    }
    client.post("/api/v1/transactions", json=tx_payload, headers=auth_headers)

    # Get budget summary
    summary_resp = client.get(
        f"/api/v1/budgets/summary?month={month}&year={year}",
        headers=auth_headers,
    )
    assert summary_resp.status_code == 200
    summaries = summary_resp.json()
    assert len(summaries) == 1
    item = summaries[0]
    assert float(item["amount_limit"]) == 6000.00
    assert float(item["spent_amount"]) == 1200.00
    assert float(item["remaining_amount"]) == 4800.00
    assert item["percentage_used"] == 20.0
    assert item["is_over_budget"] is False


def test_over_budget_detection(client, auth_headers):
    cat_resp = client.get("/api/v1/categories", headers=auth_headers)
    travel_cat = next(c for c in cat_resp.json() if c["name"] == "Transportation")

    now = datetime.now(timezone.utc)
    month = now.month
    year = now.year

    # Set small budget of 500
    payload = {
        "category_id": travel_cat["id"],
        "month": month,
        "year": year,
        "amount_limit": 500.00,
    }
    client.post("/api/v1/budgets", json=payload, headers=auth_headers)

    # Log an expense of 800
    client.post(
        "/api/v1/transactions",
        json={
            "amount": 800.00,
            "category_id": travel_cat["id"],
            "merchant_raw_name": "Uber Ride",
            "timestamp": now.isoformat(),
        },
        headers=auth_headers,
    )

    # Check status
    cat_status_resp = client.get(
        f"/api/v1/budgets/{travel_cat['id']}?month={month}&year={year}",
        headers=auth_headers,
    )
    assert cat_status_resp.status_code == 200
    data = cat_status_resp.json()
    assert float(data["spent_amount"]) == 800.00
    assert float(data["remaining_amount"]) == -300.00
    assert data["percentage_used"] == 160.0
    assert data["is_over_budget"] is True


def test_budget_invalid_category_returns_404(client, auth_headers):
    now = datetime.now(timezone.utc)
    resp = client.post(
        "/api/v1/budgets",
        json={
            "category_id": 99999,
            "month": now.month,
            "year": now.year,
            "amount_limit": 1000.00,
        },
        headers=auth_headers,
    )
    assert resp.status_code == 404


def test_pending_receipt_draft_not_counted_in_budget_until_confirmed(client, auth_headers):
    """Verify that a PENDING_CONFIRMATION draft is NEVER counted in the budget until explicitly confirmed."""
    import io
    from PIL import Image
    from src.services.ocr.mock_provider import MockOCRProvider
    from src.services.receipt_processing_service import receipt_processing_service

    # 1. Setup mock OCR
    mock_ocr = MockOCRProvider(
        default_text="PhonePe\nPaid to Dominos\n₹600.00\nUTR: 123451234512"
    )
    receipt_processing_service.set_ocr_provider(mock_ocr)

    # 2. Get Food & Dining category ID
    cat_resp = client.get("/api/v1/categories", headers=auth_headers)
    dining_cat = next(c for c in cat_resp.json() if c["name"] == "Food & Dining")

    now = datetime.now(timezone.utc)
    month = now.month
    year = now.year

    # 3. Set monthly budget of 2000.00
    client.post(
        "/api/v1/budgets",
        json={
            "category_id": dining_cat["id"],
            "month": month,
            "year": year,
            "amount_limit": 2000.00,
        },
        headers=auth_headers,
    )

    # Verify initial budget has 0 spent
    init_budget = client.get(
        f"/api/v1/budgets/{dining_cat['id']}?month={month}&year={year}",
        headers=auth_headers,
    ).json()
    assert float(init_budget["spent_amount"]) == 0.00
    assert float(init_budget["remaining_amount"]) == 2000.00

    # 4. Scan receipt for 600.00 -> created in PENDING_CONFIRMATION
    img = Image.new("RGB", (200, 400), color=(255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format="PNG")

    scan_resp = client.post(
        "/api/v1/transactions/scan-receipt",
        files={"file": ("dominos.png", buf.getvalue(), "image/png")},
        headers=auth_headers,
    )
    assert scan_resp.status_code == 201
    draft_tx = scan_resp.json()["transaction"]
    assert draft_tx["status"] == "PENDING_CONFIRMATION"
    assert float(draft_tx["amount"]) == 600.00
    draft_id = draft_tx["id"]

    # 5. Check budget: Must STILL be 0.00 spent! Pending draft is NOT counted!
    pending_budget = client.get(
        f"/api/v1/budgets/{dining_cat['id']}?month={month}&year={year}",
        headers=auth_headers,
    ).json()
    assert float(pending_budget["spent_amount"]) == 0.00, "Draft transaction must NOT affect budget spent amount!"
    assert float(pending_budget["remaining_amount"]) == 2000.00

    # 6. User confirms the transaction (timestamp is required)
    confirm_resp = client.post(
        f"/api/v1/transactions/{draft_id}/confirm",
        json={
            "amount": 600.00,
            "category_id": dining_cat["id"],
            "timestamp": now.isoformat(),
            "merchant_name": "Dominos Pizza",
        },
        headers=auth_headers,
    )
    assert confirm_resp.status_code == 200
    assert confirm_resp.json()["status"] == "CONFIRMED"

    # 7. Check budget: NOW counted! 600 spent, 1400 remaining
    confirmed_budget = client.get(
        f"/api/v1/budgets/{dining_cat['id']}?month={month}&year={year}",
        headers=auth_headers,
    ).json()
    assert float(confirmed_budget["spent_amount"]) == 600.00
    assert float(confirmed_budget["remaining_amount"]) == 1400.00
    assert confirmed_budget["percentage_used"] == 30.0


def test_budget_summary_not_intercepted_by_category_route(client, auth_headers):
    """GET /budgets/summary must not be captured as a dynamic category_id."""
    now = datetime.now(timezone.utc)
    resp = client.get(f"/api/v1/budgets/summary?month={now.month}&year={now.year}", headers=auth_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_budget_tenant_isolation(client, auth_headers):
    """User B cannot view User A's budget summary or category status."""
    cat_resp = client.get("/api/v1/categories", headers=auth_headers)
    cat_id = cat_resp.json()[0]["id"]
    now = datetime.now(timezone.utc)

    # User A creates a budget
    client.post(
        "/api/v1/budgets",
        json={"category_id": cat_id, "month": now.month, "year": now.year, "amount_limit": 5000.00},
        headers=auth_headers,
    )

    # Register and login User B
    client.post(
        "/api/v1/auth/register",
        json={"email": "userb_budget@example.com", "password": "Password123!"},
    )
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "userb_budget@example.com", "password": "Password123!"},
    )
    user_b_headers = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}

    # User B monthly budget summary is empty (does not leak User A's budget)
    summary_b = client.get(
        f"/api/v1/budgets/summary?month={now.month}&year={now.year}",
        headers=user_b_headers,
    ).json()
    assert len(summary_b) == 0

    # User B accessing category budget returns 404
    status_b = client.get(
        f"/api/v1/budgets/{cat_id}?month={now.month}&year={now.year}",
        headers=user_b_headers,
    )
    assert status_b.status_code == 404
