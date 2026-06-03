"""
ORM models — Global Gate çeviri sistemi.

Tablolar:
  contexts            : 5 senaryo (boarding, check-in, transfer, security, passport)
                        + her biri için donmuş LLM prompt talimatı
  terms               : sözlük omurgası, dile-bağımsız metadata
  term_translations   : terim × dil çevirileri + alias listesi
  context_terms       : terim ↔ senaryo junction
  flight_legs         : AIDX-flavored canlı operasyonel veri (PATCH'lenebilir)

Tasarım notları:
  - PK stratejisi: contexts/terms/term_translations/context_terms doğal string
    anahtar kullanır (slug). flight_legs UUID PK + flight_ref unique kolon
    (flight_ref domain'e açık, uçuş yeniden planlanırsa değişebilir).
  - Her tabloda created_at + updated_at. context_terms junction'ı için bile
    tuttuk — uniform audit yüzeyi.
  - Bu modül driver-agnostik; sync ya da async engine ile aynı şekilde çalışır.
    Async engine app/db.py'de.
"""
from __future__ import annotations

import enum
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Index,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID as PG_UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


# ---- enums ------------------------------------------------------------------

class TermType(str, enum.Enum):
    entity = "entity"
    phrase = "phrase"


class Confidence(str, enum.Enum):
    high = "high"
    medium = "medium"
    review_needed = "review_needed"  # AR/RU anadil kontrolü sonrası


class ContextMode(str, enum.Enum):
    full = "full"
    quick_pattern = "quick_pattern"


# ---- timestamp karması -------------------------------------------------------

class TimestampMixin:
    """Her tabloda created_at + updated_at."""
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


# ---- contexts ---------------------------------------------------------------

class Context(Base, TimestampMixin):
    """Bir senaryo/temas noktası. id örn: 'boarding', 'check-in'."""
    __tablename__ = "contexts"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    title_tr: Mapped[str] = mapped_column(Text, nullable=False)
    title_en: Mapped[str] = mapped_column(Text, nullable=False)
    mode: Mapped[ContextMode] = mapped_column(
        SAEnum(ContextMode, name="context_mode"), nullable=False
    )
    # Donmuş LLM bağlam talimatı — runtime'da prompt'a enjekte edilir.
    # Şu an seed'de boş; içerikler sonraki turda doldurulacak.
    prompt_instruction: Mapped[str] = mapped_column(
        Text, nullable=False, server_default=""
    )

    term_links: Mapped[list["ContextTerm"]] = relationship(
        back_populates="context", cascade="all, delete-orphan"
    )


# ---- terms ------------------------------------------------------------------

class Term(Base, TimestampMixin):
    """Sözlükteki bir öğe (dil-bağımsız). term_id glossary.json'dan."""
    __tablename__ = "terms"

    term_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    type: Mapped[TermType] = mapped_column(
        SAEnum(TermType, name="term_type"), nullable=False
    )
    force: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default="false"
    )
    confidence: Mapped[Confidence] = mapped_column(
        SAEnum(Confidence, name="confidence_level"), nullable=False
    )
    source: Mapped[str] = mapped_column(Text, nullable=False, server_default="")
    note: Mapped[str] = mapped_column(Text, nullable=False, server_default="")

    translations: Mapped[list["TermTranslation"]] = relationship(
        back_populates="term", cascade="all, delete-orphan"
    )
    context_links: Mapped[list["ContextTerm"]] = relationship(
        back_populates="term", cascade="all, delete-orphan"
    )

    __table_args__ = (
        # force=true terimleri post-processor sık çekecek
        Index("ix_terms_force", "force"),
    )


class TermTranslation(Base, TimestampMixin):
    """Bir terim × dil çevirisi + o dildeki yan biçimler (aliases)."""
    __tablename__ = "term_translations"

    id: Mapped[int] = mapped_column(primary_key=True)
    term_id: Mapped[str] = mapped_column(
        ForeignKey("terms.term_id", ondelete="CASCADE"), nullable=False
    )
    lang: Mapped[str] = mapped_column(String(5), nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    aliases: Mapped[list[str]] = mapped_column(
        ARRAY(Text), nullable=False, server_default="{}"
    )

    term: Mapped[Term] = relationship(back_populates="translations")

    __table_args__ = (
        Index("uq_term_lang", "term_id", "lang", unique=True),
        # cümle içi terim tespiti: dile göre hızlı text lookup
        Index("ix_term_translations_lang_text", "lang", "text"),
        # alias ile eşleşme: GIN üzerinde "x = ANY(aliases)"
        Index(
            "ix_term_translations_aliases_gin",
            "aliases",
            postgresql_using="gin",
        ),
    )


# ---- context ↔ term junction -----------------------------------------------

class ContextTerm(Base, TimestampMixin):
    """Hangi terimler hangi senaryoda alaka kazanır."""
    __tablename__ = "context_terms"

    context_id: Mapped[str] = mapped_column(
        ForeignKey("contexts.id", ondelete="CASCADE"), primary_key=True
    )
    term_id: Mapped[str] = mapped_column(
        ForeignKey("terms.term_id", ondelete="CASCADE"), primary_key=True
    )

    context: Mapped[Context] = relationship(back_populates="term_links")
    term: Mapped[Term] = relationship(back_populates="context_links")


# ---- flight legs ------------------------------------------------------------

class FlightLeg(Base, TimestampMixin):
    """
    Bir uçuş bacağı. Tek canlı tablo — PATCH endpoint'i 'aidx' içine yazar
    (örn. gate G9A → B12). Donmuş tablolar (contexts/terms/...) açılışta
    belleğe yüklenir; flight_legs her istekte taze çekilir.

    id          : iç stabil kimlik (UUID)
    flight_ref  : iş anahtarı, 'TK1862-2026-06-28' formatı. Unique.
    aidx        : AIDX-flavored payload (airlineCode, flightNumber, gate,
                  boardingTime, status, ...). Şema esnek tutuldu;
                  pydantic katmanında doğrulanacak.
    """
    __tablename__ = "flight_legs"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    flight_ref: Mapped[str] = mapped_column(String(32), nullable=False, unique=True)
    flight_number: Mapped[str] = mapped_column(String(16), nullable=False)
    scheduled_date: Mapped[str] = mapped_column(String(10), nullable=False)  # YYYY-MM-DD
    origin: Mapped[Optional[str]] = mapped_column(String(8))
    destination: Mapped[Optional[str]] = mapped_column(String(8))

    aidx: Mapped[dict] = mapped_column(JSONB, nullable=False)

    __table_args__ = (
        Index("ix_flight_legs_flight_number", "flight_number"),
        Index("ix_flight_legs_scheduled_date", "scheduled_date"),
    )
