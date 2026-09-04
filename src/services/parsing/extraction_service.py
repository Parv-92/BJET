from typing import List

from src.services.parsing.base_parser import BaseReceiptParser
from src.services.parsing.google_pay_parser import GooglePayParser
from src.services.parsing.phonepe_parser import PhonePeParser
from src.services.parsing.paytm_parser import PaytmParser
from src.services.parsing.generic_parser import GenericUPIParser
from src.services.parsing.models import ExtractedTransaction


class TransactionExtractionService:
    """Orchestrates candidate parsers to extract structured transactions from raw OCR text."""

    def __init__(self, parsers: List[BaseReceiptParser] | None = None):
        self.parsers: List[BaseReceiptParser] = parsers or [
            GooglePayParser(),
            PhonePeParser(),
            PaytmParser(),
        ]
        self.fallback_parser = GenericUPIParser()

    def extract(self, raw_text: str) -> ExtractedTransaction:
        """Extract transaction details by testing specialized parsers then falling back to generic."""
        if not raw_text or not raw_text.strip():
            return ExtractedTransaction(
                warnings=["empty_ocr_text", "amount_missing"],
                confidence=0.0,
            )

        best_result: ExtractedTransaction | None = None

        # 1. Try specialized parsers first
        for parser in self.parsers:
            if parser.can_parse(raw_text):
                result = parser.parse(raw_text)
                if best_result is None or result.confidence > best_result.confidence:
                    best_result = result

        # 2. If specialized parser found a reliable amount, return it
        if best_result and best_result.amount is not None:
            return best_result

        # 3. Otherwise, run generic heuristic parser
        fallback_result = self.fallback_parser.parse(raw_text)

        if best_result is None:
            return fallback_result

        # If fallback found amount but specialized did not, merge or return fallback
        if fallback_result.amount is not None and best_result.amount is None:
            best_result.amount = fallback_result.amount
            if "amount_missing" in best_result.warnings:
                best_result.warnings.remove("amount_missing")
            best_result.confidence = max(best_result.confidence, fallback_result.confidence)

        return best_result


extraction_service = TransactionExtractionService()
