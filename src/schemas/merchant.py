from typing import Optional
from pydantic import BaseModel, ConfigDict


class MerchantBase(BaseModel):
    name: str
    clean_name: Optional[str] = None
    upi_vpa: Optional[str] = None
    default_category_id: Optional[int] = None


class MerchantCreate(MerchantBase):
    pass


class MerchantResponse(MerchantBase):
    id: int
    clean_name: str

    model_config = ConfigDict(from_attributes=True)
