"""
Donmuş katman — uygulama açılışında bir kere yüklenir, app.state'te durur.

İçerik: 5 senaryo (prompt_instruction dahil), 192 terim, 960 çeviri,
320 context↔term bağlantısı.

Sağlanan iki ana sorgu:
  1) get_terms_for_context(ctx, lang)  — prompt'a sözlük dilimi enjekte et
  2) find_term_hits(sentence, lang, ctx) — cümlede geçen terimleri bul
"""
from __future__ import annotations

from dataclasses import dataclass, field

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    Context,
    ContextTerm,
    Term,
    TermTranslation,
)


# ---- DTO'lar ----------------------------------------------------------------

@dataclass(frozen=True, slots=True)
class ContextDTO:
    slug: str
    title_tr: str
    title_en: str
    mode: str
    prompt_instruction: str


@dataclass(frozen=True, slots=True)
class TermDTO:
    term_id: str
    type: str          # "entity" | "phrase"
    force: bool
    confidence: str    # "high" | "medium" | "review_needed"
    source: str
    note: str


@dataclass(frozen=True, slots=True)
class TermBundle:
    """Bir terimin tek bir hedef dile göre paketi — prompt enjeksiyonu için."""
    term_id: str
    type: str
    force: bool
    tr_text: str
    target_text: str
    tr_aliases: tuple[str, ...]
    target_aliases: tuple[str, ...]


# ---- ana yapı ---------------------------------------------------------------

@dataclass
class FrozenLayer:
    """Açılışta yüklenir; sorgular sync (memory). Bellek izi ~1 MB."""

    contexts: dict[str, ContextDTO] = field(default_factory=dict)
    terms_by_id: dict[str, TermDTO] = field(default_factory=dict)

    # context_slug -> [term_id, ...]
    terms_by_context: dict[str, list[str]] = field(default_factory=dict)

    # (term_id, lang) -> text
    translations: dict[tuple[str, str], str] = field(default_factory=dict)

    # (term_id, lang) -> aliases tuple
    aliases: dict[tuple[str, str], tuple[str, ...]] = field(default_factory=dict)

    # ---- public API -------------------------------------------------------

    def get_terms_for_context(self, ctx_slug: str, lang: str) -> list[TermBundle]:
        """Prompt'a verilecek sözlük dilimi. lang = yolcunun dili."""
        out: list[TermBundle] = []
        for tid in self.terms_by_context.get(ctx_slug, []):
            term = self.terms_by_id[tid]
            tr_text = self.translations.get((tid, "tr"), "")
            target_text = self.translations.get((tid, lang), "")
            if not target_text:
                # bu dilde karşılık yoksa atla (defensif)
                continue
            out.append(
                TermBundle(
                    term_id=tid,
                    type=term.type,
                    force=term.force,
                    tr_text=tr_text,
                    target_text=target_text,
                    tr_aliases=self.aliases.get((tid, "tr"), ()),
                    target_aliases=self.aliases.get((tid, lang), ()),
                )
            )
        return out

    def find_term_hits(
        self, sentence: str, lang: str, ctx_slug: str
    ) -> list[str]:
        """
        Cümle içinde belirli bir dilde geçen terimleri saptar.
        Case-insensitive substring + alias eşleşmesi.
        Senaryo filtreli — başka tab'ın terimleri kaybolur.
        Sonuç: term_id listesi (cümlede görünüş sırasıyla, en eski ilk).
        """
        lowered = sentence.lower()
        hits: list[tuple[int, str]] = []
        for tid in self.terms_by_context.get(ctx_slug, []):
            text = self.translations.get((tid, lang), "")
            aliases = self.aliases.get((tid, lang), ())
            candidates = [s for s in (text, *aliases) if s]
            best_pos = -1
            for s in candidates:
                pos = lowered.find(s.lower())
                if pos >= 0 and (best_pos < 0 or pos < best_pos):
                    best_pos = pos
            if best_pos >= 0:
                hits.append((best_pos, tid))
        hits.sort()
        return [tid for _, tid in hits]


# ---- yükleyici --------------------------------------------------------------

async def load_frozen(session: AsyncSession) -> FrozenLayer:
    """4 tabloyu paralel okur, FrozenLayer'ı doldurur."""
    layer = FrozenLayer()

    # contexts
    rows = (await session.execute(select(Context))).scalars().all()
    for c in rows:
        layer.contexts[c.id] = ContextDTO(
            slug=c.id,
            title_tr=c.title_tr,
            title_en=c.title_en,
            mode=c.mode.value if hasattr(c.mode, "value") else str(c.mode),
            prompt_instruction=c.prompt_instruction,
        )

    # terms
    rows = (await session.execute(select(Term))).scalars().all()
    for t in rows:
        layer.terms_by_id[t.term_id] = TermDTO(
            term_id=t.term_id,
            type=t.type.value if hasattr(t.type, "value") else str(t.type),
            force=t.force,
            confidence=(
                t.confidence.value
                if hasattr(t.confidence, "value")
                else str(t.confidence)
            ),
            source=t.source,
            note=t.note,
        )

    # term_translations -> translations + aliases
    rows = (await session.execute(select(TermTranslation))).scalars().all()
    for tx in rows:
        key = (tx.term_id, tx.lang)
        layer.translations[key] = tx.text
        if tx.aliases:
            layer.aliases[key] = tuple(tx.aliases)

    # context_terms -> terms_by_context
    rows = (await session.execute(select(ContextTerm))).scalars().all()
    for ct in rows:
        layer.terms_by_context.setdefault(ct.context_id, []).append(ct.term_id)

    # Determinizm: her context için term listesi alfabetik sırada — log/diff temiz
    for ctx_slug in layer.terms_by_context:
        layer.terms_by_context[ctx_slug].sort()

    return layer
