"""initial schema: contexts, terms, term_translations, context_terms, flight_legs

Revision ID: 0001_initial
Revises:
Create Date: 2026-06-03

Notlar:
  - UUID üretimi Python tarafında (uuid.uuid4) — Postgres extension gerekmez.
  - Her tabloda created_at + updated_at.
  - Enum tipleri postgresql.ENUM nesneleri olarak paylaşılır: manuel create
    bir kez, kolonlarda aynı nesneye referans — dispatch'in ikinci CREATE
    TYPE deyimi yollaması engellenir.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _ts_columns() -> list[sa.Column]:
    return [
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    ]


def upgrade() -> None:
    # ---- enums: tek nesne, paylaşılır --------------------------------
    context_mode = postgresql.ENUM(
        "full", "quick_pattern",
        name="context_mode",
        create_type=False,
    )
    term_type = postgresql.ENUM(
        "entity", "phrase",
        name="term_type",
        create_type=False,
    )
    confidence_level = postgresql.ENUM(
        "high", "medium", "review_needed",
        name="confidence_level",
        create_type=False,
    )

    bind = op.get_bind()
    context_mode.create(bind, checkfirst=True)
    term_type.create(bind, checkfirst=True)
    confidence_level.create(bind, checkfirst=True)

    # ---- contexts ----------------------------------------------------
    op.create_table(
        "contexts",
        sa.Column("id", sa.String(32), primary_key=True),
        sa.Column("title_tr", sa.Text(), nullable=False),
        sa.Column("title_en", sa.Text(), nullable=False),
        sa.Column("mode", context_mode, nullable=False),
        sa.Column(
            "prompt_instruction",
            sa.Text(),
            nullable=False,
            server_default="",
        ),
        *_ts_columns(),
    )

    # ---- terms -------------------------------------------------------
    op.create_table(
        "terms",
        sa.Column("term_id", sa.String(64), primary_key=True),
        sa.Column("type", term_type, nullable=False),
        sa.Column(
            "force",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
        sa.Column("confidence", confidence_level, nullable=False),
        sa.Column("source", sa.Text(), nullable=False, server_default=""),
        sa.Column("note", sa.Text(), nullable=False, server_default=""),
        *_ts_columns(),
    )
    op.create_index("ix_terms_force", "terms", ["force"])

    # ---- term_translations ------------------------------------------
    op.create_table(
        "term_translations",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "term_id",
            sa.String(64),
            sa.ForeignKey("terms.term_id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("lang", sa.String(5), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column(
            "aliases",
            postgresql.ARRAY(sa.Text()),
            nullable=False,
            server_default="{}",
        ),
        *_ts_columns(),
    )
    op.create_index(
        "uq_term_lang", "term_translations", ["term_id", "lang"], unique=True
    )
    op.create_index(
        "ix_term_translations_lang_text",
        "term_translations",
        ["lang", "text"],
    )
    op.create_index(
        "ix_term_translations_aliases_gin",
        "term_translations",
        ["aliases"],
        postgresql_using="gin",
    )

    # ---- context_terms ----------------------------------------------
    op.create_table(
        "context_terms",
        sa.Column(
            "context_id",
            sa.String(32),
            sa.ForeignKey("contexts.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "term_id",
            sa.String(64),
            sa.ForeignKey("terms.term_id", ondelete="CASCADE"),
            primary_key=True,
        ),
        *_ts_columns(),
    )

    # ---- flight_legs ------------------------------------------------
    op.create_table(
        "flight_legs",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
        ),
        sa.Column("flight_ref", sa.String(32), nullable=False, unique=True),
        sa.Column("flight_number", sa.String(16), nullable=False),
        sa.Column("scheduled_date", sa.String(10), nullable=False),
        sa.Column("origin", sa.String(8)),
        sa.Column("destination", sa.String(8)),
        sa.Column("aidx", postgresql.JSONB(), nullable=False),
        *_ts_columns(),
    )
    op.create_index(
        "ix_flight_legs_flight_number", "flight_legs", ["flight_number"]
    )
    op.create_index(
        "ix_flight_legs_scheduled_date", "flight_legs", ["scheduled_date"]
    )


def downgrade() -> None:
    op.drop_index("ix_flight_legs_scheduled_date", table_name="flight_legs")
    op.drop_index("ix_flight_legs_flight_number", table_name="flight_legs")
    op.drop_table("flight_legs")

    op.drop_table("context_terms")

    op.drop_index(
        "ix_term_translations_aliases_gin", table_name="term_translations"
    )
    op.drop_index(
        "ix_term_translations_lang_text", table_name="term_translations"
    )
    op.drop_index("uq_term_lang", table_name="term_translations")
    op.drop_table("term_translations")

    op.drop_index("ix_terms_force", table_name="terms")
    op.drop_table("terms")

    op.drop_table("contexts")

    bind = op.get_bind()
    postgresql.ENUM(name="confidence_level").drop(bind, checkfirst=True)
    postgresql.ENUM(name="term_type").drop(bind, checkfirst=True)
    postgresql.ENUM(name="context_mode").drop(bind, checkfirst=True)