from dataclasses import dataclass
from typing import Optional
from sqlalchemy.orm import Session

from src.models.category import Category
from src.repositories.category_repo import category_repo
from src.repositories.merchant_repo import merchant_repo
from src.repositories.rule_repo import rule_repo


@dataclass
class CategorizationResult:
    """Result of the intelligent categorization engine."""
    category_id: int
    source: str  # "user_rule", "merchant_default", "fallback"
    matched_rule_id: Optional[int] = None


def normalize_text(text: Optional[str]) -> str:
    """Normalize whitespace and case: collapse multi-space, strip, uppercase."""
    if not text:
        return ""
    return " ".join(text.strip().split()).upper()


class CategorizationService:
    """Intelligent Categorization Engine following the prioritized hierarchy:

    1. UserMerchantRule (User-specific custom pattern preference, ordered by priority DESC, created_at DESC)
    2. Known Merchant default category (When a resolved merchant exists)
    3. Fallback to Uncategorized (System default fallback category)
    """

    def predict_category(
        self,
        db: Session,
        user_id: int,
        merchant_name: Optional[str] = None,
        upi_vpa: Optional[str] = None,
        merchant_id: Optional[int] = None,
        merchant_raw_name: Optional[str] = None,
    ) -> CategorizationResult:
        raw_merchant = merchant_raw_name or merchant_name or ""
        norm_merchant = normalize_text(raw_merchant)
        clean_vpa = upi_vpa.strip().lower() if upi_vpa else ""

        # Resolve merchant record early to obtain merchant.clean_name for candidate matching
        merchant = None
        if merchant_id:
            merchant = merchant_repo.get_by_id(db, merchant_id)
        if not merchant and clean_vpa:
            merchant = merchant_repo.find_by_vpa(db, clean_vpa)
        if not merchant and norm_merchant:
            merchant = merchant_repo.find_by_clean_name(db, norm_merchant)

        # Build normalized candidate values: merchant_raw_name, merchant.clean_name, upi_vpa
        candidates: list[str] = []
        if norm_merchant:
            candidates.append(norm_merchant)
        if merchant and merchant.clean_name:
            norm_clean = normalize_text(merchant.clean_name)
            if norm_clean and norm_clean not in candidates:
                candidates.append(norm_clean)
        if clean_vpa:
            candidates.append(normalize_text(clean_vpa))

        # ---------------------------------------------------------
        # Step 1: Check UserMerchantRule (Highest Priority)
        # Evaluated by priority descending, then created_at descending
        # ---------------------------------------------------------
        user_rules = rule_repo.list_for_user(db, user_id)
        for rule in user_rules:
            norm_pattern = normalize_text(rule.merchant_pattern)
            if not norm_pattern:
                continue

            # Strict substring matching: rule_pattern in candidate
            is_match = any(norm_pattern in candidate for candidate in candidates)

            if is_match:
                # Ensure the category is valid and accessible to the user
                cat = category_repo.get_by_id_for_user(db, rule.category_id, user_id)
                if cat:
                    return CategorizationResult(
                        category_id=rule.category_id,
                        source="user_rule",
                        matched_rule_id=rule.id,
                    )

        # ---------------------------------------------------------
        # Step 2: Check known Merchant default category (Secondary)
        # ---------------------------------------------------------
        if merchant and merchant.default_category_id:
            cat = category_repo.get_by_id_for_user(db, merchant.default_category_id, user_id)
            if cat:
                return CategorizationResult(
                    category_id=merchant.default_category_id,
                    source="merchant_default",
                    matched_rule_id=None,
                )

        # ---------------------------------------------------------
        # Step 3: Fallback to System default "Uncategorized"
        # ---------------------------------------------------------
        uncategorized_cat = (
            db.query(Category)
            .filter(Category.name == "Uncategorized", Category.is_system_default.is_(True))
            .first()
        )
        if not uncategorized_cat:
            raise RuntimeError("Required system category 'Uncategorized' is missing.")

        return CategorizationResult(
            category_id=uncategorized_cat.id,
            source="fallback",
            matched_rule_id=None,
        )


categorization_service = CategorizationService()
