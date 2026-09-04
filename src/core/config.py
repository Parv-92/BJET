from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart Budget API"
    VERSION: str = "0.2.0"
    API_V1_STR: str = "/api/v1"

    # Database
    # Defaults to local SQLite file; can be overridden via DATABASE_URL to PostgreSQL
    DATABASE_URL: str = "sqlite:///./smart_budget.db"

    # Security
    SECRET_KEY: str = "dev-insecure-secret-key-change-in-production-123456789"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["*"]

    # Receipt Upload & Processing
    UPLOAD_DIR: str = "uploads/receipts"
    MAX_UPLOAD_SIZE_BYTES: int = 10 * 1024 * 1024  # 10 MB
    ALLOWED_IMAGE_MIME_TYPES: List[str] = ["image/jpeg", "image/png", "image/webp"]
    ENABLE_IMAGE_PREPROCESSING: bool = True
    DUPLICATE_TIME_WINDOW_HOURS: int = 24

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
