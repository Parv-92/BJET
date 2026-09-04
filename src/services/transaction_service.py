from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session

from src.models.transaction import Transaction, TransactionStatus
from src.repositories.transaction_repo import transaction_repo
from src.repositories.category_repo import category_repo
from src.repositories.merchant_repo import merchant_repo
from src.schemas.transaction import TransactionCreate, TransactionUpdate


class TransactionService:
    def list_transactions(
        self,
        db: Session,
        user_id: int,
        skip: int = 0,
        limit: int = 100,
        category_id: Optional[int] = None,
        status: Optional[TransactionStatus] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> List[Transaction]:
        return transaction_repo.get_all_for_user(
            db=db,
            user_id=user_id,
            skip=skip,
            limit=limit,
            category_id=category_id,
            status=status,
            start_date=start_date,
            end_date=end_date,
        )

    def get_transaction(self, db: Session, user_id: int, transaction_id: int) -> Optional[Transaction]:
        return transaction_repo.get_by_id_for_user(db, user_id=user_id, transaction_id=transaction_id)

    def create_transaction(
        self,
        db: Session,
        user_id: int,
        transaction_in: TransactionCreate,
        status: TransactionStatus = TransactionStatus.CONFIRMED,
        raw_text: Optional[str] = None,
        receipt_image_path: Optional[str] = None,
    ) -> Transaction:
        # Validate category if provided
        if transaction_in.category_id is not None:
            category = category_repo.get_by_id_for_user(db, transaction_in.category_id, user_id)
            if not category:
                raise ValueError("Specified category does not exist or is not accessible")

        # Auto-create or resolve merchant if merchant_raw_name is provided but merchant_id is not
        if not transaction_in.merchant_id and transaction_in.merchant_raw_name:
            merchant = merchant_repo.get_or_create(
                db=db,
                name=transaction_in.merchant_raw_name,
                upi_vpa=transaction_in.upi_vpa,
                default_category_id=transaction_in.category_id,
            )
            transaction_in.merchant_id = merchant.id

        return transaction_repo.create_for_user(
            db=db,
            user_id=user_id,
            transaction_in=transaction_in,
            status=status,
            raw_text=raw_text,
            receipt_image_path=receipt_image_path,
        )

    def update_transaction(
        self,
        db: Session,
        user_id: int,
        transaction_id: int,
        update_in: TransactionUpdate,
    ) -> Transaction:
        transaction = transaction_repo.get_by_id_for_user(db, user_id, transaction_id)
        if not transaction:
            raise KeyError("Transaction not found")

        if update_in.category_id is not None:
            category = category_repo.get_by_id_for_user(db, update_in.category_id, user_id)
            if not category:
                raise ValueError("Specified category does not exist or is not accessible")

        return transaction_repo.update_for_user(db, user_id, transaction, update_in)

    def delete_transaction(self, db: Session, user_id: int, transaction_id: int) -> bool:
        return transaction_repo.delete_for_user(db, user_id, transaction_id)


transaction_service = TransactionService()
