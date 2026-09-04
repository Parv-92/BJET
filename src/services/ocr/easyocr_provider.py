import threading
from typing import List, Optional
import numpy as np
import cv2

from src.services.ocr.base import OCRProvider, OCRResult


class EasyOCRProvider(OCRProvider):
    """Production OCRProvider using EasyOCR.

    Uses a thread-safe lazy singleton pattern to initialize PyTorch/EasyOCR models only once.
    """

    _reader = None
    _lock = threading.Lock()

    def __init__(self, languages: Optional[List[str]] = None, gpu: bool = False):
        self.languages = languages or ["en"]
        self.gpu = gpu

    @classmethod
    def get_reader(cls, languages: List[str], gpu: bool):
        if cls._reader is None:
            with cls._lock:
                if cls._reader is None:
                    import easyocr
                    cls._reader = easyocr.Reader(languages, gpu=gpu)
        return cls._reader

    def extract_text(self, image_bytes: bytes) -> OCRResult:
        reader = self.get_reader(self.languages, self.gpu)

        # Decode image bytes to numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            return OCRResult(text="", lines=[], mean_confidence=0.0, raw_boxes=[])

        # Run EasyOCR extraction: returns list of (bbox, text, prob)
        try:
            results = reader.readtext(img)
        except Exception:
            return OCRResult(text="", lines=[], mean_confidence=0.0, raw_boxes=[])

        lines: List[str] = []
        confidences: List[float] = []
        raw_boxes = []

        for bbox, text, prob in results:
            clean_str = text.strip()
            if clean_str:
                lines.append(clean_str)
                confidences.append(float(prob))
                raw_boxes.append({"bbox": bbox, "text": clean_str, "confidence": float(prob)})

        full_text = "\n".join(lines)
        mean_conf = float(np.mean(confidences)) if confidences else 0.0

        return OCRResult(
            text=full_text,
            lines=lines,
            mean_confidence=round(mean_conf, 4),
            raw_boxes=raw_boxes,
        )
