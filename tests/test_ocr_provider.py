from src.services.ocr.base import OCRProvider, OCRResult
from src.services.ocr.mock_provider import MockOCRProvider


def test_mock_ocr_provider_contract():
    mock = MockOCRProvider(default_text="Paid to Swiggy\n₹450.00\nUPI Ref: 123456789012", default_confidence=0.92)
    assert isinstance(mock, OCRProvider)

    result = mock.extract_text(b"fake_image_bytes")
    assert isinstance(result, OCRResult)
    assert "Paid to Swiggy" in result.text
    assert len(result.lines) == 3
    assert result.mean_confidence == 0.92


def test_mock_ocr_provider_dynamic_response():
    mock = MockOCRProvider()
    mock.set_mock_response("Transaction Successful\n₹120.00", confidence=0.88)

    result = mock.extract_text(b"another_image")
    assert "Transaction Successful" in result.text
    assert result.mean_confidence == 0.88
