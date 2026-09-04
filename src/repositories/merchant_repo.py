from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from src.models.merchant import Merchant
from src.repositories.base import BaseRepository


class MerchantRepository(BaseRepository[Merchant]):
    def __init__(self):
        super().__init__(Merchant)

    def find_by_clean_name(self, db: Session, clean_name: str) -> Optional[Merchant]:
        return (
            db.query(Merchant)
            .filter(func.lower(Merchant.clean_name) == clean_name.strip().lower())
            .first()
        )

    def find_by_vpa(self, db: Session, vpa: str) -> Optional[Merchant]:
        return (
            db.query(Merchant)
            .filter(func.lower(Merchant.upi_vpa) == vpa.strip().lower())
            .first()
        )

    def get_or_create(
        self,
        db: Session,
        name: str,
        clean_name: Optional[str] = None,
        upi_vpa: Optional[str] = None,
        default_category_id: Optional[int] = None,
    ) -> Merchant:
        c_name = (clean_name or name).strip().upper()
        if upi_vpa:
            merchant = self.find_by_vpa(db, upi_vpa)
            if merchant:
                return merchant

        merchant = self.find_by_clean_name(db, c_name)
        if merchant:
            return merchant

        merchant = Merchant(
            name=name.strip(),
            clean_name=c_name,
            upi_vpa=upi_vpa.strip().lower() if upi_vpa else None,
            default_category_id=default_category_id,
        )
        db.add(merchant)
        db.commit()
        db.refresh(merchant)
        return merchant


merchant_repo = MerchantRepository()
