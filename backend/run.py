"""Windows-uyumlu uvicorn launcher.

uvicorn CLI'sı app modülünü import etmeden önce event loop oluşturuyor,
bu yüzden Windows'ta ProactorEventLoop -> Selector switch'i burada,
uvicorn import'undan da önce yapılmalı.

Kullanım: python run.py
"""
import asyncio
import sys

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
    )
