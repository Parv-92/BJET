from dataclasses import dataclass
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Optional
from sqlalchemy.orm import Session

from src.core.config import settings
from src.repositories.transaction_repo import transaction_repo


@dataclass
class DuplicateDetectionResult:
    """Result of duplicate receipt evaluation."""
    is_duplicate: bool = False
    existing_transaction_id: Optional[int] = None
    reason: Optional[str] = None


class DuplicateDetectionService:
    """Evaluates whether an extracted transaction likely duplicates an existing record.

    Primary Check: Exact match on same user and same 12-digit UPI Reference ID (UTR).
    Fallback Check: (Only when reference ID is unavailable) Same user, matching amount,
    matching merchant name (if available), and timestamp within a configured window.
    """

    def detect_duplicate(
        self,
        db: Session,
        user_id: int,
        upi_reference_id: Optional[str],
        amount: Optional[Decimal],
        merchant_raw_name: Optional[str] = None,
        timestamp: Optional[datetime] = None,
    ) -> DuplicateDetectionResult:
        # 1. Primary check: exact UPI reference ID
        if upi_reference_id:
            existing = transaction_repo.find_by_upi_reference_id(
                db=db,
                user_id=user_id,
                upi_reference_id=upi_reference_id,
            )
            if existing:
                return DuplicateDetectionResult(
                    is_duplicate=True,
                    existing_transaction_id=existing.id,
                    reason=f"A transaction with UPI Reference ID '{upi_reference_id}' already exists (ID #{existing.id}).",
                )

        # 2. Fallback check: only when UPI ref is absent, but amount is known
        if amount is not None and amount > 0:
            ref_time = timestamp or datetime.now()
            window_hours = settings.DUPLICATE_TIME_WINDOW_HOURS
            start_time = ref_time - timedelta(hours=window_hours)
            end_time = ref_time + timedelta(hours=window_hours)

            existing = transaction_repo.find_potential_duplicate(
                db=db,
                user_id=user_id,
                amount=amount,
                merchant_raw_name=merchant_raw_name,
                start_time=start_time,
                end_time=end_time,
            )
            if existing:
                date_str = existing.timestamp.strftime("%d %b %Y")
                return DuplicateDetectionResult(
                    is_duplicate=True,
                    existing_transaction_id=existing.id,
                    reason=f"A similar transaction of ₹{amount} was already logged around {date_str} (ID #{existing.id}).",
                )

        return DuplicateDetectionResult(is_duplicate=False)


duplicate_detection_service = DuplicateDetectionService()
