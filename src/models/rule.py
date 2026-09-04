from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from src.core.database import Base
from src.models.base import TimestampMixin


class UserMerchantRule(Base, TimestampMixin):
    __tablename__ = "user_merchant_rules"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    merchant_pattern = Column(String(255), nullable=False)  # e.g., "SWIGGY", "ZOMATO", "UBER"
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="CASCADE"), nullable=False)
    priority = Column(Integer, default=1, nullable=False)

    # Relationships
    user = relationship("User", back_populates="rules")
    category = relationship("Category", back_populates="rules")
