"""Repository katmanı.

frozen.py  : Açılışta belleğe yüklenen donmuş tablolar
             (contexts, terms, term_translations, context_terms).
flights.py : Her istekte DB'den çekilen canlı uçuş verisi.
"""
from app.repositories.frozen import FrozenLayer, load_frozen
from app.repositories.flights import get_flight, patch_flight_aidx

__all__ = ["FrozenLayer", "load_frozen", "get_flight", "patch_flight_aidx"]
