from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class CategoryBase(BaseModel):
    name: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Name of the category",
    )
    icon: Optional[str] = Field(
        None,
        max_length=50,
        description="Icon identifier for the category (e.g., 'utensils', 'car')",
    )
    color: Optional[str] = Field(
        None,
        max_length=20,
        description="Hex color code or theme color (e.g., '#4CAF50')",
    )


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(
        None,
        min_length=1,
        max_length=100,
        description="Updated name of the category",
    )
    icon: Optional[str] = Field(
        None,
        max_length=50,
        description="Updated icon identifier",
    )
    color: Optional[str] = Field(
        None,
        max_length=20,
        description="Updated color hex code",
    )


class CategoryResponse(CategoryBase):
    id: int
    is_system_default: bool
    user_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
