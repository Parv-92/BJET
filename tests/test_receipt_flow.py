import io
import pytest
from datetime import datetime, timezone
from decimal import Decimal
from PIL import Image

from src.services.ocr.mock_provider import MockOCRProvider
from src.services.receipt_processing_service import receipt_processing_service


def create_dummy_png_bytes() -> bytes:
    """Helper to generate a valid in-memory PNG image."""
    img = Image.new("RGB", (300, 600), color=(255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


@pytest.fixture(autouse=True)
def inject_mock_ocr():
    """Ensure all tests in this module run with MockOCRProvider without deep-learning overhead."""
    mock = MockOCRProvider()
    receipt_processing_service.set_ocr_provider(mock)
    yield mock


def test_scan_receipt_unsupported_file_type(client, auth_headers):
    files = {
        "file": ("notes.txt", b"This is not an image", "text/plain")
    }
    response = client.post("/api/v1/transactions/scan-receipt", files=files, headers=auth_headers)
    assert response.status_code == 400
    assert "Unsupported file type" in response.json()["detail"]


def test_scan_receipt_creates_pending_draft(client, auth_headers, inject_mock_ocr):
    sample_ocr = """
    Google Pay
    Paid to Blue Tokai Coffee
    bluetokai@icici
    ₹280.00
    Completed
    19 Aug 2026, 11:30 AM
    UPI transaction ID: 112233445566
    """
    inject_mock_ocr.set_mock_response(sample_ocr, confidence=0.94)

    image_bytes = create_dummy_png_bytes()
    files = {"file": ("receipt.png", image_bytes, "image/png")}

    response = client.post("/api/v1/transactions/scan-receipt", files=files, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()

    # Verify draft transaction status and receipt indicator
    tx = data["transaction"]
    assert tx["status"] == "PENDING_CONFIRMATION"
    assert float(tx["amount"]) == 280.00
    assert tx["merchant_raw_name"] == "Blue Tokai Coffee"
    assert tx["upi_reference_id"] == "112233445566"
    assert tx["has_receipt"] is True

    # Verify extraction metadata
    extraction = data["extraction"]
    assert extraction["detected_app"] == "Google Pay"
    assert extraction["confidence_score"] > 0.8
    assert "Google Pay" in extraction["raw_text"]

    # Verify duplicate info
    assert data["duplicate"]["is_duplicate"] is False


def test_scan_receipt_soft_duplicate_warning(client, auth_headers, inject_mock_ocr):
    sample_ocr = """
    PhonePe
    Transaction Successful
    Paid to Dominos Pizza
    ₹550.00
    UTR: 998877665544
    """
    inject_mock_ocr.set_mock_response(sample_ocr)

    image_bytes = create_dummy_png_bytes()

    # First upload
    resp1 = client.post(
        "/api/v1/transactions/scan-receipt",
        files={"file": ("receipt1.png", image_bytes, "image/png")},
        headers=auth_headers,
    )
    assert resp1.status_code == 201
    first_tx_id = resp1.json()["transaction"]["id"]

    # Second upload of duplicate receipt
    resp2 = client.post(
        "/api/v1/transactions/scan-receipt",
        files={"file": ("receipt2.png", image_bytes, "image/png")},
        headers=auth_headers,
    )
    assert resp2.status_code == 201
    data2 = resp2.json()

    # Soft duplicate detected without rejection
    assert data2["duplicate"]["is_duplicate"] is True
    assert data2["duplicate"]["existing_transaction_id"] == first_tx_id
    assert "potential_duplicate" in data2["extraction"]["warnings"]


def test_confirm_draft_transaction(client, auth_headers, inject_mock_ocr):
    # Fetch a category ID
    cat_resp = client.get("/api/v1/categories", headers=auth_headers)
    food_cat = next(c for c in cat_resp.json() if c["name"] == "Food & Dining")

    # Scan receipt
    sample_ocr = """
    Paytm
    Paid successfully to KFC
    ₹420.00
    UPI Ref No: 554433221100
    """
    inject_mock_ocr.set_mock_response(sample_ocr)

    image_bytes = create_dummy_png_bytes()
    scan_resp = client.post(
        "/api/v1/transactions/scan-receipt",
        files={"file": ("kfc.png", image_bytes, "image/png")},
        headers=auth_headers,
    )
    tx_id = scan_resp.json()["transaction"]["id"]
    assert scan_resp.json()["transaction"]["status"] == "PENDING_CONFIRMATION"

    # Confirm transaction with selected category and required timestamp
    confirm_payload = {
        "amount": 420.00,
        "category_id": food_cat["id"],
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "merchant_name": "KFC India",
        "notes": "Lunch with team",
    }
    confirm_resp = client.post(
        f"/api/v1/transactions/{tx_id}/confirm",
        json=confirm_payload,
        headers=auth_headers,
    )
    assert confirm_resp.status_code == 200
    confirmed_tx = confirm_resp.json()

    # Status transitioned to CONFIRMED
    assert confirmed_tx["status"] == "CONFIRMED"
    assert confirmed_tx["category_id"] == food_cat["id"]
    assert confirmed_tx["merchant_raw_name"] == "KFC India"
    assert confirmed_tx["notes"] == "Lunch with team"


def test_confirm_transaction_validation_errors(client, auth_headers):
    # Attempt confirmation with non-existent category
    confirm_payload = {
        "amount": 100.00,
        "category_id": 99999,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    resp = client.post(
        "/api/v1/transactions/1/confirm",
        json=confirm_payload,
        headers=auth_headers,
    )
    # Returns 404 for non-existent resource / category
    assert resp.status_code == 404


def test_confirm_transaction_tenant_isolation(client, auth_headers, inject_mock_ocr):
    # User 1 scans a receipt
    inject_mock_ocr.set_mock_response("Amount: ₹150.00\nRef: 123123123123")
    scan_resp = client.post(
        "/api/v1/transactions/scan-receipt",
        files={"file": ("u1.png", create_dummy_png_bytes(), "image/png")},
        headers=auth_headers,
    )
    user1_tx_id = scan_resp.json()["transaction"]["id"]

    # Register and login User 2
    client.post(
        "/api/v1/auth/register",
        json={"email": "attacker@example.com", "password": "Password123!"},
    )
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "attacker@example.com", "password": "Password123!"},
    )
    user2_headers = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}

    # User 2 attempts to confirm User 1's draft -> 404
    confirm_payload = {
        "amount": 150.00,
        "category_id": 1,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    resp = client.post(
        f"/api/v1/transactions/{user1_tx_id}/confirm",
        json=confirm_payload,
        headers=user2_headers,
    )
    assert resp.status_code == 404


def test_scan_receipt_spoofed_mime_type_rejected(client, auth_headers):
    """Verify that non-image payloads with a spoofed image/png Content-Type header are rejected."""
    fake_file = {
        "file": ("malicious.png", b"MZ\x90\x00\x03\x00fake_executable_or_text", "image/png")
    }
    response = client.post("/api/v1/transactions/scan-receipt", files=fake_file, headers=auth_headers)
    assert response.status_code == 400
    assert "not a valid image" in response.json()["detail"].lower()


def test_confirm_already_confirmed_transaction_fails(client, auth_headers, inject_mock_ocr):
    """Verify that confirming an already confirmed transaction returns a controlled 400 Bad Request."""
    cat_resp = client.get("/api/v1/categories", headers=auth_headers)
    food_cat = next(c for c in cat_resp.json() if c["name"] == "Food & Dining")

    inject_mock_ocr.set_mock_response("Amount: ₹250.00\nRef: 999111222333")
    scan_resp = client.post(
        "/api/v1/transactions/scan-receipt",
        files={"file": ("r.png", create_dummy_png_bytes(), "image/png")},
        headers=auth_headers,
    )
    tx_id = scan_resp.json()["transaction"]["id"]
    now_str = datetime.now(timezone.utc).isoformat()

    # First confirmation succeeds
    confirm_resp1 = client.post(
        f"/api/v1/transactions/{tx_id}/confirm",
        json={"amount": 250.00, "category_id": food_cat["id"], "timestamp": now_str, "notes": "First confirmation"},
        headers=auth_headers,
    )
    assert confirm_resp1.status_code == 200
    assert confirm_resp1.json()["status"] == "CONFIRMED"

    # Second confirmation must return 400 Bad Request
    confirm_resp2 = client.post(
        f"/api/v1/transactions/{tx_id}/confirm",
        json={"amount": 260.00, "category_id": food_cat["id"], "timestamp": now_str, "notes": "Adjusted amount"},
        headers=auth_headers,
    )
    assert confirm_resp2.status_code == 400
    assert "already confirmed" in confirm_resp2.json()["detail"].lower()


def test_confirm_transaction_invalid_amount_rejected(client, auth_headers, inject_mock_ocr):
    """Verify that confirming with a non-positive amount is rejected with 400 or 422."""
    cat_resp = client.get("/api/v1/categories", headers=auth_headers)
    cat_id = cat_resp.json()[0]["id"]

    inject_mock_ocr.set_mock_response("Amount: ₹100.00")
    scan_resp = client.post(
        "/api/v1/transactions/scan-receipt",
        files={"file": ("r.png", create_dummy_png_bytes(), "image/png")},
        headers=auth_headers,
    )
    tx_id = scan_resp.json()["transaction"]["id"]

    # Try confirming with 0.00 amount
    resp = client.post(
        f"/api/v1/transactions/{tx_id}/confirm",
        json={"amount": 0.00, "category_id": cat_id, "timestamp": datetime.now(timezone.utc).isoformat()},
        headers=auth_headers,
    )
    assert resp.status_code in [400, 422]


def test_scan_receipt_ocr_provider_error_resilience(client, auth_headers):
    """Verify that an unexpected OCR provider crash is caught gracefully and does not yield a 500 error."""
    class CrashingOCRProvider:
        def extract_text(self, image_bytes: bytes):
            raise RuntimeError("Underlying OCR engine crashed unexpectedly")

    receipt_processing_service.set_ocr_provider(CrashingOCRProvider())

    response = client.post(
        "/api/v1/transactions/scan-receipt",
        files={"file": ("r.png", create_dummy_png_bytes(), "image/png")},
        headers=auth_headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["transaction"]["status"] == "PENDING_CONFIRMATION"
    assert "ocr_text_empty" in data["extraction"]["warnings"]


def test_secure_receipt_image_access(client, auth_headers, inject_mock_ocr):
    """Verify authenticated streaming of receipt image and tenant isolation."""
    inject_mock_ocr.set_mock_response("Amount: ₹300.00\nRef: 777888999111")
    image_bytes = create_dummy_png_bytes()

    scan_resp = client.post(
        "/api/v1/transactions/scan-receipt",
        files={"file": ("receipt.png", image_bytes, "image/png")},
        headers=auth_headers,
    )
    tx_id = scan_resp.json()["transaction"]["id"]

    # 1. Authenticated owner can fetch the receipt image
    img_resp = client.get(f"/api/v1/transactions/{tx_id}/receipt", headers=auth_headers)
    assert img_resp.status_code == 200
    assert img_resp.headers["content-type"] == "image/png"
    assert len(img_resp.content) > 0

    # 2. Unauthenticated request gets 401
    unauth_resp = client.get(f"/api/v1/transactions/{tx_id}/receipt")
    assert unauth_resp.status_code == 401

    # 3. Another user cannot access the receipt (tenant isolation returns 404)
    client.post(
        "/api/v1/auth/register",
        json={"email": "otheruser@example.com", "password": "Password123!"},
    )
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "otheruser@example.com", "password": "Password123!"},
    )
    other_headers = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}

    forbidden_resp = client.get(f"/api/v1/transactions/{tx_id}/receipt", headers=other_headers)
    assert forbidden_resp.status_code == 404

    # 4. Manual transaction with no receipt returns 404
    manual_tx = client.post(
        "/api/v1/transactions",
        json={"amount": 50.00, "merchant_raw_name": "No Receipt"},
        headers=auth_headers,
    ).json()
    no_receipt_resp = client.get(f"/api/v1/transactions/{manual_tx['id']}/receipt", headers=auth_headers)
    assert no_receipt_resp.status_code == 404


def test_receipt_path_traversal_attempt_rejected(client, auth_headers, db_session):
    """Path traversal attempt in stored receipt path must be rejected with 404."""
    from src.models.transaction import Transaction, TransactionStatus

    # Insert a malicious transaction whose stored path attempts directory traversal
    malicious_tx = Transaction(
        user_id=1,
        amount=Decimal("10.00"),
        currency="INR",
        status=TransactionStatus.CONFIRMED,
        receipt_image_path="../../windows/system32/cmd.exe",
    )
    db_session.add(malicious_tx)
    db_session.commit()
    db_session.refresh(malicious_tx)

    resp = client.get(f"/api/v1/transactions/{malicious_tx.id}/receipt", headers=auth_headers)
    assert resp.status_code == 404
    assert "not found" in resp.json()["detail"].lower()
    # Ensure physical path is not exposed
    assert "cmd.exe" not in resp.json()["detail"]
