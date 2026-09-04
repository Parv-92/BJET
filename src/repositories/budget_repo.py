from decimal import Decimal
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, extract

from src.models.budget import Budget
from src.models.transaction import Transaction, TransactionStatus
from src.repositories.base import BaseRepository
from src.schemas.budget import BudgetCreate, BudgetUpdate, BudgetSummary


class BudgetRepository(BaseRepository[Budget]):
    def __init__(self):
        super().__init__(Budget)

    def get_by_category_and_period(
        self, db: Session, user_id: int, category_id: int, month: int, year: int
    ) -> Optional[Budget]:
        return (
            db.query(Budget)
            .options(joinedload(Budget.category))
            .filter(
                Budget.user_id == user_id,
                Budget.category_id == category_id,
                Budget.month == month,
                Budget.year == year,
            )
            .first()
        )

    def get_all_for_period(
        self, db: Session, user_id: int, month: int, year: int
    ) -> List[Budget]:
        return (
            db.query(Budget)
            .options(joinedload(Budget.category))
            .filter(
                Budget.user_id == user_id,
                Budget.month == month,
                Budget.year == year,
            )
            .all()
        )

    def create_or_update(
        self, db: Session, user_id: int, budget_in: BudgetCreate
    ) -> Budget:
        existing = self.get_by_category_and_period(
            db, user_id, budget_in.category_id, budget_in.month, budget_in.year
        )
        if existing:
            existing.amount_limit = budget_in.amount_limit
            db.add(existing)
            db.commit()
            db.refresh(existing)
            return existing

        budget = Budget(
            user_id=user_id,
            category_id=budget_in.category_id,
            month=budget_in.month,
            year=budget_in.year,
            amount_limit=budget_in.amount_limit,
        )
        db.add(budget)
        db.commit()
        db.refresh(budget)
        return budget

    def get_spent_amount(
        self, db: Session, user_id: int, category_id: int, month: int, year: int
    ) -> Decimal:
        """Sum confirmed transactions for this category, month, and year."""
        result = (
            db.query(func.coalesce(func.sum(Transaction.amount), 0))
            .filter(
                Transaction.user_id == user_id,
                Transaction.category_id == category_id,
                Transaction.status != TransactionStatus.PENDING_CONFIRMATION,
                extract("month", Transaction.timestamp) == month,
                extract("year", Transaction.timestamp) == year,
            )
            .scalar()
        )
        return Decimal(str(result))

    def get_budget_summary(
        self, db: Session, budget: Budget
    ) -> BudgetSummary:
        spent = self.get_spent_amount(
            db, budget.user_id, budget.category_id, budget.month, budget.year
        )
        remaining = budget.amount_limit - spent
        percentage = float((spent / budget.amount_limit) * 100) if budget.amount_limit > 0 else 0.0

        return BudgetSummary(
            id=budget.id,
            user_id=budget.user_id,
            category_id=budget.category_id,
            month=budget.month,
            year=budget.year,
            amount_limit=budget.amount_limit,
            created_at=budget.created_at,
            updated_at=budget.updated_at,
            category=budget.category,
            spent_amount=spent,
            remaining_amount=remaining,
            percentage_used=round(percentage, 2),
            is_over_budget=spent > budget.amount_limit,
        )


budget_repo = BudgetRepository()
