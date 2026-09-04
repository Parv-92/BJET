from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from src.core.database import Base
from src.models.base import TimestampMixin


class Merchant(Base, TimestampMixin):
    __tablename__ = "merchants"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False, index=True)
    clean_name = Column(String(255), nullable=False, index=True)
    upi_vpa = Column(String(255), nullable=True, index=True)  # e.g., merchant@upi
    default_category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    default_category = relationship("Category")
    transactions = relationship("Transaction", back_populates="merchant")
