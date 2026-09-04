import re
from typing import Optional

from src.services.parsing.base_parser import BaseReceiptParser
from src.services.parsing.models import ExtractedTransaction


class GenericUPIParser(BaseReceiptParser):
    """Heuristic fallback parser for generic or unrecognized UPI payment receipts."""

    APP_NAME = "Generic UPI"

    GENERIC_MERCHANT_PATTERNS = [
        re.compile(r"(?:Paid to|Transfer to|Sent to|To)\s+([A-Za-z0-9\s&.\-']+?)(?:\n|$|\+91|\d{10}|[a-zA-Z0-9.\-_]+@)", re.IGNORECASE),
    ]

    def can_parse(self, text: str) -> bool:
        # Fallback parser can attempt to parse any receipt text
        return True

    def parse(self, text: str) -> ExtractedTransaction:
        amount = self.extract_amount(text)
        upi_ref = self.extract_upi_ref(text)
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
            confidence_points += 0.25
        else:
            warnings.append("merchant_missing")

        if upi_ref:
            confidence_points += 0.25
        else:
            warnings.append("upi_reference_missing")

        if timestamp:
            confidence_points += 0.1

        # Detect app name if present anywhere in text
        app_name = self.detect_app_name(text)

        return ExtractedTransaction(
            amount=amount,
            currency="INR",
            timestamp=timestamp,
            merchant_raw_name=merchant_name,
            upi_reference_id=upi_ref,
            upi_vpa=vpa,
            payment_app=app_name,
            confidence=round(confidence_points, 2),
            warnings=warnings,
        )

    def detect_app_name(self, text: str) -> str:
        lower = text.lower()
        if "google pay" in lower or "gpay" in lower:
            return "Google Pay"
        if "phonepe" in lower:
            return "PhonePe"
        if "paytm" in lower:
            return "Paytm"
        if "cred" in lower:
            return "CRED"
        if "bhim" in lower:
            return "BHIM"
        if "amazon pay" in lower:
            return "Amazon Pay"
        return self.APP_NAME

    def extract_merchant(self, text: str) -> Optional[str]:
        for pattern in self.GENERIC_MERCHANT_PATTERNS:
            match = pattern.search(text)
            if match:
                candidate = match.group(1).strip()
                if len(candidate) > 1 and not candidate.lower().startswith("bank"):
                    return candidate

        # If no explicit "to" pattern matched, check lines before the amount line
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        for i, line in enumerate(lines):
            if any(sym in line for sym in ["₹", "INR", "Rs."]) and i > 0:
                prev_line = lines[i - 1]
                if len(prev_line) > 2 and not any(kw in prev_line.lower() for kw in ["success", "completed", "paid"]):
                    return prev_line
        return None
