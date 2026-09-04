def test_list_categories_includes_defaults(client, auth_headers):
    response = client.get("/api/v1/categories/", headers=auth_headers)
    assert response.status_code == 200
    categories = response.json()
    assert len(categories) >= 10
    names = [c["name"] for c in categories]
    assert "Food & Dining" in names
    assert "Groceries" in names
    assert "Utilities & Bills" in names


def test_create_custom_category(client, auth_headers):
    payload = {
        "name": "Crypto Investments",
        "icon": "bitcoin",
        "color": "#F7931A",
    }
    response = client.post("/api/v1/categories/", json=payload, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Crypto Investments"
    assert data["is_system_default"] is False
    assert data["user_id"] is not None

    # Check that custom category is returned in list
    list_resp = client.get("/api/v1/categories/", headers=auth_headers)
    names = [c["name"] for c in list_resp.json()]
    assert "Crypto Investments" in names
