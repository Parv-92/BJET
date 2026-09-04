# Engineering Rules & Standards

## 1. Architectural Integrity
- **Layer Separation**: Strictly adhere to `API -> Service -> Repository -> Database`.
  - **API Layer (`src/api/`)**: Handles HTTP requests, response serialization, status codes, and input validation via Pydantic. No direct DB queries or business calculations.
  - **Service Layer (`src/services/`)**: Encapsulates business logic, rule application, domain validations, and orchestration.
  - **Repository Layer (`src/repositories/`)**: Encapsulates all data access and SQLAlchemy queries. Services must not write raw SQL or manipulate queries directly.
  - **Models Layer (`src/models/`)**: Pure SQLAlchemy ORM entity definitions.
  - **Schemas Layer (`src/schemas/`)**: Pure Pydantic models for request bodies, query params, and API responses.

## 2. Coding Standards
- **Python 3.13 Compatibility**: Use modern standard library features and avoid deprecated libraries (e.g. use `bcrypt` directly rather than legacy `passlib`).
- **Strict Typing**: All function signatures must include Python type hints for arguments and return types.
- **Error Handling**: Use custom domain exceptions in the service layer; map them to HTTP exceptions in the API layer.

## 3. Financial Data & Security
- **Confidentiality**: Never log raw passwords, JWT tokens, or full banking credentials.
- **Password Security**: Hash passwords using salted `bcrypt` hashes. Never store plaintext credentials.
- **User Scoping**: Every query fetching transactions, budgets, or user preferences MUST filter by `user_id` to prevent cross-tenant data leakage.

## 4. Testing Standards
- All new service methods and API endpoints must have automated Pytest coverage.
- Repositories and services should be unit tested with isolated database sessions (e.g., SQLite in-memory).
- Integration tests must verify complete request-response flows using FastAPI's `TestClient` / `httpx`.
