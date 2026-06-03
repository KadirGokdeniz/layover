"""
Çeviri prompt inşacısı — 5 adımlı akışın 1-3. adımları.

  1) Bağlam yükle: contexts + ilgili flight_legs (caller hazırlar)
  2) Terim dilimi çıkar: senaryo filtresi + cümlede alias eşleşmesi
  3) Prompt inşa et: sistem talimatı + bağlam talimatı + canlı veri +
     filtrelenmiş sözlük + çevrilecek metin

  4) LLM çağır — translate endpoint'inde
  5) Force son-işlem — ayrı modül (post_processor)

Sync; frozen ve flight objesi caller tarafından sağlanır. Bu sayede
unit test'i DB'siz yapılabilir.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

from app.models import FlightLeg
from app.repositories.frozen import FrozenLayer


# ---- per-context konfigürasyonlar -------------------------------------------

# Her senaryoda anlamlı olan AIDX alanları. Scenario JSON'lardaki "data_used"
# alanından türetildi. Force entity check'i bu liste üzerinden yapılır:
# kaynak metinde value görünürse, output'a aynen geçmeli.
CONTEXT_DATA_FIELDS: dict[str, tuple[str, ...]] = {
    "boarding": (
        "gate", "boardingTime", "boardingZone", "assignedSeat",
        "status", "flightNumber",
    ),
    "check-in": (
        "checkinCounters", "gate", "boardingTime",
        "baggageAllowanceKg", "assignedSeat", "flightNumber",
    ),
    "transfer": (
        "arrivalGate", "gate", "boardingTime", "flightNumber",
    ),
    "security": (),
    "passport": (),
}

LANG_NAMES = {
    "tr": "Turkish", "en": "English", "it": "Italian",
    "ar": "Arabic", "ru": "Russian",
}

DEFAULT_SYSTEM = """You are a real-time interpreter at Istanbul Airport, working between Turkish-speaking ground staff and a {target_name}-speaking passenger.

Translate the user's message from {source_name} to {target_name}.

Strict rules:
- Preserve all entity values verbatim: gate codes, flight numbers, times, seat numbers, group numbers. Do not translate or reformat them.
- Use the aviation glossary below when listed terms appear in the source. The provided target-language form is the canonical translation.
- Keep tone professional, brief, and clear — airport context, not literary.
- Output only the translation. No quotes, no commentary, no language tags.
"""


# ---- DTO'lar ----------------------------------------------------------------

@dataclass(frozen=True, slots=True)
class TranslationRequest:
    source_text: str
    source_lang: str        # "tr" | "en" | "it" | "ar" | "ru"
    target_lang: str
    context: str            # "boarding" | "check-in" | "transfer" | "security" | "passport"
    flight_ref: Optional[str] = None  # full-mode senaryolar için


@dataclass(frozen=True, slots=True)
class ForceItem:
    """Çıktıda birebir geçmesi gereken bir öğe — post-processor doğrular."""
    kind: str               # "term" | "entity"
    label: str              # tanı için: term_id veya aidx key
    expected: str           # kanonik form (birinci tercih)
    accept: tuple[str, ...] = ()  # aliases — alternatif kabul edilebilir formlar


@dataclass
class TranslationPrompt:
    system: str
    user: str
    force_items: list[ForceItem] = field(default_factory=list)


# ---- inşa ------------------------------------------------------------------

def build_prompt(
    req: TranslationRequest,
    frozen: FrozenLayer,
    flight: Optional[FlightLeg] = None,
) -> TranslationPrompt:
    if req.context not in frozen.contexts:
        raise ValueError(f"Unknown context: {req.context}")
    if req.source_lang == req.target_lang:
        raise ValueError("source_lang ve target_lang aynı olamaz")

    ctx = frozen.contexts[req.context]

    # ---- (2) terim dilimi --------------------------------------------------
    hits = set(
        frozen.find_term_hits(req.source_text, req.source_lang, req.context)
    )
    # context'in tüm terim_id'leri
    ctx_terms = frozen.terms_by_context.get(req.context, [])

    glossary_lines: list[str] = []
    force_items: list[ForceItem] = []

    for tid in ctx_terms:
        term_meta = frozen.terms_by_id[tid]
        src = frozen.translations.get((tid, req.source_lang), "")
        tgt = frozen.translations.get((tid, req.target_lang), "")
        if not src or not tgt:
            continue

        is_hit = tid in hits

        # Sözlüğe ekle: cümlede geçenler + tüm force terimleri (önleyici)
        if is_hit or term_meta.force:
            tgt_aliases = frozen.aliases.get((tid, req.target_lang), ())
            alias_note = (
                f"  (aliases: {', '.join(tgt_aliases)})" if tgt_aliases else ""
            )
            marker = " [force]" if term_meta.force else ""
            glossary_lines.append(f'- "{src}" → "{tgt}"{marker}{alias_note}')

        # Force item: cümlede gerçekten geçen + force=True olanlar
        if is_hit and term_meta.force:
            force_items.append(
                ForceItem(
                    kind="term",
                    label=tid,
                    expected=tgt,
                    accept=frozen.aliases.get((tid, req.target_lang), ()),
                )
            )

    # ---- (1b) canlı veri ---------------------------------------------------
    live_lines: list[str] = []
    relevant_fields = CONTEXT_DATA_FIELDS.get(req.context, ())
    if flight is not None and relevant_fields:
        aidx = flight.aidx or {}
        for key in relevant_fields:
            value = aidx.get(key)
            if value is None:
                continue
            value_str = str(value)
            live_lines.append(f"- {key}: {value_str}")
            # Entity force-lock: değer kaynak metinde geçtiyse çıktıda da olmalı
            if value_str in req.source_text:
                force_items.append(
                    ForceItem(kind="entity", label=key, expected=value_str)
                )

    # ---- (3) prompt birleştir ---------------------------------------------
    system_parts: list[str] = [
        DEFAULT_SYSTEM.format(
            source_name=LANG_NAMES.get(req.source_lang, req.source_lang),
            target_name=LANG_NAMES.get(req.target_lang, req.target_lang),
        )
    ]

    if ctx.prompt_instruction:
        system_parts.append(f"Context-specific guidance:\n{ctx.prompt_instruction}")

    if glossary_lines:
        system_parts.append(
            "Aviation glossary (terms appearing in source):\n"
            + "\n".join(glossary_lines)
        )

    if live_lines:
        flight_label = (
            f" ({flight.flight_ref})" if flight is not None else ""
        )
        system_parts.append(
            f"Live operational data{flight_label}:\n" + "\n".join(live_lines)
        )

    system = "\n\n".join(system_parts)
    user = req.source_text

    return TranslationPrompt(system=system, user=user, force_items=force_items)


# ---- demo (DB ile, gerçek frozen üzerinde) ---------------------------------
# Kullanım: python -m app.services.prompt_builder
if __name__ == "__main__":
    import asyncio

    from app.db import SessionLocal
    from app.repositories.frozen import load_frozen

    async def _demo() -> None:
        async with SessionLocal()() as session:
            frozen = await load_frozen(session)

        # Boarding senaryosundan kapak repliği: staff TR → en
        req = TranslationRequest(
            source_text=(
                "Evet, yetiştiniz. Biniş 14:35'te başlayacak. "
                "Koltuğunuz 23A. Grup 2 olarak çağrılacaksınız, "
                "lütfen anonsları bekleyin."
            ),
            source_lang="tr",
            target_lang="en",
            context="boarding",
        )
        prompt = build_prompt(req, frozen, flight=None)

        print("=" * 70)
        print("SYSTEM PROMPT")
        print("=" * 70)
        print(prompt.system)
        print()
        print("=" * 70)
        print("USER PROMPT")
        print("=" * 70)
        print(prompt.user)
        print()
        print("=" * 70)
        print(f"FORCE ITEMS ({len(prompt.force_items)})")
        print("=" * 70)
        for f in prompt.force_items:
            accept_note = (
                f"  (or: {', '.join(f.accept)})" if f.accept else ""
            )
            print(f"  [{f.kind}] {f.label} → {f.expected}{accept_note}")

    asyncio.run(_demo())
