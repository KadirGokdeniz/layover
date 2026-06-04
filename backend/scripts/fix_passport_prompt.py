"""
Force-update passport context's prompt_instruction to prevent the LLM from
generating staff-like responses when translating passenger words.

Symptom this fixes:
    Passenger says (RU): "Спасибо, воспользуюсь автоматическими воротами."
    Wrong translation:    "Buyrun, iyi yolculuklar."  ← LLM hallucinating staff response
    Correct translation:  "Teşekkürler, otomatik kapıyı kullanacağım."

Usage (local):
    cd backend
    . .\\setup-env.ps1
    python -m scripts.fix_passport_prompt

Usage (prod):
    $env:DATABASE_URL = "<DATABASE_PUBLIC_URL>"
    $env:DATABASE_URL = $env:DATABASE_URL -replace "^postgresql://", "postgresql+psycopg://"
    cd backend
    python -m scripts.fix_passport_prompt

After running, restart the backend so the new prompt is picked up.
"""

import os
import sys

from sqlalchemy import create_engine, text


PASSPORT_PROMPT = """Sen pasaport kontrolünde çalışan bir TERCÜMAN'sın. Görevin: yer hizmetlisi (Türkçe konuşur) ile yolcu (yabancı dil konuşur) arasında söylenenleri, kelimesi kelimesine, eklemeden, çıkarmadan çevirmek.

KESİN KURALLAR — HER ZAMAN UYULMALI:
1. SADECE söyleneni çevirirsin. Asla cevap üretme, asla varsayım yapma, asla "doğal" bir yanıt tahmin etme.
2. Yolcu "teşekkür ederim" derse → Türkçe çeviri "Teşekkür ederim" olur. ASLA "Buyrun" veya "İyi yolculuklar" gibi staff cevabı EKLEME — bu personel sözüdür, yolcunun değil.
3. Yolcu konuşmasını yolcunun ağzından çevir. Personel konuşmasını personelin ağzından çevir. Rolleri ASLA karıştırma.
4. Pasaport, kuyruk, otomatik kapı hakkında RESMÎ KARAR VERMEZSİN. Sadece söylenen bilgiyi aktarırsın. Sınır polisi karar verir.
5. Cümle uzunluğunu koru. Kısa cümleyi kısa çevir, uzunu uzun. Ekleme veya kısaltma yapma.
6. Tonu koru — yolcunun nezaketini nezaketle, personelin direktliğini direktlikle aktar.

Sen bir köprüsün. Kendi sesin yok.""".strip()


def main():
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        print("ERROR: DATABASE_URL ortam değişkeni ayarlı değil")
        sys.exit(1)

    print(f"Connecting to {db_url.split('@')[-1] if '@' in db_url else 'db'}...")
    engine = create_engine(db_url)

    with engine.begin() as conn:
        result = conn.execute(
            text("UPDATE contexts SET prompt_instruction = :p WHERE id = 'passport'"),
            {"p": PASSPORT_PROMPT},
        )
        if result.rowcount == 0:
            print("⚠ Hiç satır güncellenmedi — 'passport' context bulunamadı")
            sys.exit(2)
        print(f"✓ passport prompt_instruction güncellendi ({result.rowcount} satır)")
        print()
        print("Yeni prompt (ilk 200 karakter):")
        print("  " + PASSPORT_PROMPT[:200] + "...")


if __name__ == "__main__":
    main()
