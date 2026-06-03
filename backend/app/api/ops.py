"""GET /ops/{context} — FlightStrip için context-spesifik display verisi döner.

Üç tip context:
- "flight": tek uçuş arar (boarding, check-in)
- "transfer": iki uçuş birleştirir (transfer)
- "static": uçuş yok, sabit istatistik (security, passport)
"""
from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import SessionLocal


log = logging.getLogger("global_gate.ops")
router = APIRouter()


class FieldDisplay(BaseModel):
    label: str
    value: str
    mono: bool = True


class StatusDisplay(BaseModel):
    label: str
    tone: str  # "green" | "amber" | "red"


class OpsResponse(BaseModel):
    context: str
    fields: list[FieldDisplay]
    status: StatusDisplay


# Context başına display konfigürasyonu.
# Bu bir UI config — veri değil. Bu yüzden mock_ops.json'da değil, burada.
CONTEXT_CONFIG: dict[str, dict[str, Any]] = {
    "boarding": {
        "type": "flight",
        "flight_ref": "TK1862-2026-06-28",
        "fields": [
            ("Flight", "flight_number"),
            ("Route", "route_display"),
            ("Gate", "gate"),
            ("Boarding", "boarding_time"),
            ("Seat", "assigned_seat"),
        ],
    },
    "check-in": {
        "type": "flight",
        "flight_ref": "TK1979-2026-06-28",
        "fields": [
            ("Flight", "flight_number"),
            ("Route", "route_display"),
            ("Counters", "checkin_counters"),
            ("Departure", "departure_time"),
        ],
    },
    "transfer": {
        "type": "transfer",
        "arrival_flight_ref": "TK7-2026-06-28",
        "connecting_flight_ref": "TK1862-2026-06-28",
    },
    "security": {
        "type": "static",
        "fields": [
            ("Checkpoint", "West"),
            ("Lanes Open", "4"),
            ("Avg Wait", "12 min"),
        ],
        "status": ("Normal", "green"),
    },
    "passport": {
        "type": "static",
        "fields": [
            ("Area", "Passport Control"),
            ("Booths Open", "8"),
            ("Avg Wait", "18 min"),
        ],
        "status": ("Normal", "amber"),
    },
}


async def _load_flight(session: AsyncSession, flight_ref: str) -> dict[str, Any] | None:
    stmt = text(
        """
        SELECT flight_number, scheduled_date, origin, destination, aidx
        FROM flight_legs
        WHERE flight_ref = :ref
        """
    )
    result = await session.execute(stmt, {"ref": flight_ref})
    row = result.first()
    if row is None:
        return None
    return {
        "flight_number": row[0],
        "scheduled_date": row[1],
        "origin": row[2],
        "destination": row[3],
        "aidx": row[4] or {},
    }


def _value_for(flight: dict[str, Any], key: str) -> str:
    """Önce flight üst seviye alan, sonra aidx içinde ara."""
    if key in flight and flight[key] is not None:
        return str(flight[key])
    aidx = flight.get("aidx", {})
    if key in aidx and aidx[key] is not None:
        return str(aidx[key])
    return "—"


@router.get("/ops/{context}", response_model=OpsResponse)
async def get_ops(context: str) -> OpsResponse:
    config = CONTEXT_CONFIG.get(context)
    if config is None:
        raise HTTPException(404, f"Bilinmeyen context: {context}")

    # Static (security, passport)
    if config["type"] == "static":
        return OpsResponse(
            context=context,
            fields=[FieldDisplay(label=lbl, value=val) for lbl, val in config["fields"]],
            status=StatusDisplay(label=config["status"][0], tone=config["status"][1]),
        )

    async with SessionLocal()() as session:
        # Single flight (boarding, check-in)
        if config["type"] == "flight":
            flight = await _load_flight(session, config["flight_ref"])
            if flight is None:
                raise HTTPException(404, f"Uçuş bulunamadı: {config['flight_ref']}")
            fields = [
                FieldDisplay(label=label, value=_value_for(flight, key))
                for label, key in config["fields"]
            ]
            aidx = flight.get("aidx", {})
            return OpsResponse(
                context=context,
                fields=fields,
                status=StatusDisplay(
                    label=str(aidx.get("status", "On Time")),
                    tone=str(aidx.get("status_tone", "green")),
                ),
            )

        # Transfer (two flights combined)
        if config["type"] == "transfer":
            arrival = await _load_flight(session, config["arrival_flight_ref"])
            connecting = await _load_flight(session, config["connecting_flight_ref"])
            if arrival is None or connecting is None:
                raise HTTPException(404, "Transfer uçuşlarından biri bulunamadı")

            arr_aidx = arrival.get("aidx", {})
            conn_aidx = connecting.get("aidx", {})
            route = f"{arrival['origin']} → {arrival['destination']} → {connecting['destination']}"

            fields = [
                FieldDisplay(label="Flight", value=str(connecting["flight_number"])),
                FieldDisplay(label="Route", value=route),
                FieldDisplay(label="Arrival Gate", value=str(arr_aidx.get("arrival_gate", "—"))),
                FieldDisplay(label="Connecting Gate", value=str(conn_aidx.get("gate", "—"))),
                FieldDisplay(label="Boarding", value=str(conn_aidx.get("boarding_time", "—"))),
            ]
            return OpsResponse(
                context=context,
                fields=fields,
                status=StatusDisplay(label="On Time", tone="green"),
            )

    raise HTTPException(500, f"Bilinmeyen config tipi: {config['type']}")
