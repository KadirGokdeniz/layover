"""AssemblyAI STT client.

Async REST akışı:
  1) audio binary'sini /upload'a gönder → upload_url al
  2) /transcript'e {audio_url, language_code} POST'la → transcript id al
  3) /transcript/{id}'i polled et, completed olunca text döndür
"""
from __future__ import annotations

import asyncio
import os
from functools import lru_cache

import httpx


LANG_MAP: dict[str, str] = {
    "tr": "tr", "en": "en", "it": "it", "ar": "ar", "ru": "ru",
}


class AssemblyAISTT:
    BASE_URL = "https://api.assemblyai.com/v2"

    def __init__(self, api_key: str) -> None:
        self._api_key = api_key
        self._client = httpx.AsyncClient(timeout=60.0)

    async def transcribe(self, audio_bytes: bytes, lang: str = "en") -> str:
        headers = {"authorization": self._api_key}

        # 1) Upload
        up = await self._client.post(
            f"{self.BASE_URL}/upload",
            headers={**headers, "content-type": "application/octet-stream"},
            content=audio_bytes,
        )
        up.raise_for_status()
        audio_url = up.json()["upload_url"]

        # 2) Create transcript
        tr = await self._client.post(
            f"{self.BASE_URL}/transcript",
            headers={**headers, "content-type": "application/json"},
            json={
                "audio_url": audio_url,
                "language_code": LANG_MAP.get(lang, "en"),
            },
        )
        tr.raise_for_status()
        transcript_id = tr.json()["id"]

        # 3) Poll
        for _ in range(60):  # max 60s
            await asyncio.sleep(1)
            poll = await self._client.get(
                f"{self.BASE_URL}/transcript/{transcript_id}",
                headers=headers,
            )
            poll.raise_for_status()
            data = poll.json()
            status = data.get("status")
            if status == "completed":
                return (data.get("text") or "").strip()
            if status == "error":
                raise RuntimeError(f"AssemblyAI: {data.get('error')}")
        raise RuntimeError("AssemblyAI zaman aşımına uğradı (60s)")


@lru_cache(maxsize=1)
def get_stt_client() -> AssemblyAISTT:
    api_key = os.environ.get("ASSEMBLYAI_API_KEY", "")
    if not api_key:
        raise RuntimeError("ASSEMBLYAI_API_KEY tanımlı değil")
    return AssemblyAISTT(api_key)
