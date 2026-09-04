import re
from typing import Optional

from src.services.parsing.base_parser import BaseReceiptParser
from src.services.parsing.models import ExtractedTransaction


class PhonePeParser(BaseReceiptParser):
    """Specialized parser for PhonePe UPI payment receipts."""

    APP_NAME = "PhonePe"
    IDENTIFIERS = ["phonepe", "transaction successful", "debited from", "phonepe transaction id"]

    MERCHANT_PATTERNS = [
        re.compile(r"Paid to\s*\n*([A-Za-z0-9\s&.\-']+?)(?:\n|$|\+91|\d{10}|[a-zA-Z0-9.\-_]+@)", re.IGNORECASE),
        re.compile(r"Transfer to\s*\n*([A-Za-z0-9\s&.\-']+?)(?:\n|$|\+91|\d{10}|[a-zA-Z0-9.\-_]+@)", re.IGNORECASE),
        re.compile(r"To:\s*([A-Za-z0-9\s&.\-']+?)(?:\n|$)", re.IGNORECASE),
    ]

    PHONEPE_UTR_PATTERN = re.compile(r"UTR\s*[:\-]?\s*([0-9]{12})", re.IGNORECASE)

    def can_parse(self, text: str) -> bool:
        lower_text = text.lower()
        return any(ident in lower_text for ident in self.IDENTIFIERS)

    def parse(self, text: str) -> ExtractedTransaction:
        amount = self.extract_amount(text)
        upi_ref = self.extract_phonepe_utr(text) or self.extract_upi_ref(text)
        vpa = self.extract_vpa(text)
        timestamp = self.extract_date(text)
        merchant_name = self.extract_merchant(text)

        warnings = []
        confidence_points = 0.0

        if amount:
            confidence_points += 0.4
        else:
            warnings.append("amount_missing")

        if merchant_name:
            confidence_points += 0.3
        else:
            warnings.append("merchant_missing")

        if upi_ref:
            confidence_points += 0.2
        else:
            warnings.append("upi_reference_missing")

        if timestamp:
            confidence_points += 0.1

        return ExtractedTransaction(
            amount=amount,
            currency="INR",
            timestamp=timestamp,
            merchant_raw_name=merchant_name,
            upi_reference_id=upi_ref,
            upi_vpa=vpa,
            payment_app=self.APP_NAME,
            confidence=round(confidence_points, 2),
            warnings=warnings,
        )

    def extract_phonepe_utr(self, text: str) -> Optional[str]:
        match = self.PHONEPE_UTR_PATTERN.search(text)
        return match.group(1) if match else None

    def extract_merchant(self, text: str) -> Optional[str]:
        for pattern in self.MERCHANT_PATTERNS:
            match = pattern.search(text)
            if match:
                candidate = match.group(1).strip()
                if len(candidate) > 1 and not candidate.lower().startswith("bank"):
                    return candidate
        return None
