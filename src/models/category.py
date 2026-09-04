from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from src.core.database import Base
from src.models.base import TimestampMixin


class Category(Base, TimestampMixin):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False, index=True)
    icon = Column(String(50), nullable=True)  # e.g., 'utensils', 'shopping-cart', 'car'
    color = Column(String(20), nullable=True)  # Hex code or theme color identifier
    is_system_default = Column(Boolean, default=False, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)

    __table_args__ = (
        UniqueConstraint("name", "user_id", name="uq_category_name_user"),
    )

    # Relationships
    user = relationship("User", back_populates="custom_categories")
    transactions = relationship("Transaction", back_populates="category")
    budgets = relationship("Budget", back_populates="category")
    rules = relationship("UserMerchantRule", back_populates="category")
