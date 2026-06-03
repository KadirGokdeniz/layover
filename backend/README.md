# Global Gate — Backend Veri Katmanı

Postgres şeması + Alembic migration + async seed. FastAPI bağlamı için
hazır (asyncpg driver, SQLAlchemy 2.0 async stack).

## Dizin yapısı

```
backend/
├── alembic.ini
├── alembic/
│   ├── env.py                  # async migration runner
│   ├── script.py.mako
│   └── versions/0001_initial.py
├── app/
│   ├── __init__.py
│   ├── db.py                   # create_async_engine + async_sessionmaker
│   └── models.py               # 5 tablo
├── scripts/
│   ├── __init__.py
│   └── seed.py                 # contexts / glossary / flights
└── requirements.txt
```

## Şema kararları

**5 tablo:**

| Tablo | PK | Niye böyle |
|---|---|---|
| `contexts` | string slug (`boarding`, `check-in`...) | Doğal anahtar zaten kararlı. `prompt_instruction` kolonu donmuş LLM bağlam talimatı için (sonraki turda doldurulacak). |
| `terms` | string `term_id` | Glossary.json'la birebir. `force` üzerinde index — post-processor sık çekecek. |
| `term_translations` | int auto | `(term_id, lang)` unique. `aliases` Postgres `text[]`, GIN index'li → cümle içi terim tespiti hızlı. |
| `context_terms` | composite `(context_id, term_id)` | Junction. Terimin `touchpoints` listesinden seed sırasında türetilir. |
| `flight_legs` | UUID | `flight_ref` ayrı unique kolon (domain-leaky, uçuş yeniden planlanırsa kayar). `aidx` JSONB — AIDX-flavored payload olduğu gibi. PATCH bu kolon üzerinde `jsonb_set` ile. |

Her tabloda `created_at` + `updated_at` (TimestampMixin).

**Donmuş vs canlı:** contexts/terms/term_translations/context_terms = uygulama
açılışında belleğe yüklenir. `flight_legs` her istekte taze çekilir.

**RAG yok**, runtime'da prompt'a enjeksiyon — bu yüzden vektör kolonu yok.
Bağlam tarafı `context_terms` üzerinden senaryo bazlı, alias eşleşmesi
GIN index üzerinden.

## Kurulum

```bash
# 1) DB
createdb ceviri
export DATABASE_URL="postgresql+asyncpg://ceviri:ceviri@localhost:5432/ceviri"

# 2) Bağımlılıklar
pip install -r requirements.txt

# 3) Migration
alembic upgrade head

# 4) Seed — data/ altında dosyalar olsun
python -m scripts.seed all
# veya tekil:
python -m scripts.seed contexts
python -m scripts.seed glossary --path data/glossary.json
python -m scripts.seed flights  --path data/mock_ops.json
```

Hepsi upsert → tekrar çalışmak güvenli. `seed_contexts` `prompt_instruction`'ı
**ezmez** (manuel doldurulduktan sonra re-seed güvenli).

## Bilinen TODO'lar

1. **`Context.prompt_instruction` içerikleri.** 5 senaryo için LLM bağlam
   talimat metinleri — ayrı bir tur, ayrı bir migration veya seed adımı.
2. **`mock_ops.json` adapter doğrulaması.** `scripts/seed.py` içindeki
   `_extract_flight_row` esnek varsayımlarla yazıldı (flightNumber /
   flight_number, scheduledDepartureDate / scheduled_date, vb.). Gerçek
   dosya gelince alan eşlemeleri netleşir.
3. **Autogenerate diff testi.** `alembic revision --autogenerate -m check`
   çalıştırıldığında upgrade() boş çıkmalı (model ↔ migration uyumu).
   DB ayağa kalkınca yapılacak.