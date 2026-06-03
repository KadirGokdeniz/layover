"""GET /scenarios and GET /scenarios/{context} — load JSON files from disk."""
from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException


log = logging.getLogger("global_gate.scenarios")
router = APIRouter()

# Scenarios live at backend/data/scenarios/
SCENARIOS_DIR = (
    Path(__file__).resolve().parent.parent.parent / "data" / "scenarios"
)

# Context id (URL-friendly) -> filename
_FILE_MAP: dict[str, str] = {
    "boarding": "boarding.json",
    "check-in": "check_in.json",
    "transfer": "transfer.json",
    "security": "security.json",
    "passport": "passport.json",
}


@router.get("/scenarios")
async def list_scenarios() -> dict[str, Any]:
    """Returns the index.json if present, else a minimal list."""
    idx = SCENARIOS_DIR / "index.json"
    if idx.exists():
        return json.loads(idx.read_text(encoding="utf-8"))
    return {
        "scenarios": [
            {"id": ctx, "file": f"scenarios/{fn}"}
            for ctx, fn in _FILE_MAP.items()
        ]
    }


@router.get("/scenarios/{context}")
async def get_scenario(context: str) -> dict[str, Any]:
    if context not in _FILE_MAP:
        raise HTTPException(404, f"Bilinmeyen senaryo: {context}")
    path = SCENARIOS_DIR / _FILE_MAP[context]
    if not path.exists():
        raise HTTPException(404, f"Senaryo dosyası bulunamadı: {_FILE_MAP[context]}")
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as e:
        log.error("Scenario load failed for %s: %s", context, e)
        raise HTTPException(500, f"Senaryo yüklenemedi: {e}")
