from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.api.deps import get_db, get_current_user
from src.core.exceptions import NotFoundError, DuplicateError
from src.models.user import User
from src.schemas.rule import UserMerchantRuleCreate, UserMerchantRuleResponse
from src.services.rule_service import rule_service

router = APIRouter(prefix="/rules", tags=["Merchant Rules"])


@router.get("", response_model=List[UserMerchantRuleResponse])
def list_merchant_rules(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[UserMerchantRuleResponse]:
    """Retrieve all merchant categorization rules configured by the authenticated user."""
    return rule_service.list_rules(db=db, user_id=current_user.id)


@router.post("", response_model=UserMerchantRuleResponse, status_code=status.HTTP_201_CREATED)
def create_merchant_rule(
    rule_in: UserMerchantRuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserMerchantRuleResponse:
    """Create a new auto-categorization rule mapping a merchant text pattern to a category."""
    try:
        return rule_service.create_rule(
            db=db, user_id=current_user.id, rule_in=rule_in
        )
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except DuplicateError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_merchant_rule(
    rule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """Delete an auto-categorization rule owned by the user."""
    try:
        rule_service.delete_rule(db=db, user_id=current_user.id, rule_id=rule_id)
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
