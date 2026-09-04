from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict

from src.models.transaction import TransactionStatus
from src.schemas.category import CategoryResponse
from src.schemas.merchant import MerchantResponse


class TransactionBase(BaseModel):
    amount: Decimal
    currency: str = "INR"
    timestamp: Optional[datetime] = None
    merchant_id: Optional[int] = None
    merchant_raw_name: Optional[str] = None
    category_id: Optional[int] = None
    upi_reference_id: Optional[str] = None
    upi_vpa: Optional[str] = None
    payment_app: Optional[str] = None
    notes: Optional[str] = None


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(BaseModel):
    amount: Optional[Decimal] = None
    currency: Optional[str] = None
    timestamp: Optional[datetime] = None
    merchant_id: Optional[int] = None
    merchant_raw_name: Optional[str] = None
    category_id: Optional[int] = None
    notes: Optional[str] = None
    status: Optional[TransactionStatus] = None


class TransactionListItemResponse(TransactionBase):
    id: int
    user_id: int
    status: TransactionStatus
    has_receipt: bool = False
    created_at: datetime
    updated_at: datetime

    category: Optional[CategoryResponse] = None
    merchant: Optional[MerchantResponse] = None

    model_config = ConfigDict(from_attributes=True)


class TransactionDetailResponse(TransactionListItemResponse):
    raw_extracted_text: Optional[str] = None


# Alias for backwards compatibility across existing service layers
TransactionResponse = TransactionDetailResponse

