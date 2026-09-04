def test_register_user_success(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "newuser@example.com",
            "password": "SecretPassword123!",
            "full_name": "New User",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert data["full_name"] == "New User"
    assert "id" in data
    assert data["is_active"] is True


def test_register_user_duplicate_email(client):
    user_payload = {
        "email": "duplicate@example.com",
        "password": "Password123!",
        "full_name": "Dup User",
    }
    resp1 = client.post("/api/v1/auth/register", json=user_payload)
    assert resp1.status_code == 201

    resp2 = client.post("/api/v1/auth/register", json=user_payload)
    assert resp2.status_code == 400
    assert "already registered" in resp2.json()["detail"]


def test_login_success(client):
    client.post(
        "/api/v1/auth/register",
        json={"email": "loginuser@example.com", "password": "Password123!"},
    )
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "loginuser@example.com", "password": "Password123!"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_invalid_password(client):
    client.post(
        "/api/v1/auth/register",
        json={"email": "wrongpwd@example.com", "password": "Password123!"},
    )
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "wrongpwd@example.com", "password": "WrongPassword!"},
    )
    assert response.status_code == 401
    assert "Incorrect email or password" in response.json()["detail"]


def test_read_current_user_me(client, auth_headers):
    response = client.get("/api/v1/auth/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "tester@example.com"
    assert data["full_name"] == "Test User"
