from datetime import datetime, timezone


def test_set_and_get_budget(client, auth_headers):
    cat_resp = client.get("/api/v1/categories/", headers=auth_headers)
    dining_cat = next(c for c in cat_resp.json() if c["name"] == "Food & Dining")

    now = datetime.now(timezone.utc)
    month = now.month
    year = now.year

    # Set budget of 5000
    payload = {
        "category_id": dining_cat["id"],
        "month": month,
        "year": year,
        "amount_limit": 5000.00,
    }
    set_resp = client.post("/api/v1/budgets/", json=payload, headers=auth_headers)
    assert set_resp.status_code == 201
    assert float(set_resp.json()["amount_limit"]) == 5000.00

    # Add a transaction for this category
    tx_payload = {
        "amount": 1200.00,
        "category_id": dining_cat["id"],
        "merchant_raw_name": "Restaurant",
        "timestamp": now.isoformat(),
    }
    client.post("/api/v1/transactions/", json=tx_payload, headers=auth_headers)

    # Get budget summary
    summary_resp = client.get(
        f"/api/v1/budgets/summary?month={month}&year={year}",
        headers=auth_headers,
    )
    assert summary_resp.status_code == 200
    summaries = summary_resp.json()
    assert len(summaries) == 1
    item = summaries[0]
    assert float(item["amount_limit"]) == 5000.00
    assert float(item["spent_amount"]) == 1200.00
    assert float(item["remaining_amount"]) == 3800.00
    assert item["percentage_used"] == 24.0
    assert item["is_over_budget"] is False


def test_over_budget_detection(client, auth_headers):
    cat_resp = client.get("/api/v1/categories/", headers=auth_headers)
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
    client.post("/api/v1/budgets/", json=payload, headers=auth_headers)

    # Log an expense of 800
    client.post(
        "/api/v1/transactions/",
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
