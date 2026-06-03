"""Async DB engine + session factory (psycopg 3, port 5434)."""
from __future__ import annotations

import sys
import asyncio
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

import os
from functools import lru_cache

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)


DEFAULT_URL = "postgresql+psycopg://ceviri:ceviri@127.0.0.1:5434/ceviri"


@lru_cache(maxsize=1)
def database_url() -> str:
    return os.environ.get("DATABASE_URL", DEFAULT_URL)


@lru_cache(maxsize=1)
def engine():
    return create_async_engine(
        database_url(),
        future=True,
        pool_pre_ping=True,
    )


@lru_cache(maxsize=1)
def SessionLocal() -> async_sessionmaker[AsyncSession]:
    return async_sessionmaker(
        bind=engine(),
        expire_on_commit=False,
        autoflush=False,
        class_=AsyncSession,
    )