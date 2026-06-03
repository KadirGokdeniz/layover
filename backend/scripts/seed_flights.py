"""flight_legs tablosunu data/mock_ops.json'dan beslemek için idempotent seed script.

Çalıştırma:
    cd backend
    . .\setup-env.ps1
    python -m scripts.seed_flights

UPSERT (ON CONFLICT) kullanır — birden fazla çalıştırmak güvenlidir, mevcut satırları günceller.
Yeni flight eklemek için sadece mock_ops.json'a satır ekle, script'i tekrar koş.
"""
from __future__ import annotations

import asyncio
import json
import uuid
from pathlib import Path

from sqlalchemy import text

from app.db import SessionLocal


DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "mock_ops.json"


async def main() -> None:
    print(f"Loading {DATA_PATH.name}...")
    if not DATA_PATH.exists():
        print(f"⚠ Dosya bulunamadı: {DATA_PATH}")
        return

    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    flights = data.get("flights", [])
    if not flights:
        print("⚠ mock_ops.json içinde flight yok")
        return

    print(f"{len(flights)} uçuş upsert ediliyor...")
    async with SessionLocal()() as session:
        stmt = text("""
            INSERT INTO flight_legs (
                id, flight_ref, flight_number, scheduled_date,
                origin, destination, aidx
            )
            VALUES (
                :id, :flight_ref, :flight_number, :scheduled_date,
                :origin, :destination, CAST(:aidx AS jsonb)
            )
            ON CONFLICT (flight_ref) DO UPDATE SET
                flight_number = EXCLUDED.flight_number,
                scheduled_date = EXCLUDED.scheduled_date,
                origin = EXCLUDED.origin,
                destination = EXCLUDED.destination,
                aidx = EXCLUDED.aidx,
                updated_at = NOW()
        """)
        for f in flights:
            params = {
                "id": str(uuid.uuid4()),
                "flight_ref": f["flight_ref"],
                "flight_number": f["flight_number"],
                "scheduled_date": f["scheduled_date"],
                "origin": f.get("origin"),
                "destination": f.get("destination"),
                "aidx": json.dumps(f.get("aidx", {}), ensure_ascii=False),
            }
            await session.execute(stmt, params)
            print(f"  ✓ {f['flight_ref']}")
        await session.commit()

    print("\nDone.")


if __name__ == "__main__":
    asyncio.run(main())
