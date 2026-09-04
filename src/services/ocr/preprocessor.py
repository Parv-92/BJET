import io
import cv2
import numpy as np
from PIL import Image

from src.core.config import settings


class ImagePreprocessor:
    """Non-destructive in-memory image preprocessor for OCR optimization."""

    MAX_DIMENSION = 1800

    @classmethod
    def preprocess_image_bytes(cls, image_bytes: bytes) -> bytes:
        """Apply non-destructive in-memory adjustments to improve OCR character sharpness.

        The original image on disk is never touched or overwritten.
        """
        if not settings.ENABLE_IMAGE_PREPROCESSING:
            return image_bytes

        try:
            # Load image from bytes into numpy array
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if img is None:
                return image_bytes

            height, width = img.shape[:2]

            # 1. Smart downscaling only if image exceeds MAX_DIMENSION (to prevent OCR slowdown)
            if max(height, width) > cls.MAX_DIMENSION:
                scale = cls.MAX_DIMENSION / max(height, width)
                new_w = int(width * scale)
                new_h = int(height * scale)
                img = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)

            # 2. Convert to grayscale for OCR clarity
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

            # 3. Conservative contrast check:
            # If the image already has good dynamic range (clean digital screenshot),
            # do not alter it with aggressive thresholds.
            std_dev = np.std(gray)
            if std_dev < 40:
                # Low contrast image (e.g. washed out photograph of screen): apply mild CLAHE
                clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
                gray = clahe.apply(gray)

            # Encode back to PNG in-memory
            is_success, buffer = cv2.imencode(".png", gray)
            if is_success:
                return buffer.tobytes()

            return image_bytes
        except Exception:
            # If any preprocessing error occurs, safely fallback to unmodified raw image bytes
            return image_bytes
