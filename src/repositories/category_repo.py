from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from src.models.category import Category
from src.repositories.base import BaseRepository
from src.schemas.category import CategoryCreate, CategoryUpdate

# System default categories aligned with ARCHITECTURE.md (including Uncategorized fallback)
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
    {"name": "Uncategorized", "icon": "question-circle", "color": "#9E9E9E"},
]


class CategoryRepository(BaseRepository[Category]):
    def __init__(self):
        super().__init__(Category)

    def get_all_for_user(self, db: Session, user_id: int) -> List[Category]:
        """Fetch all categories accessible to this user (global defaults + user's custom categories)."""
        return (
            db.query(Category)
            .filter(
                or_(
                    Category.is_system_default.is_(True),
                    Category.user_id == user_id,
                )
            )
            .order_by(Category.is_system_default.desc(), Category.name.asc())
            .all()
        )

    def get_by_id_for_user(self, db: Session, category_id: int, user_id: int) -> Optional[Category]:
        """Fetch category by ID if it is a system default or owned by the user."""
        return (
            db.query(Category)
            .filter(
                Category.id == category_id,
                or_(
                    Category.is_system_default.is_(True),
                    Category.user_id == user_id,
                ),
            )
            .first()
        )

    def get_by_name_for_user(self, db: Session, name: str, user_id: int) -> Optional[Category]:
        """Check if a category with this name already exists for the user or system defaults (case-insensitive)."""
        clean_name = name.strip().lower()
        return (
            db.query(Category)
            .filter(
                func.lower(Category.name) == clean_name,
                or_(
                    Category.is_system_default.is_(True),
                    Category.user_id == user_id,
                ),
            )
            .first()
        )

    def create_for_user(self, db: Session, user_id: int, category_in: CategoryCreate) -> Category:
        """Persist a new user-owned custom category."""
        category = Category(
            name=category_in.name.strip(),
            icon=category_in.icon.strip() if category_in.icon else None,
            color=category_in.color.strip() if category_in.color else None,
            is_system_default=False,
            user_id=user_id,
        )
        db.add(category)
        db.commit()
        db.refresh(category)
        return category

    def update_for_user(
        self, db: Session, category: Category, update_in: CategoryUpdate
    ) -> Category:
        """Update fields of an existing custom category."""
        if update_in.name is not None:
            category.name = update_in.name.strip()
        if update_in.icon is not None:
            category.icon = update_in.icon.strip() if update_in.icon else None
        if update_in.color is not None:
            category.color = update_in.color.strip() if update_in.color else None

        db.add(category)
        db.commit()
        db.refresh(category)
        return category

    def delete(self, db: Session, category: Category) -> None:
        """Delete an existing category."""
        db.delete(category)
        db.commit()

    def init_default_categories(self, db: Session) -> None:
        """Seed all system default categories if they do not already exist."""
        for item in DEFAULT_CATEGORIES:
            existing = (
                db.query(Category)
                .filter(
                    func.lower(Category.name) == item["name"].lower(),
                    Category.is_system_default.is_(True),
                )
                .first()
            )
            if not existing:
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
