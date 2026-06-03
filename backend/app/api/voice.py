"""POST /tts ve POST /stt endpoint'leri.

/tts: JSON {text, lang} → audio/mpeg (ElevenLabs MP3)
/stt: multipart {audio, lang} → JSON {text} (AssemblyAI transcription)
"""
from __future__ import annotations

import logging
from typing import Literal

import httpx
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel, Field

from app.services.stt import get_stt_client
from app.services.tts import get_tts_client


log = logging.getLogger("global_gate.voice")
router = APIRouter()


Lang = Literal["tr", "en", "it", "ar", "ru"]


# ---- TTS -------------------------------------------------------------------

class TTSIn(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000)
    lang: Lang = "en"


@router.post("/tts")
async def tts(body: TTSIn) -> Response:
    try:
        client = get_tts_client()
        audio = await client.synthesize(body.text, body.lang)
    except RuntimeError as e:
        log.error("TTS config hatası: %s", e)
        raise HTTPException(503, f"TTS yapılandırma hatası: {e}")
    except httpx.HTTPStatusError as e:
        log.error("ElevenLabs hata: %s", e)
        raise HTTPException(502, f"ElevenLabs hatası: {e.response.status_code}")
    except Exception as e:
        log.error("TTS başarısız: %s", e)
        raise HTTPException(502, f"TTS başarısız: {e}")
    return Response(content=audio, media_type="audio/mpeg")


# ---- STT -------------------------------------------------------------------

class STTOut(BaseModel):
    text: str


@router.post("/stt", response_model=STTOut)
async def stt(
    audio: UploadFile = File(...),
    lang: str = Form(default="en"),
) -> STTOut:
    if lang not in ("tr", "en", "it", "ar", "ru"):
        raise HTTPException(400, f"Bilinmeyen dil: {lang}")
    try:
        audio_bytes = await audio.read()
        if not audio_bytes:
            raise HTTPException(400, "Boş ses dosyası")
        client = get_stt_client()
        text = await client.transcribe(audio_bytes, lang)
        return STTOut(text=text)
    except HTTPException:
        raise
    except RuntimeError as e:
        log.error("STT config hatası: %s", e)
        raise HTTPException(503, f"STT yapılandırma hatası: {e}")
    except Exception as e:
        log.error("STT başarısız: %s", e)
        raise HTTPException(502, f"STT başarısız: {e}")
