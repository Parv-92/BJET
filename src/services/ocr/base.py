from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, List


@dataclass
class OCRResult:
    """Structured result returned by an OCRProvider."""
    text: str
    lines: List[str] = field(default_factory=list)
    mean_confidence: float = 0.0
    raw_boxes: List[Any] = field(default_factory=list)


class OCRProvider(ABC):
    """Abstract interface/protocol for OCR text extraction engines."""

    @abstractmethod
    def extract_text(self, image_bytes: bytes) -> OCRResult:
        """Extract text from raw image bytes.

        Args:
            image_bytes: Raw binary content of the image.

        Returns:
            OCRResult containing full text, separated lines, and confidence metrics.
        """
        pass
