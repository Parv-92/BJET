from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from src.models.rule import UserMerchantRule
from src.repositories.base import BaseRepository
from src.schemas.rule import UserMerchantRuleCreate


def normalize_pattern(pattern: str) -> str:
    """Normalize whitespace and case: collapse multi-space, strip, uppercase."""
    return " ".join(pattern.strip().split()).upper()


class RuleRepository(BaseRepository[UserMerchantRule]):
    def __init__(self):
        super().__init__(UserMerchantRule)

    def list_for_user(self, db: Session, user_id: int) -> List[UserMerchantRule]:
        return (
            db.query(UserMerchantRule)
            .options(joinedload(UserMerchantRule.category))
            .filter(UserMerchantRule.user_id == user_id)
            .order_by(UserMerchantRule.priority.desc(), UserMerchantRule.created_at.desc())
            .all()
        )

    def get_by_id_for_user(self, db: Session, user_id: int, rule_id: int) -> Optional[UserMerchantRule]:
        return (
            db.query(UserMerchantRule)
            .options(joinedload(UserMerchantRule.category))
            .filter(UserMerchantRule.id == rule_id, UserMerchantRule.user_id == user_id)
            .first()
        )

    def find_duplicate(
        self, db: Session, user_id: int, pattern: str
    ) -> Optional[UserMerchantRule]:
        clean_pat = normalize_pattern(pattern)
        rules = db.query(UserMerchantRule).filter(UserMerchantRule.user_id == user_id).all()
        for r in rules:
            if normalize_pattern(r.merchant_pattern) == clean_pat:
                return r
        return None

    def create_rule(
        self, db: Session, user_id: int, rule_in: UserMerchantRuleCreate
    ) -> UserMerchantRule:
        rule = UserMerchantRule(
            user_id=user_id,
            merchant_pattern=normalize_pattern(rule_in.merchant_pattern),
            category_id=rule_in.category_id,
            priority=rule_in.priority,
        )
        db.add(rule)
        db.commit()
        db.refresh(rule)
        return rule

    def delete_rule(self, db: Session, rule: UserMerchantRule) -> None:
        db.delete(rule)
        db.commit()


rule_repo = RuleRepository()
