"""
LLM client katmanı — provider-agnostik interface + Anthropic + OpenAI.

Kullanım:
    client = get_llm_client()           # env'den seçer
    output = await client.complete(system, user)

Env vars:
    LLM_PROVIDER       = "anthropic" (default) | "openai"
    ANTHROPIC_API_KEY  = sk-ant-...
    ANTHROPIC_MODEL    = claude-sonnet-4-6 (default) — istenirse override
    OPENAI_API_KEY     = sk-...
    OPENAI_MODEL       = gpt-4o-mini (default)

Düşük sıcaklık (0.2) default — çeviri deterministik olmalı. Force
post-processor zaten son düzeltmeyi yapar; LLM tarafında yaratıcılık
istemiyoruz.
"""
from __future__ import annotations

import os
from functools import lru_cache
from typing import Protocol


DEFAULT_TEMPERATURE = 0.2
DEFAULT_MAX_TOKENS = 512  # tipik çeviri kısa; safety margin


class LLMClient(Protocol):
    """Bütün provider implementasyonları bu arayüze uymalı."""

    async def complete(
        self,
        system: str,
        user: str,
        *,
        temperature: float = DEFAULT_TEMPERATURE,
        max_tokens: int = DEFAULT_MAX_TOKENS,
    ) -> str:
        ...


# ---- Anthropic --------------------------------------------------------------

class AnthropicClient:
    def __init__(self, api_key: str, model: str) -> None:
        # Lazy import — paket yüklü olmasa diğer provider çalışmalı
        from anthropic import AsyncAnthropic
        self._client = AsyncAnthropic(api_key=api_key)
        self._model = model

    async def complete(
        self,
        system: str,
        user: str,
        *,
        temperature: float = DEFAULT_TEMPERATURE,
        max_tokens: int = DEFAULT_MAX_TOKENS,
    ) -> str:
        msg = await self._client.messages.create(
            model=self._model,
            max_tokens=max_tokens,
            temperature=temperature,
            system=system,
            messages=[{"role": "user", "content": user}],
        )
        # Anthropic responses: msg.content is list of blocks; ilk text bloğu
        for block in msg.content:
            if getattr(block, "type", None) == "text":
                return block.text.strip()
        return ""


# ---- OpenAI -----------------------------------------------------------------

class OpenAIClient:
    def __init__(self, api_key: str, model: str) -> None:
        from openai import AsyncOpenAI
        self._client = AsyncOpenAI(api_key=api_key)
        self._model = model

    async def complete(
        self,
        system: str,
        user: str,
        *,
        temperature: float = DEFAULT_TEMPERATURE,
        max_tokens: int = DEFAULT_MAX_TOKENS,
    ) -> str:
        resp = await self._client.chat.completions.create(
            model=self._model,
            max_tokens=max_tokens,
            temperature=temperature,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        )
        return (resp.choices[0].message.content or "").strip()


# ---- factory ---------------------------------------------------------------

@lru_cache(maxsize=1)
def get_llm_client() -> LLMClient:
    """Env'e göre bir client döner. Singleton."""
    provider = os.environ.get("LLM_PROVIDER", "anthropic").lower()

    if provider == "anthropic":
        api_key = os.environ.get("ANTHROPIC_API_KEY", "")
        if not api_key:
            raise RuntimeError(
                "LLM_PROVIDER=anthropic ama ANTHROPIC_API_KEY tanımlı değil."
            )
        model = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-5")
        return AnthropicClient(api_key, model)

    if provider == "openai":
        api_key = os.environ.get("OPENAI_API_KEY", "")
        if not api_key:
            raise RuntimeError(
                "LLM_PROVIDER=openai ama OPENAI_API_KEY tanımlı değil."
            )
        model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
        return OpenAIClient(api_key, model)

    raise RuntimeError(f"Bilinmeyen LLM_PROVIDER: {provider!r}")


# ---- smoke test ------------------------------------------------------------
# Kullanım: python -m app.services.llm
# (gerçek API key gerekli, gerçek çağrı yapar)
if __name__ == "__main__":
    import asyncio

    async def _demo() -> None:
        client = get_llm_client()
        out = await client.complete(
            system="You are a translator. Translate Turkish to English. Output only the translation.",
            user="Pardon, Roma uçuşunun kapısı bu mu?",
        )
        print(out)

    asyncio.run(_demo())
