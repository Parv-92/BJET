from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_

from src.models.category import Category
from src.repositories.base import BaseRepository
from src.schemas.category import CategoryCreate

DEFAULT_CATEGORIES = [
    {"name": "Food & Dining", "icon": "utensils", "color": "#FF5722"},
    {"name": "Groceries", "icon": "shopping-basket", "color": "#4CAF50"},
    {"name": "Shopping", "icon": "shopping-bag", "color": "#E91E63"},
    {"name": "Transportation", "icon": "car", "color": "#2196F3"},
    {"name": "Utilities & Bills", "icon": "bolt", "color": "#FF9800"},
    {"name": "Entertainment", "icon": "film", "color": "#9C27B0"},
    {"name": "Health & Medical", "icon": "heart", "color": "#F44336"},
    {"name": "Education", "icon": "graduation-cap", "color": "#3F51B5"},
    {"name": "Personal Care", "icon": "sparkles", "color": "#00BCD4"},
    {"name": "Other / Miscellaneous", "icon": "ellipsis-h", "color": "#607D8B"},
]


class CategoryRepository(BaseRepository[Category]):
    def __init__(self):
        super().__init__(Category)

    def get_all_for_user(self, db: Session, user_id: int) -> List[Category]:
        """Fetch both global system categories and user-specific custom categories."""
        return (
            db.query(Category)
            .filter(or_(Category.is_system_default.is_(True), Category.user_id == user_id))
            .order_by(Category.name)
            .all()
        )

    def get_by_id_for_user(self, db: Session, category_id: int, user_id: int) -> Optional[Category]:
        """Get category if it is a system default or owned by the user."""
        return (
            db.query(Category)
            .filter(
                Category.id == category_id,
                or_(Category.is_system_default.is_(True), Category.user_id == user_id),
            )
            .first()
        )

    def create_for_user(self, db: Session, user_id: int, category_in: CategoryCreate) -> Category:
        category = Category(
            name=category_in.name,
            icon=category_in.icon,
            color=category_in.color,
            is_system_default=False,
            user_id=user_id,
        )
        db.add(category)
        db.commit()
        db.refresh(category)
        return category

    def init_default_categories(self, db: Session) -> None:
        """Seed default categories if none exist."""
        existing = db.query(Category).filter(Category.is_system_default.is_(True)).first()
        if not existing:
            for item in DEFAULT_CATEGORIES:
                cat = Category(
                    name=item["name"],
                    icon=item["icon"],
                    color=item["color"],
                    is_system_default=True,
                    user_id=None,
                )
                db.add(cat)
            db.commit()


category_repo = CategoryRepository()
