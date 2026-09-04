class DomainException(Exception):
    """Base exception for all domain business errors."""
    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


class NotFoundError(DomainException):
    """Raised when an entity is not found or not accessible."""
    pass


class DuplicateError(DomainException):
    """Raised when an entity with duplicate unique attributes already exists."""
    pass


class PermissionDeniedError(DomainException):
    """Raised when an operation is prohibited on an entity (e.g., modifying system defaults)."""
    pass


class ValidationError(DomainException):
    """Raised when input data violates domain rules."""
    pass


# Specific Category Domain Exceptions
class CategoryNotFoundError(NotFoundError):
    pass


class CategoryDuplicateError(DuplicateError):
    pass


class CategoryImmutableError(PermissionDeniedError):
    pass


# Specific Transaction & Receipt Domain Exceptions
class TransactionNotFoundError(NotFoundError):
    pass


class ReceiptNotFoundError(NotFoundError):
    pass


class TransactionAlreadyConfirmedError(ValidationError):
    """Raised when attempting to confirm a transaction that has already been confirmed."""
    pass


# Specific Rule Domain Exceptions
class RuleNotFoundError(NotFoundError):
    pass


class RuleDuplicateError(DuplicateError):
    pass

