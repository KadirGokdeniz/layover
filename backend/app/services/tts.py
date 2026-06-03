"""ElevenLabs TTS client.

Multilingual model (eleven_multilingual_v2) ile tek voice tüm dilleri konuşur.
Voice ID env'den override edilebilir (ELEVENLABS_VOICE_ID).
"""
from __future__ import annotations

import os
from functools import lru_cache

import httpx


# Çok dilli sabit bir voice (Rachel) — TR/EN/IT/AR/RU hepsini akıcı söyler.
# Beğenmezsen ELEVENLABS_VOICE_ID env varıyla başka bir voice ID verebilirsin.
DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"
MULTILINGUAL_MODEL = "eleven_multilingual_v2"


class ElevenLabsTTS:
    def __init__(self, api_key: str, voice_id: str = DEFAULT_VOICE_ID) -> None:
        self._api_key = api_key
        self._voice_id = voice_id
        self._client = httpx.AsyncClient(timeout=30.0)

    async def synthesize(self, text: str, lang: str = "en") -> bytes:
        """text → MP3 bytes. Cross-lingual model dili text'ten anlar; `lang` parametresi
        ileride farklı voice seçimi için tutuluyor (şu an tek voice).
        """
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{self._voice_id}"
        resp = await self._client.post(
            url,
            headers={
                "xi-api-key": self._api_key,
                "accept": "audio/mpeg",
                "content-type": "application/json",
            },
            json={
                "text": text,
                "model_id": MULTILINGUAL_MODEL,
                "voice_settings": {
                    "stability": 0.5,
                    "similarity_boost": 0.75,
                    "style": 0.0,
                    "use_speaker_boost": True,
                },
            },
        )
        resp.raise_for_status()
        return resp.content


@lru_cache(maxsize=1)
def get_tts_client() -> ElevenLabsTTS:
    api_key = os.environ.get("ELEVENLABS_API_KEY", "")
    if not api_key:
        raise RuntimeError("ELEVENLABS_API_KEY tanımlı değil")
    voice_id = os.environ.get("ELEVENLABS_VOICE_ID", DEFAULT_VOICE_ID)
    return ElevenLabsTTS(api_key, voice_id)
