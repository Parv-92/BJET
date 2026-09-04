import re
from abc import ABC, abstractmethod
from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from src.services.parsing.models import ExtractedTransaction


class BaseReceiptParser(ABC):
    """Abstract base class for all UPI receipt parsers with common parsing heuristics."""

    @abstractmethod
    def can_parse(self, text: str) -> bool:
        """Return True if this parser can reliably handle the receipt format."""
        pass

    @abstractmethod
    def parse(self, text: str) -> ExtractedTransaction:
        """Extract structured transaction fields from raw OCR text."""
        pass

    # Common Regex Helpers
    AMOUNT_PATTERN = re.compile(
        r"(?:₹|INR|Rs\.?|Amount:?)\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)",
        re.IGNORECASE,
    )
    STANDALONE_AMOUNT_PATTERN = re.compile(
        r"^\s*(?:₹|INR|Rs\.?)?\s*([0-9]+(?:\.[0-9]{2})?)\s*$",
        re.MULTILINE,
    )
    UPI_REF_PATTERN = re.compile(
        r"(?:UPI\s*(?:Ref|Transaction|txn)?\s*(?:ID|No\.?|number)?|UTR:?)\s*[:\-]?\s*([0-9]{12})",
        re.IGNORECASE,
    )
    GENERIC_12_DIGIT_PATTERN = re.compile(r"\b([0-9]{12})\b")
    VPA_PATTERN = re.compile(r"\b([a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{2,})\b")

    DATE_PATTERNS = [
        # 15 Aug 2026, 04:30 PM
        (re.compile(r"(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}(?:,?\s+\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)?)"), "%d %b %Y"),
        # 15-08-2026 or 15/08/2026
        (re.compile(r"(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4}(?:\s+\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)?)"), "%d/%m/%Y"),
        # 2026-08-15
        (re.compile(r"(\d{4}[/\-]\d{1,2}[/\-]\d{1,2})"), "%Y-%m-%d"),
    ]

    def extract_amount(self, text: str) -> Optional[Decimal]:
        """Extract transaction amount using priority patterns."""
        match = self.AMOUNT_PATTERN.search(text)
        if match:
            raw_val = match.group(1).replace(",", "")
            try:
                return Decimal(raw_val)
            except Exception:
                pass

        # Check for standalone numeric lines that look like currency amounts
        for line in text.splitlines():
            m = self.STANDALONE_AMOUNT_PATTERN.match(line)
            if m:
                try:
                    val = Decimal(m.group(1))
                    if val > 0:
                        return val
                except Exception:
                    continue
        return None

    def extract_upi_ref(self, text: str) -> Optional[str]:
        """Extract 12-digit UPI reference ID / UTR."""
        match = self.UPI_REF_PATTERN.search(text)
        if match:
            return match.group(1)

        # Fallback to standalone 12-digit number
        match = self.GENERIC_12_DIGIT_PATTERN.search(text)
        if match:
            return match.group(1)
        return None

    def extract_vpa(self, text: str) -> Optional[str]:
        """Extract UPI VPA handle (e.g., merchant@bank)."""
        match = self.VPA_PATTERN.search(text)
        if match:
            vpa = match.group(1).lower()
            # Filter out common email domains that are not UPI VPAs
            if not any(vpa.endswith(domain) for domain in ["@gmail.com", "@yahoo.com", "@outlook.com", "@hotmail.com"]):
                return vpa
        return None

    def extract_date(self, text: str) -> Optional[datetime]:
        """Extract transaction date/time."""
        for pattern, _ in self.DATE_PATTERNS:
            match = pattern.search(text)
            if match:
                raw_date = match.group(1).replace(",", " ").strip()
                # Try parsing using common formats
                for fmt in (
                    "%d %b %Y %I:%M %p",
                    "%d %B %Y %I:%M %p",
                    "%d %b %Y %H:%M",
                    "%d %b %Y",
                    "%d/%m/%Y %I:%M %p",
                    "%d/%m/%Y %H:%M",
                    "%d/%m/%Y",
                    "%d-%m-%Y %H:%M",
                    "%d-%m-%Y",
                    "%Y-%m-%d",
                ):
                    try:
                        return datetime.strptime(raw_date, fmt)
                    except ValueError:
                        continue
        return None
