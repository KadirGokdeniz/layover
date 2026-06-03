# Bu dosya commit'lenir — yer tutucu değerler içerir, gerçek anahtar yok.
# Kullanım:
#   1) Bu dosyayı `setup-env.ps1` olarak KOPYALA (`Copy-Item setup-env.example.ps1 setup-env.ps1`)
#   2) `setup-env.ps1`'i notepad ile aç, PLACEHOLDER yerlerini gerçek anahtarlarla değiştir
#   3) `setup-env.ps1` zaten .gitignore'da, asla commit'lenmez
#
# Her yeni backend PowerShell pencerede:
#   . .\setup-env.ps1

# Postgres bağlantısı (lokal docker-compose için)
$env:DATABASE_URL = "postgresql+psycopg://ceviri:ceviri@127.0.0.1:5434/ceviri"

# LLM provider
$env:LLM_PROVIDER = "anthropic"
$env:ANTHROPIC_API_KEY = "PLACEHOLDER_ANTHROPIC_KEY"

# Ses servisleri
$env:ELEVENLABS_API_KEY = "PLACEHOLDER_ELEVENLABS_KEY"
$env:ASSEMBLYAI_API_KEY = "PLACEHOLDER_ASSEMBLYAI_KEY"

# ElevenLabs per-language voice ID'leri
$env:ELEVENLABS_VOICE_ID_TR = "yM93hbw8Qtvdma2wCnJG"
$env:ELEVENLABS_VOICE_ID_EN = "Fahco4VZzobUeiPqni1S"
$env:ELEVENLABS_VOICE_ID_IT = "UgBBYS2sOqTuMpoF3BR0"
$env:ELEVENLABS_VOICE_ID_AR = "ML7jGRDg4E9hIl5qEm1Z"
$env:ELEVENLABS_VOICE_ID_RU = "rQOBu7YxCDxGiFdTm28w"

Write-Host "Env hazır (template — placeholder'ları gerçek anahtarlarla değiştirmen lazım)" -ForegroundColor Yellow
