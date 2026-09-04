# System Architecture & Technical Specifications

## 1. High-Level Architecture Layers

The backend follows clean layered architecture with explicit separation of concerns:

```
[ Frontend Client (Web / React Native Mobile) ]
                      ↓  HTTP / REST (JSON)
[ API Layer: FastAPI Routers & Dependency Injection (src/api/v1/) ]
                      ↓  Domain calls & Pydantic validation
[ Service Layer: Business Logic & Orchestration (src/services/) ]
                      ↓  Data access & CRUD
[ Repository Layer: Data Persistence Abstractions (src/repositories/) ]
                      ↓  ORM queries
[ Database Layer: SQLAlchemy ORM / SQLite DB (src/models/) ]
```

---

## 2. Receipt OCR & Transaction Processing Pipeline

```
Receipt Image Upload (POST /api/v1/transactions/scan-receipt)
          ↓
Size & Deep MIME Validation (Pillow integrity verification)
          ↓
Non-Destructive Storage (Saved to UPLOAD_DIR with UUID filename)
          ↓
In-Memory Image Preprocessing (Grayscale, contrast enhancement, noise reduction)
          ↓
OCR Text Extraction (Via OCRProvider abstraction: EasyOCR / MockOCR)
          ↓
Transaction Parsing (GPay, PhonePe, Paytm, Generic regex heuristic parsers)
          ↓
Merchant Resolution (Normalize name & UPI VPA lookup)
          ↓
Intelligent Categorization Engine (3-Step Prioritized Hierarchy)
          ↓
Duplicate Detection (Exact reference ID or amount + merchant + 24h window)
          ↓
Draft Transaction Created (Strictly in PENDING_CONFIRMATION status)
          ↓
User Review & Confirmation (POST /api/v1/transactions/{id}/confirm)
          ↓
Status Transition to CONFIRMED (Now counted against Monthly Budgets)
```

---

## 3. Intelligent Categorization Engine & Rules Hierarchy

Categorization is evaluated through a strict 3-tier hierarchy:

```
Transaction (Scanned Receipt or Manual Entry)
                     ↓
         Merchant Name / UPI VPA identified
                     ↓
[ Tier 1: UserMerchantRule Match ]
   - Filter user-configured rules (tenant isolation)
   - Evaluated by: 1. Priority DESC, 2. Created_at DESC
   - Case-insensitive substring matching on normalized text
   - Matched -> Assign User Rule Category
                     ↓ (No rule match)
[ Tier 2: Known Merchant Default Category ]
   - Match against verified system merchant directory
   - Has default_category_id -> Assign Merchant Default Category
                     ↓ (No merchant default)
[ Tier 3: System Fallback ]
   - Assign System Default "Uncategorized" category (ID: 1)
```

### Rule Matching Specification
- **Substring Matching**: Case-insensitive substring comparison on normalized text (e.g., rule pattern `"SWIGGY"` matches merchant `"Swiggy Limited"`). Arbitrary regular expressions are explicitly prohibited.
- **Normalization**: Whitespace is trimmed and collapsed, and text is converted to uppercase before duplicate detection and matching.
- **Evaluation Ordering**: Rules are sorted by `priority DESC, created_at DESC`.
- **Works Without Resolved Merchant**: Categorization functions using `merchant_raw_name` even when no `Merchant` entity exists in the database.
- **Result Contract**: Returns `CategorizationResult(category_id, source, matched_rule_id)` independently of HTTP layers.

---

## 4. Merchant Default Category Safety

- `Merchant.default_category_id` represents a **global system suggestion** (curated system defaults).
- **Immutability during Confirmation**: When an individual user confirms a transaction with a different category, `Merchant.default_category_id` is **never** modified.
- User-specific category customizations are persisted strictly in `UserMerchantRule`.
- Confirmation normalizes merchant names, reuses existing merchants when available, and ensures global merchant defaults remain untouched.

---

## 5. Receipt Storage & Path Security

For receipt streaming endpoint `GET /api/v1/transactions/{transaction_id}/receipt`:
1. **Authentication & Ownership**: Strict ownership verification; requesting another user's receipt returns `404 Not Found`.
2. **Client Path Decoupling**: Client cannot supply path or filename parameters; file location is retrieved strictly from the database transaction record.
3. **Directory Traversal Guard**: Physical paths are canonicalized with `os.path.realpath` and verified to remain strictly inside the configured `UPLOAD_DIR` using `os.path.commonpath`. Any path escaping the directory returns `404 Not Found`.
4. **Physical Path Isolation**: Internal server filesystem paths are never exposed in API responses or error messages.
5. **Streaming**: Files are streamed directly using FastAPI's `FileResponse` with dynamically resolved MIME types (`image/png`, `image/jpeg`, `image/webp`).

---

## 6. Budgeting Architecture & State Integrity

- **Upsert Mechanics**: `POST /api/v1/budgets` acts as an idempotent create-or-update operation:
  - `201 Created` when creating a new budget for `(category_id, month, year)`.
  - `200 OK` when updating an existing budget limit.
  - No duplicate `PUT /budgets/{id}` route is exposed.
- **Spending Isolation**: Monthly spent amounts and budget limits are calculated strictly against transactions with `status = CONFIRMED`. Draft transactions in `PENDING_CONFIRMATION` status are excluded from budget calculations until reviewed and confirmed by the user.

---

## 7. API Normalization Principles

- **No Trailing Slashes**: All API endpoints use normalized routes without trailing slashes.
- **JSON Login**: `POST /api/v1/auth/login` accepts `application/json` with `{"email": "...", "password": "..."}` and returns JWT Bearer tokens.
- **Lightweight List Responses**: `GET /api/v1/transactions` returns `TransactionListItemResponse` (includes `has_receipt: bool`, excludes heavy `raw_extracted_text`). Detailed endpoints return `TransactionDetailResponse`.
- **Confirmation State Validation**: Confirmation is only permitted from `PENDING_CONFIRMATION` status. Attempting to confirm an already confirmed transaction returns a controlled `400 Bad Request`.
- **Standardized Domain Errors**:
  - `401 Unauthorized`: Missing or invalid authentication token.
  - `403 Forbidden`: Attempted modification of system default resources.
  - `404 Not Found`: Entity not found or inaccessible under tenant isolation.
  - `400 Bad Request`: Business rule violations (duplicate rule, invalid confirmation status, amount <= 0).
  - `422 Unprocessable Entity`: Input schema validation failures.