def test_create_and_get_transaction(client, auth_headers):
    # Fetch a default category ID
    cat_resp = client.get("/api/v1/categories/", headers=auth_headers)
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
    create_resp = client.post("/api/v1/transactions/", json=payload, headers=auth_headers)
    assert create_resp.status_code == 201
    tx_data = create_resp.json()
    assert float(tx_data["amount"]) == 450.50
    assert tx_data["merchant_raw_name"] == "Swiggy"
    assert tx_data["status"] == "CONFIRMED"
    tx_id = tx_data["id"]

    # Retrieve by ID
    get_resp = client.get(f"/api/v1/transactions/{tx_id}", headers=auth_headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == tx_id


def test_update_transaction_category(client, auth_headers):
    cat_resp = client.get("/api/v1/categories/", headers=auth_headers)
    food_cat = next(c for c in cat_resp.json() if c["name"] == "Food & Dining")
    groceries_cat = next(c for c in cat_resp.json() if c["name"] == "Groceries")

    # Create initial transaction
    payload = {
        "amount": 250.00,
        "merchant_raw_name": "Blinkit",
        "category_id": food_cat["id"],
    }
    tx_resp = client.post("/api/v1/transactions/", json=payload, headers=auth_headers)
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
    tx_resp = client.post("/api/v1/transactions/", json=payload, headers=auth_headers)
    tx_id = tx_resp.json()["id"]

    del_resp = client.delete(f"/api/v1/transactions/{tx_id}", headers=auth_headers)
    assert del_resp.status_code == 204

    get_resp = client.get(f"/api/v1/transactions/{tx_id}", headers=auth_headers)
    assert get_resp.status_code == 404
