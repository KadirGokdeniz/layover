"""
Async seed scripti — JSON dosyalardan DB'ye yükler. Idempotent: tekrar
çalışırsa upsert (on_conflict_do_update).

Kullanım:
    python -m scripts.seed contexts
    python -m scripts.seed glossary --path data/glossary.json
    python -m scripts.seed flights  --path data/mock_ops.json
    python -m scripts.seed all

Tasarım:
  - Tüm I/O async (asyncpg üzerinden).
  - PG-spesifik upsert: insert().on_conflict_do_update(index_elements=...)
  - flight_legs için flexible AIDX adapter — gerçek mock_ops.json gelince
    `_extract_flight_row` fonksiyonundaki alan eşlemeleri ayarlanır.
"""
from __future__ import annotations

import argparse
import asyncio
import json
import sys
import uuid
from pathlib import Path
from typing import Any

from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.db import SessionLocal
from app.models import (
    Confidence,
    Context,
    ContextMode,
    ContextTerm,
    FlightLeg,
    Term,
    TermTranslation,
    TermType,
)


# ---- contexts ---------------------------------------------------------------

# 5 senaryo sabit (index.json ile birebir). prompt_instruction sonra doldurulur.
CONTEXTS = [
    ("boarding", "Biniş — Roma kapısı",
     "Boarding — Rome gate", ContextMode.full),
    ("check-in", "Check-in — Londra uçuşu",
     "Check-in — London flight", ContextMode.full),
    ("transfer", "Transfer — New York'tan Roma'ya bağlantı",
     "Transfer — Connecting from New York to Rome", ContextMode.full),
    ("security", "Güvenlik kontrolü",
     "Security check", ContextMode.quick_pattern),
    ("passport", "Pasaport kontrolü",
     "Passport control", ContextMode.quick_pattern),
]


async def seed_contexts() -> None:
    async with SessionLocal()() as s:
        stmt = pg_insert(Context).values(
            [
                {"id": cid, "title_tr": tr, "title_en": en, "mode": mode.value}
                for (cid, tr, en, mode) in CONTEXTS
            ]
        )
        stmt = stmt.on_conflict_do_update(
            index_elements=["id"],
            set_={
                "title_tr": stmt.excluded.title_tr,
                "title_en": stmt.excluded.title_en,
                "mode": stmt.excluded.mode,
                # prompt_instruction'a DOKUNMA — manuel doldurulmuş içerikleri ezme
            },
        )
        await s.execute(stmt)
        await s.commit()
        print(f"✓ contexts seeded: {len(CONTEXTS)}")


# ---- glossary ---------------------------------------------------------------

async def seed_glossary(path: Path) -> None:
    payload = json.loads(path.read_text(encoding="utf-8"))
    terms_in = payload["terms"]
    languages = payload["_meta"]["languages"]  # ["tr","en","it","ar","ru"]

    async with SessionLocal()() as s:
        # 1) terms
        term_rows = [
            {
                "term_id": t["term_id"],
                "type": TermType(t["type"]).value,
                "force": bool(t["force"]),
                "confidence": Confidence(t["confidence"]).value,
                "source": t.get("source", ""),
                "note": t.get("note", ""),
            }
            for t in terms_in
        ]
        stmt = pg_insert(Term).values(term_rows)
        stmt = stmt.on_conflict_do_update(
            index_elements=["term_id"],
            set_={
                "type": stmt.excluded.type,
                "force": stmt.excluded.force,
                "confidence": stmt.excluded.confidence,
                "source": stmt.excluded.source,
                "note": stmt.excluded.note,
            },
        )
        await s.execute(stmt)

        # 2) term_translations — her dil için bir satır (atlanmaz, eksikse skip)
        tx_rows = []
        for t in terms_in:
            aliases_by_lang = t.get("aliases", {}) or {}
            for lang in languages:
                text = t["lang"].get(lang)
                if not text:
                    continue
                tx_rows.append(
                    {
                        "term_id": t["term_id"],
                        "lang": lang,
                        "text": text,
                        "aliases": aliases_by_lang.get(lang, []) or [],
                    }
                )

        stmt = pg_insert(TermTranslation).values(tx_rows)
        stmt = stmt.on_conflict_do_update(
            index_elements=["term_id", "lang"],
            set_={"text": stmt.excluded.text, "aliases": stmt.excluded.aliases},
        )
        await s.execute(stmt)

        # 3) context_terms — terimin touchpoints listesinden türet
        ct_rows = [
            {"context_id": ctx, "term_id": t["term_id"]}
            for t in terms_in
            for ctx in t.get("touchpoints", [])
        ]
        if ct_rows:
            stmt = pg_insert(ContextTerm).values(ct_rows)
            stmt = stmt.on_conflict_do_nothing(
                index_elements=["context_id", "term_id"]
            )
            await s.execute(stmt)

        await s.commit()
        print(
            f"✓ glossary seeded: {len(term_rows)} terms, "
            f"{len(tx_rows)} translations, {len(ct_rows)} context links"
        )


# ---- flights ----------------------------------------------------------------

def _extract_flight_row(f: dict[str, Any]) -> dict[str, Any]:
    """
    AIDX-flavored bir flight kaydını flight_legs satırına çevirir.

    Varsayımlar (mock_ops.json'un net şeması gelince burası ayarlanır):
      - flight_ref ya gömülü ya da {airlineCode}{flightNumber}-{date}'ten türetilir.
      - flightNumber alanı ya 'flightNumber' ya da 'flight_number'.
      - Tarih: 'scheduledDepartureDate' / 'scheduled_date' / 'scheduledDate'.
      - Origin/destination: 'departureAirport'/'arrivalAirport' veya
        'origin'/'destination' (3-letter IATA bekleniyor).

    Tüm AIDX payload'ı 'aidx' JSONB'ye olduğu gibi konur (kayıp yok).
    """
    flight_number = (
        f.get("flightNumber")
        or f.get("flight_number")
        or ""
    )
    airline_code = f.get("airlineCode") or f.get("airline") or ""
    # 'TK' + '1862' birleşik gelmemişse, birleştir
    full_flight_no = (
        flight_number
        if flight_number.startswith(airline_code)
        else f"{airline_code}{flight_number}"
    )

    scheduled_date = (
        f.get("scheduledDepartureDate")
        or f.get("scheduled_date")
        or f.get("scheduledDate")
        or ""
    )

    flight_ref = f.get("flight_ref") or (
        f"{full_flight_no}-{scheduled_date}" if scheduled_date else full_flight_no
    )
    if not flight_ref:
        raise ValueError(f"flight_ref çıkarılamadı: {f!r}")

    origin = (
        f.get("departureAirport")
        or f.get("origin")
    )
    destination = (
        f.get("arrivalAirport")
        or f.get("destination")
    )

    return {
        "id": uuid.uuid4(),
        "flight_ref": flight_ref,
        "flight_number": full_flight_no,
        "scheduled_date": scheduled_date,
        "origin": origin,
        "destination": destination,
        "aidx": f,
    }


async def seed_flights(path: Path) -> None:
    payload = json.loads(path.read_text(encoding="utf-8"))
    # Üç olası top-level kabuk: {"flights": [...]} / {"legs": [...]} / [...]
    flights = (
        payload.get("flights")
        if isinstance(payload, dict)
        else payload
    ) or (payload.get("legs") if isinstance(payload, dict) else None)

    if not flights:
        print("! flights payload boş — seed yapılmadı", file=sys.stderr)
        return

    rows = [_extract_flight_row(f) for f in flights]

    async with SessionLocal()() as s:
        stmt = pg_insert(FlightLeg).values(rows)
        # flight_ref unique — upsert ona göre. 'id' UUID re-generate edilmez.
        stmt = stmt.on_conflict_do_update(
            index_elements=["flight_ref"],
            set_={
                "flight_number": stmt.excluded.flight_number,
                "scheduled_date": stmt.excluded.scheduled_date,
                "origin": stmt.excluded.origin,
                "destination": stmt.excluded.destination,
                "aidx": stmt.excluded.aidx,
                # NOT: 'id'yi update etmiyoruz — kayıt stabil kimliği korur.
            },
        )
        await s.execute(stmt)
        await s.commit()
        print(f"✓ flights seeded: {len(rows)}")


# ---- CLI --------------------------------------------------------------------

async def _run(args: argparse.Namespace) -> None:
    if args.cmd == "contexts":
        await seed_contexts()
    elif args.cmd == "glossary":
        await seed_glossary(args.path)
    elif args.cmd == "flights":
        await seed_flights(args.path)
    elif args.cmd == "all":
        await seed_contexts()
        await seed_glossary(args.glossary)
        if args.flights.exists():
            await seed_flights(args.flights)
        else:
            print(f"! {args.flights} yok, flights atlandı")


def main() -> None:
    p = argparse.ArgumentParser()
    sub = p.add_subparsers(dest="cmd", required=True)

    sub.add_parser("contexts", help="5 senaryo seed")

    g = sub.add_parser("glossary", help="glossary.json'dan terimler")
    g.add_argument("--path", type=Path, default=Path("data/glossary.json"))

    f = sub.add_parser("flights", help="mock_ops.json'dan uçuşlar")
    f.add_argument("--path", type=Path, default=Path("data/mock_ops.json"))

    a = sub.add_parser("all", help="hepsi sırayla")
    a.add_argument("--glossary", type=Path, default=Path("data/glossary.json"))
    a.add_argument("--flights", type=Path, default=Path("data/mock_ops.json"))

    asyncio.run(_run(p.parse_args()))


if __name__ == "__main__":
    main()