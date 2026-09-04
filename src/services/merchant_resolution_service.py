from dataclasses import dataclass
from typing import Optional
from sqlalchemy.orm import Session

from src.repositories.merchant_repo import merchant_repo


@dataclass
class MerchantResolutionResult:
    """Result of attempting to match an extracted merchant to known records."""
    merchant_id: Optional[int] = None
    merchant_name: Optional[str] = None
    default_category_id: Optional[int] = None
    is_resolved: bool = False


class MerchantResolutionService:
    """Safely resolves extracted merchant text against verified database merchants.

    Safety Rule: Never automatically creates permanent database records from unverified
    or low-confidence OCR text. If no high-confidence match is found, preserves the raw name
    and leaves merchant_id as None.
    """

    def resolve(
        self,
        db: Session,
        raw_name: Optional[str],
        vpa: Optional[str],
    ) -> MerchantResolutionResult:
        if not raw_name and not vpa:
            return MerchantResolutionResult()

        # 1. High-confidence lookup by UPI VPA
        if vpa:
            merchant = merchant_repo.find_by_vpa(db, vpa)
            if merchant:
                return MerchantResolutionResult(
                    merchant_id=merchant.id,
                    merchant_name=merchant.name,
                    default_category_id=merchant.default_category_id,
                    is_resolved=True,
                )

        # 2. High-confidence exact/normalized match by clean name
        if raw_name:
            clean_name = raw_name.strip().upper()
            merchant = merchant_repo.find_by_clean_name(db, clean_name)
            if merchant:
                return MerchantResolutionResult(
                    merchant_id=merchant.id,
                    merchant_name=merchant.name,
                    default_category_id=merchant.default_category_id,
                    is_resolved=True,
                )

        # 3. Unresolved: preserve raw name, do NOT create permanent DB Merchant
        return MerchantResolutionResult(
            merchant_id=None,
            merchant_name=raw_name.strip() if raw_name else None,
            default_category_id=None,
            is_resolved=False,
        )


merchant_resolution_service = MerchantResolutionService()
