from typing import Optional
from src.services.ocr.base import OCRProvider, OCRResult


class MockOCRProvider(OCRProvider):
    """Mock OCR provider for rapid, deterministic testing without deep-learning overhead."""

    def __init__(
        self,
        default_text: str = "",
        default_confidence: float = 0.95,
    ):
        self.default_text = default_text
        self.default_confidence = default_confidence
        self.last_processed_bytes: Optional[bytes] = None

    def set_mock_response(self, text: str, confidence: float = 0.95) -> None:
        """Dynamically set the mock OCR text for an upcoming test execution."""
        self.default_text = text
        self.default_confidence = confidence

    def extract_text(self, image_bytes: bytes) -> OCRResult:
        self.last_processed_bytes = image_bytes
        lines = [line.strip() for line in self.default_text.splitlines() if line.strip()]
        return OCRResult(
            text=self.default_text,
            lines=lines,
            mean_confidence=self.default_confidence,
            raw_boxes=[],
        )
