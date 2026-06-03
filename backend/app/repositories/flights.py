"""
Canlı uçuş katmanı — flight_legs DB'den her istekte taze.

İki operasyon:
  - get_flight(session, flight_ref)         : read
  - patch_flight_aidx(session, flight_ref, patch) : shallow merge AIDX
"""
from __future__ import annotations

from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm.attributes import flag_modified

from app.models import FlightLeg


async def get_flight(
    session: AsyncSession, flight_ref: str
) -> FlightLeg | None:
    """flight_ref ('TK1862-2026-06-28') ile bir bacak çek."""
    stmt = select(FlightLeg).where(FlightLeg.flight_ref == flight_ref)
    return (await session.execute(stmt)).scalar_one_or_none()


async def patch_flight_aidx(
    session: AsyncSession,
    flight_ref: str,
    patch: dict[str, Any],
) -> FlightLeg | None:
    """
    AIDX JSONB üzerine shallow merge — demo'nun gate-change anı için.

    Örnek: patch={"gate": "B12"} → aidx['gate'] = 'B12'

    Nested key gerekirse (örn. aidx['boarding']['zone']) bu fonksiyon
    şu an genişletilmez — basit kalsın. PG tarafında jsonb_set
    çağrısı da var ama Python tarafında dict mutasyonu + flag_modified
    çoklu key için daha okunur ve demo için yeterli.

    Dönüş: güncellenmiş FlightLeg, ya da uçuş bulunmazsa None.
    """
    flight = await get_flight(session, flight_ref)
    if flight is None:
        return None

    # Shallow merge — yeni key'ler eklenir, var olanlar üzerine yazılır
    flight.aidx = {**flight.aidx, **patch}
    # SQLAlchemy ORM JSONB içeriğinin "değişti"ğini default'ta sezmez;
    # flag_modified açıkça işaret eder, UPDATE düşer.
    flag_modified(flight, "aidx")

    await session.commit()
    await session.refresh(flight)
    return flight
