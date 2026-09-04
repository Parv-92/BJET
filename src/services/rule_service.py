from typing import List
from sqlalchemy.orm import Session

from src.core.exceptions import NotFoundError, RuleNotFoundError, RuleDuplicateError
from src.models.rule import UserMerchantRule
from src.repositories.category_repo import category_repo
from src.repositories.rule_repo import rule_repo
from src.schemas.rule import UserMerchantRuleCreate


class RuleService:
    def list_rules(self, db: Session, user_id: int) -> List[UserMerchantRule]:
        return rule_repo.list_for_user(db, user_id)

    def create_rule(
        self, db: Session, user_id: int, rule_in: UserMerchantRuleCreate
    ) -> UserMerchantRule:
        # Validate that category exists and is accessible to user
        category = category_repo.get_by_id_for_user(db, rule_in.category_id, user_id)
        if not category:
            raise NotFoundError(f"Category with ID {rule_in.category_id} not found or not accessible.")

        # Check for duplicate rule for the same pattern
        existing = rule_repo.find_duplicate(db, user_id, rule_in.merchant_pattern)
        if existing:
            raise RuleDuplicateError(
                f"A rule for merchant pattern '{rule_in.merchant_pattern}' already exists."
            )

        return rule_repo.create_rule(db, user_id, rule_in)

    def delete_rule(self, db: Session, user_id: int, rule_id: int) -> None:
        rule = rule_repo.get_by_id_for_user(db, user_id, rule_id)
        if not rule:
            raise RuleNotFoundError(f"Rule with ID {rule_id} not found.")

        rule_repo.delete_rule(db, rule)


rule_service = RuleService()
