def test_create_and_list_merchant_rule(client, auth_headers):
    # Fetch a category ID
    cat_resp = client.get("/api/v1/categories", headers=auth_headers)
    dining_cat = next(c for c in cat_resp.json() if c["name"] == "Food & Dining")

    # Create a new rule
    payload = {
        "merchant_pattern": "SWIGGY",
        "category_id": dining_cat["id"],
        "priority": 10,
    }
    create_resp = client.post("/api/v1/rules", json=payload, headers=auth_headers)
    assert create_resp.status_code == 201
    rule_data = create_resp.json()
    assert rule_data["merchant_pattern"] == "SWIGGY"
    assert rule_data["category_id"] == dining_cat["id"]
    assert rule_data["priority"] == 10
    rule_id = rule_data["id"]

    # List rules
    list_resp = client.get("/api/v1/rules", headers=auth_headers)
    assert list_resp.status_code == 200
    rules = list_resp.json()
    assert len(rules) >= 1
    assert any(r["id"] == rule_id for r in rules)


def test_create_duplicate_rule_rejected(client, auth_headers):
    cat_resp = client.get("/api/v1/categories", headers=auth_headers)
    cat_id = cat_resp.json()[0]["id"]

    payload = {
        "merchant_pattern": "ZOMATO",
        "category_id": cat_id,
        "priority": 5,
    }
    resp1 = client.post("/api/v1/rules", json=payload, headers=auth_headers)
    assert resp1.status_code == 201

    # Attempt duplicate creation
    resp2 = client.post("/api/v1/rules", json=payload, headers=auth_headers)
    assert resp2.status_code == 400
    assert "already exists" in resp2.json()["detail"].lower()


def test_create_rule_invalid_category_rejected(client, auth_headers):
    payload = {
        "merchant_pattern": "UBER",
        "category_id": 99999,
        "priority": 1,
    }
    resp = client.post("/api/v1/rules", json=payload, headers=auth_headers)
    assert resp.status_code == 404


def test_delete_rule(client, auth_headers):
    cat_resp = client.get("/api/v1/categories", headers=auth_headers)
    cat_id = cat_resp.json()[0]["id"]

    payload = {
        "merchant_pattern": "BLINKIT",
        "category_id": cat_id,
        "priority": 1,
    }
    create_resp = client.post("/api/v1/rules", json=payload, headers=auth_headers)
    rule_id = create_resp.json()["id"]

    del_resp = client.delete(f"/api/v1/rules/{rule_id}", headers=auth_headers)
    assert del_resp.status_code == 204

    # Deleting again returns 404
    del_resp2 = client.delete(f"/api/v1/rules/{rule_id}", headers=auth_headers)
    assert del_resp2.status_code == 404


def test_rule_tenant_isolation(client, auth_headers):
    cat_resp = client.get("/api/v1/categories", headers=auth_headers)
    cat_id = cat_resp.json()[0]["id"]

    # User 1 creates a rule
    rule_resp = client.post(
        "/api/v1/rules",
        json={"merchant_pattern": "USER1_SECRET", "category_id": cat_id, "priority": 1},
        headers=auth_headers,
    )
    user1_rule_id = rule_resp.json()["id"]

    # Register and login User 2
    client.post(
        "/api/v1/auth/register",
        json={"email": "attacker2@example.com", "password": "Password123!"},
    )
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "attacker2@example.com", "password": "Password123!"},
    )
    user2_headers = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}

    # User 2 list rules should not contain User 1's rule
    user2_list = client.get("/api/v1/rules", headers=user2_headers).json()
    assert not any(r["id"] == user1_rule_id for r in user2_list)

    # User 2 cannot delete User 1's rule
    del_resp = client.delete(f"/api/v1/rules/{user1_rule_id}", headers=user2_headers)
    assert del_resp.status_code == 404


def test_rule_pattern_normalization_and_duplicates(client, auth_headers):
    """Whitespace and casing must be normalized before duplicate checking."""
    cat_resp = client.get("/api/v1/categories", headers=auth_headers)
    cat_id = cat_resp.json()[0]["id"]

    # Create rule with extra whitespace and mixed case
    resp1 = client.post(
        "/api/v1/rules",
        json={"merchant_pattern": "   swiggy    limited  ", "category_id": cat_id, "priority": 10},
        headers=auth_headers,
    )
    assert resp1.status_code == 201
    assert resp1.json()["merchant_pattern"] == "SWIGGY LIMITED"

    # Attempt to create duplicate with different casing/spacing -> 400
    resp2 = client.post(
        "/api/v1/rules",
        json={"merchant_pattern": "Swiggy   Limited", "category_id": cat_id, "priority": 5},
        headers=auth_headers,
    )
    assert resp2.status_code == 400
    assert "already exists" in resp2.json()["detail"].lower()


def test_rule_priority_and_created_at_ordering(client, auth_headers):
    """Rules must be evaluated by priority DESC, then created_at DESC when priorities are equal."""
    cat_resp = client.get("/api/v1/categories", headers=auth_headers)
    cat_id = cat_resp.json()[0]["id"]

    # Rule 1: Priority 20
    r1 = client.post(
        "/api/v1/rules",
        json={"merchant_pattern": "RULE_LOW", "category_id": cat_id, "priority": 20},
        headers=auth_headers,
    ).json()

    # Rule 2: Priority 80 (first created with priority 80)
    r2 = client.post(
        "/api/v1/rules",
        json={"merchant_pattern": "RULE_HIGH_FIRST", "category_id": cat_id, "priority": 80},
        headers=auth_headers,
    ).json()

    # Rule 3: Priority 80 (second created with priority 80 -> created_at is later)
    r3 = client.post(
        "/api/v1/rules",
        json={"merchant_pattern": "RULE_HIGH_SECOND", "category_id": cat_id, "priority": 80},
        headers=auth_headers,
    ).json()

    # List rules
    rules = client.get("/api/v1/rules", headers=auth_headers).json()
    rule_ids = [r["id"] for r in rules]

    # r3 should come before r2 (equal priority 80, but r3 created later)
    # r2 should come before r1 (priority 80 > 20)
    assert rule_ids.index(r3["id"]) < rule_ids.index(r2["id"])
    assert rule_ids.index(r2["id"]) < rule_ids.index(r1["id"])


def test_rule_schema_validation_constraints(client, auth_headers):
    """Schema constraints: merchant_pattern (1-100), priority (1-100)."""
    cat_resp = client.get("/api/v1/categories", headers=auth_headers)
    cat_id = cat_resp.json()[0]["id"]

    # Empty pattern -> 422
    r_empty = client.post(
        "/api/v1/rules",
        json={"merchant_pattern": "", "category_id": cat_id, "priority": 5},
        headers=auth_headers,
    )
    assert r_empty.status_code == 422

    # Pattern > 100 characters -> 422
    r_long = client.post(
        "/api/v1/rules",
        json={"merchant_pattern": "A" * 101, "category_id": cat_id, "priority": 5},
        headers=auth_headers,
    )
    assert r_long.status_code == 422

    # Priority < 1 -> 422
    r_p_zero = client.post(
        "/api/v1/rules",
        json={"merchant_pattern": "VALID", "category_id": cat_id, "priority": 0},
        headers=auth_headers,
    )
    assert r_p_zero.status_code == 422

    # Priority > 100 -> 422
    r_p_high = client.post(
        "/api/v1/rules",
        json={"merchant_pattern": "VALID", "category_id": cat_id, "priority": 101},
        headers=auth_headers,
    )
    assert r_p_high.status_code == 422
