from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

from src.schemas.category import CategoryResponse


class UserMerchantRuleBase(BaseModel):
    merchant_pattern: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Text pattern to match merchant name (e.g. 'SWIGGY', 'UBER')",
    )
    category_id: int = Field(..., description="Target category ID to map to")
    priority: int = Field(
        default=1,
        ge=1,
        le=100,
        description="Rule evaluation priority (1-100, higher evaluated first)",
    )


class UserMerchantRuleCreate(UserMerchantRuleBase):
    pass


class UserMerchantRuleUpdate(BaseModel):
    merchant_pattern: Optional[str] = Field(None, min_length=1, max_length=100)
    category_id: Optional[int] = None
    priority: Optional[int] = Field(None, ge=1, le=100)


class UserMerchantRuleResponse(UserMerchantRuleBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    category: Optional[CategoryResponse] = None

    model_config = ConfigDict(from_attributes=True)
