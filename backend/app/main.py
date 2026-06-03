"""FastAPI uygulaması — lifespan donmuş katmanı yükler, router'lar bağlı."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api.scenarios import router as scenarios_router
from app.api.translate import router as translate_router
from app.api.voice import router as voice_router
from app.db import SessionLocal, engine
from app.repositories import FrozenLayer, load_frozen
from app.api.ops import router as ops_router

log = logging.getLogger("global_gate")
logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s | %(message)s")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Açılışta: donmuş tabloları belleğe yükle. Kapanışta: engine dispose."""
    async with SessionLocal()() as session:
        frozen = await load_frozen(session)

    app.state.frozen = frozen
    log.info(
        "frozen layer loaded: %d contexts, %d terms, %d translations",
        len(frozen.contexts),
        len(frozen.terms_by_id),
        len(frozen.translations),
    )
    try:
        yield
    finally:
        await engine().dispose()
        log.info("engine disposed")


app = FastAPI(
    title="Global Gate — Çok Dilli Çeviri",
    version="0.3.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(translate_router, tags=["translation"])
app.include_router(voice_router, tags=["voice"])
app.include_router(scenarios_router, tags=["scenarios"])
app.include_router(ops_router, tags=["ops"])

def get_frozen(request: Request) -> FrozenLayer:
    return request.app.state.frozen


@app.get("/health")
async def health(request: Request) -> dict:
    frozen: FrozenLayer = request.app.state.frozen
    return {
        "status": "ok",
        "frozen": {
            "contexts": len(frozen.contexts),
            "terms": len(frozen.terms_by_id),
            "translations": len(frozen.translations),
        },
    }
