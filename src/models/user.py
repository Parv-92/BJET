from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship

from src.core.database import Base
from src.models.base import TimestampMixin


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")
    budgets = relationship("Budget", back_populates="user", cascade="all, delete-orphan")
    rules = relationship("UserMerchantRule", back_populates="user", cascade="all, delete-orphan")
    custom_categories = relationship("Category", back_populates="user", cascade="all, delete-orphan")
