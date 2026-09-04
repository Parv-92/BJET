from decimal import Decimal
from src.services.parsing.google_pay_parser import GooglePayParser
from src.services.parsing.phonepe_parser import PhonePeParser
from src.services.parsing.paytm_parser import PaytmParser
from src.services.parsing.generic_parser import GenericUPIParser
from src.services.parsing.extraction_service import extraction_service


def test_google_pay_parser():
    raw_text = """
    Google Pay
    Paid to Starbucks Coffee
    starbucks@hdfcbank
    ₹350.50
    Completed
    15 Aug 2026, 10:45 AM
    UPI transaction ID: 623456789012
    """
    parser = GooglePayParser()
    assert parser.can_parse(raw_text) is True

    extracted = parser.parse(raw_text)
    assert extracted.amount == Decimal("350.50")
    assert extracted.merchant_raw_name == "Starbucks Coffee"
    assert extracted.upi_reference_id == "623456789012"
    assert extracted.upi_vpa == "starbucks@hdfcbank"
    assert extracted.payment_app == "Google Pay"
    assert extracted.confidence > 0.8
    assert len(extracted.warnings) == 0


def test_phonepe_parser():
    raw_text = """
    PhonePe
    Transaction Successful
    Paid to Zomato Limited
    ₹680.00
    Debited from State Bank of India
    UTR: 723456789012
    16 Aug 2026 08:30 PM
    """
    parser = PhonePeParser()
    assert parser.can_parse(raw_text) is True

    extracted = parser.parse(raw_text)
    assert extracted.amount == Decimal("680.00")
    assert extracted.merchant_raw_name == "Zomato Limited"
    assert extracted.upi_reference_id == "723456789012"
    assert extracted.payment_app == "PhonePe"
    assert extracted.confidence > 0.8
    assert len(extracted.warnings) == 0


def test_paytm_parser():
    raw_text = """
    Paytm
    Paid successfully to Blinkit Store
    ₹240.00
    UPI Ref No: 823456789012
    Order ID: PAYTM987654321
    17-08-2026 14:15
    """
    parser = PaytmParser()
    assert parser.can_parse(raw_text) is True

    extracted = parser.parse(raw_text)
    assert extracted.amount == Decimal("240.00")
    assert extracted.merchant_raw_name == "Blinkit Store"
    assert extracted.upi_reference_id == "823456789012"
    assert extracted.payment_app == "Paytm"
    assert extracted.confidence > 0.8
    assert len(extracted.warnings) == 0


def test_generic_parser():
    raw_text = """
    Transfer to Chai Point
    Amount: ₹45.00
    Ref: 923456789012
    chaipoint@upi
    """
    parser = GenericUPIParser()
    extracted = parser.parse(raw_text)
    assert extracted.amount == Decimal("45.00")
    assert extracted.merchant_raw_name == "Chai Point"
    assert extracted.upi_reference_id == "923456789012"
    assert extracted.upi_vpa == "chaipoint@upi"


def test_extraction_service_orchestration():
    raw_text = """
    Google Pay
    Paid to Uber India
    uber@icici
    ₹490.00
    UPI transaction ID: 523456789012
    18 Aug 2026
    """
    result = extraction_service.extract(raw_text)
    assert result.payment_app == "Google Pay"
    assert result.amount == Decimal("490.00")
    assert result.merchant_raw_name == "Uber India"
    assert result.upi_reference_id == "523456789012"


def test_extraction_service_empty_text():
    result = extraction_service.extract("")
    assert result.confidence == 0.0
    assert "amount_missing" in result.warnings
