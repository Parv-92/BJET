"""Add user merchant rule unique constraint

Revision ID: 9a12c4e56f78
Revises: 8548fdccb0ec
Create Date: 2026-09-04 13:15:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9a12c4e56f78'
down_revision: Union[str, Sequence[str], None] = '8548fdccb0ec'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('user_merchant_rules', schema=None) as batch_op:
        batch_op.create_unique_constraint('uq_user_merchant_pattern', ['user_id', 'merchant_pattern'])


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('user_merchant_rules', schema=None) as batch_op:
        batch_op.drop_constraint('uq_user_merchant_pattern', type_='unique')
