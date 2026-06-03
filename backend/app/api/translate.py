"""POST /translate — 5 adımlı çeviri pipeline'ının HTTP yüzü.

Akış:
  1) request validate (Pydantic)
  2) frozen layer'dan context al, flight_ref varsa DB'den uçuş çek
  3) build_prompt
  4) LLM client.complete
  5) apply_force_items
  6) response
"""
from __future__ import annotations

import logging
from typing import Literal, Optional

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from app.db import SessionLocal
from app.repositories.flights import get_flight
from app.repositories.frozen import FrozenLayer
from app.services.force_post import apply_force_items
from app.services.llm import get_llm_client
from app.services.prompt_builder import TranslationRequest, build_prompt


log = logging.getLogger("global_gate.translate")
router = APIRouter()


Lang = Literal["tr", "en", "it", "ar", "ru"]
Context = Literal["boarding", "check-in", "transfer", "security", "passport"]


# ---- request / response şemaları --------------------------------------------

class TranslateIn(BaseModel):
    source_text: str = Field(..., min_length=1, max_length=2000)
    source_lang: Lang
    target_lang: Lang
    context: Context
    flight_ref: Optional[str] = Field(
        default=None,
        description="örn. 'TK1862-2026-06-28'. Sadece full-mode context'lerde anlamlı.",
    )


class ForceReportOut(BaseModel):
    kind: str          # "term" | "entity"
    label: str         # term_id veya aidx key
    expected: str
    fixed: bool
    method: str        # "present" | "regex_replace" | "appended" | "unresolved"
    detail: str = ""


class TranslateOut(BaseModel):
    translation: str       # son metin (force post-processor sonrası)
    raw_llm_output: str    # LLM'in döndürdüğü ham metin (telemetri için)
    force_report: list[ForceReportOut]


# ---- endpoint ---------------------------------------------------------------

@router.post("/translate", response_model=TranslateOut)
async def translate(request: Request, body: TranslateIn) -> TranslateOut:
    if body.source_lang == body.target_lang:
        raise HTTPException(400, "source_lang ve target_lang aynı olamaz")

    frozen: FrozenLayer = request.app.state.frozen

    # Flight'ı DB'den çek — sadece flight_ref geldiyse
    flight = None
    if body.flight_ref:
        async with SessionLocal()() as session:
            flight = await get_flight(session, body.flight_ref)
        if flight is None:
            raise HTTPException(
                404, f"flight_ref bulunamadı: {body.flight_ref}"
            )

    # Prompt inşa
    pb_req = TranslationRequest(
        source_text=body.source_text,
        source_lang=body.source_lang,
        target_lang=body.target_lang,
        context=body.context,
        flight_ref=body.flight_ref,
    )
    prompt = build_prompt(pb_req, frozen, flight=flight)

    # LLM çağrısı
    try:
        client = get_llm_client()
        raw = await client.complete(prompt.system, prompt.user)
    except RuntimeError as exc:
        # config eksikliği (API key yok vb.)
        log.error("LLM config hatası: %s", exc)
        raise HTTPException(503, f"LLM client yapılandırma hatası: {exc}")
    except Exception as exc:
        # API hatası — rate limit, timeout, network
        log.error("LLM çağrısı başarısız: %s", exc)
        raise HTTPException(502, f"LLM çağrısı başarısız: {exc}")

    # Force post-processor
    fixed, reports = apply_force_items(raw, prompt.force_items)

    return TranslateOut(
        translation=fixed,
        raw_llm_output=raw,
        force_report=[
            ForceReportOut(
                kind=item.kind,
                label=item.label,
                expected=item.expected,
                fixed=report.fixed,
                method=report.method,
                detail=report.detail,
            )
            for item, report in reports
        ],
    )
