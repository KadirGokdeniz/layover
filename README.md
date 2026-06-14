# Layover

Çok dilli havalimanı tercüman prototipi. TR ↔ EN/IT/AR/RU. Türk Hava Yolları Terminal Hızlandırma 2026 başvurusu için.

## Mimari

- **Backend:** FastAPI + Postgres + Anthropic LLM + ElevenLabs TTS + AssemblyAI STT
- **Frontend:** TanStack Start + React 19 + Tailwind v4 + shadcn/ui
- **DB:** Postgres (Docker, port 5434)

## Yerel kurulum

### 1. Önkoşullar
- Docker Desktop
- Python 3.10+
- Node 22+
- PowerShell 7 (Windows için)

### 2. Backend

```powershell
cd backend

# Env dosyasını kopyala ve gerçek anahtarlarla doldur
Copy-Item setup-env.example.ps1 setup-env.ps1
notepad setup-env.ps1   # PLACEHOLDER'ları gerçek anahtarlarla değiştir

# Postgres'i kaldır
docker compose up -d

# Python bağımlılıkları
pip install -r requirements.txt

# DB migration ve seed
. .\setup-env.ps1
alembic upgrade head
python -m scripts.seed
python -m scripts.update_contexts
python -m scripts.seed_flights

# Backend'i başlat
python run.py
```

Backend: http://127.0.0.1:8000

### 3. Frontend

```powershell
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:8080

## API anahtarları

Üç servise hesap gerek:
- [Anthropic Console](https://console.anthropic.com/) — Claude API
- [ElevenLabs](https://elevenlabs.io/) — TTS
- [AssemblyAI](https://www.assemblyai.com/) — STT
