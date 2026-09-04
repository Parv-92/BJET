from datetime import datetime, timezone
from sqlalchemy import DateTime, Column
from sqlalchemy.orm import declarative_mixin


@declarative_mixin
class TimestampMixin:
    """Provides created_at and updated_at timestamps in UTC."""
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
