"""
End-to-end demo: build_prompt -> LLM call -> print.
Force post-processor henüz yok (sırada o). Yani LLM çıktısı ham.

Kullanım:
    set ANTHROPIC_API_KEY=sk-ant-...
    set LLM_PROVIDER=anthropic
    python -m scripts.translate_demo
"""
from __future__ import annotations

import asyncio

from app.db import SessionLocal
from app.repositories.frozen import load_frozen
from app.services.llm import get_llm_client
from app.services.prompt_builder import TranslationRequest, build_prompt


# Boarding senaryosundan iki örnek: biri yolcudan, biri staff'tan.
SAMPLES: list[TranslationRequest] = [
    # Yolcu (IT) -> Staff (TR)
    TranslationRequest(
        source_text="Mi scusi, è questo il gate per Roma?",
        source_lang="it",
        target_lang="tr",
        context="boarding",
    ),
    # Staff (TR) -> Yolcu (EN). Force trigger: "kapı" + "TK1862"
    TranslationRequest(
        source_text=(
            "Roma uçuşunuz TK1862, kapı G9A. "
            "Biniş 14:35'te başlayacak. Koltuğunuz 23A."
        ),
        source_lang="tr",
        target_lang="en",
        context="boarding",
    ),
]


async def main() -> None:
    async with SessionLocal()() as session:
        frozen = await load_frozen(session)

    client = get_llm_client()

    for i, req in enumerate(SAMPLES, 1):
        prompt = build_prompt(req, frozen, flight=None)

        print(f"\n{'='*70}")
        print(f"SAMPLE {i}: {req.source_lang} -> {req.target_lang} ({req.context})")
        print(f"{'='*70}")
        print(f"SOURCE: {req.source_text}")

        if prompt.force_items:
            print("EXPECTED FORCE ITEMS:")
            for fi in prompt.force_items:
                print(f"  [{fi.kind}] {fi.label} -> {fi.expected}")
        else:
            print("EXPECTED FORCE ITEMS: (none)")

        output = await client.complete(prompt.system, prompt.user)
        print(f"OUTPUT: {output}")


if __name__ == "__main__":
    asyncio.run(main())
