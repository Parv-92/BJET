from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal
from typing import List, Optional


@dataclass
class ExtractedTransaction:
    """Represents data extracted from an OCR receipt by a parser."""
    amount: Optional[Decimal] = None
    currency: str = "INR"
    timestamp: Optional[datetime] = None
    merchant_raw_name: Optional[str] = None
    upi_reference_id: Optional[str] = None  # 12-digit UTR or provider transaction ref
    upi_vpa: Optional[str] = None           # e.g., user@okhdfcbank or merchant@icici
    payment_app: str = "Generic UPI"        # Google Pay, PhonePe, Paytm, Generic UPI
    confidence: float = 0.0                 # 0.0 to 1.0
    warnings: List[str] = field(default_factory=list)
