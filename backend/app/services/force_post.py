"""
Force post-processor — 5. adım.

LLM çıktısının istenilen `ForceItem` listesine uyup uymadığını doğrular.
Uymuyorsa, entity'ler için pattern-tabanlı düzeltme dener.
Term ihlallerini düzeltmek riskli (yanlış kelimeyi değiştirebiliriz),
o yüzden sadece raporlar — caller retry kararını verir.

Tek genel fonksiyon:
    apply_force_items(output, items) -> (fixed_output, unresolved)
"""
from __future__ import annotations

import re
from dataclasses import dataclass

from app.services.prompt_builder import ForceItem


# Entity tipi tahmini — expected değerin yapısına bakarak benzer şekildekileri bul
_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    # (kategori adı, regex)
    ("time",   re.compile(r"\b\d{1,2}:\d{2}\b")),                  # 14:35
    ("flight", re.compile(r"\b[A-Z]{2,3}\d{2,4}[A-Z]?\b")),        # TK1862, TK7
    ("gate",   re.compile(r"\b[A-Z]\d{1,3}[A-Z]?\b")),             # G9A, H7, B12
    ("seat",   re.compile(r"\b\d{1,3}[A-K]\b")),                   # 23A, 14A
]


@dataclass(frozen=True, slots=True)
class ForceReport:
    """Bir denemeye dair sonuç."""
    fixed: bool         # düzeltme yapıldı mı
    method: str         # "present" | "regex_replace" | "appended" | "unresolved"
    detail: str = ""    # tanı için kısa not


def _category_of(value: str) -> str | None:
    """Expected değeri uygun kategoriye sok — None ise tanıyamadık."""
    for name, pat in _PATTERNS:
        if pat.fullmatch(value):
            return name
    return None


def _try_entity_fix(output: str, item: ForceItem) -> tuple[str, ForceReport]:
    """Entity ihlali için pattern-based düzeltme deneyelim."""
    category = _category_of(item.expected)
    if category is None:
        # Tanımadığımız bir entity tipi — güvenli düzeltme yok, append
        return (
            f"{output.rstrip()} ({item.expected})",
            ForceReport(True, "appended", f"{item.label}={item.expected}"),
        )

    # Aynı kategorideki pattern'leri output'ta ara
    _, pattern = next(p for p in _PATTERNS if p[0] == category)
    matches = pattern.findall(output)
    candidates = [m for m in matches if m != item.expected]

    if len(candidates) == 1:
        # Tek bir aday — büyük olasılıkla LLM bunu yanlış üretti, değiştir
        fixed = output.replace(candidates[0], item.expected, 1)
        return (
            fixed,
            ForceReport(
                True,
                "regex_replace",
                f"{item.label}: {candidates[0]!r} -> {item.expected!r}",
            ),
        )

    if not candidates:
        # Hiç benzer pattern yok — append
        return (
            f"{output.rstrip()} ({item.expected})",
            ForceReport(True, "appended", f"{item.label}={item.expected}"),
        )

    # Birden fazla aday var — hangisini değiştireceğimiz belirsiz, güvenli değil.
    # Kullanıcıya bırak (caller LLM'i daha sıkı promptla yeniden çağırabilir).
    return (
        output,
        ForceReport(
            False,
            "unresolved",
            f"{item.label}: multiple candidates {candidates!r}",
        ),
    )


def apply_force_items(
    output: str, items: list[ForceItem]
) -> tuple[str, list[tuple[ForceItem, ForceReport]]]:
    """
    Force items'ı tek tek kontrol eder, mümkünse düzeltir.
    Returns:
        fixed_output:  son metin
        report:        (item, ForceReport) çiftleri — telemetri/log için
    """
    current = output
    reports: list[tuple[ForceItem, ForceReport]] = []

    for item in items:
        # Zaten varsa atla
        if item.expected in current or any(a in current for a in item.accept):
            reports.append((item, ForceReport(True, "present")))
            continue

        if item.kind == "entity":
            current, r = _try_entity_fix(current, item)
            reports.append((item, r))
        else:
            # Term ihlali — otomatik düzeltme riskli, sadece raporla
            reports.append(
                (
                    item,
                    ForceReport(
                        False,
                        "unresolved",
                        f"term {item.label} ({item.expected!r}) not in output",
                    ),
                )
            )

    return current, reports


# ---- smoke test (DB/LLM yok) ------------------------------------------------
# Kullanım: python -m app.services.force_post
if __name__ == "__main__":
    samples: list[tuple[str, list[ForceItem]]] = [
        # 1) LLM saati yerelleştirdi: 14:35 -> 2:35 PM
        (
            "Your flight to Rome is TK1862, gate G9A. Boarding starts at 2:35 PM.",
            [
                ForceItem(kind="entity", label="flightNumber", expected="TK1862"),
                ForceItem(kind="entity", label="gate", expected="G9A"),
                ForceItem(kind="entity", label="boardingTime", expected="14:35"),
            ],
        ),
        # 2) LLM gate kodunu kaybetti
        (
            "Your flight to Rome is TK1862. Boarding starts at 14:35.",
            [
                ForceItem(kind="entity", label="gate", expected="G9A"),
            ],
        ),
        # 3) LLM "gate" yerine "door" yazdı — term ihlali
        (
            "Excuse me, is this the door for Rome?",
            [
                ForceItem(
                    kind="term", label="gate",
                    expected="gate", accept=("boarding gate",),
                ),
            ],
        ),
        # 4) Her şey yerinde
        (
            "Your flight to Rome is TK1862, gate G9A. Boarding starts at 14:35.",
            [
                ForceItem(kind="entity", label="flightNumber", expected="TK1862"),
                ForceItem(kind="entity", label="gate", expected="G9A"),
                ForceItem(kind="entity", label="boardingTime", expected="14:35"),
            ],
        ),
    ]

    for i, (out, items) in enumerate(samples, 1):
        fixed, reports = apply_force_items(out, items)
        print(f"\n--- SAMPLE {i} ---")
        print(f"INPUT:  {out}")
        print(f"FIXED:  {fixed}")
        for item, r in reports:
            print(f"  [{item.kind}/{item.label}] {r.method}: {r.detail}")
