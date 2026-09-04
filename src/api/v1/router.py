from fastapi import APIRouter

from src.api.v1.auth import router as auth_router
from src.api.v1.categories import router as categories_router
from src.api.v1.transactions import router as transactions_router
from src.api.v1.budgets import router as budgets_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(categories_router)
api_router.include_router(transactions_router)
api_router.include_router(budgets_router)
