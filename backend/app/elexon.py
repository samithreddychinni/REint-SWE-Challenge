import json
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Dict, List, Tuple

from .config import (
    DATA_DIR,
    FETCH_END_DATE,
    FETCH_START_DATE,
    FUELHH_STREAM_URL,
    WINDFOR_STREAM_URL,
)

_MEMORY_CACHE: Dict[str, List[dict]] = {}


def _fetch_json(url: str, params: dict) -> List[dict]:
    query = urllib.parse.urlencode(params)
    full_url = f"{url}?{query}"
    req = urllib.request.Request(
        full_url,
        headers={
            "Accept": "application/json",
            "User-Agent": "uk-wind-desk/1.0",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _load_or_fetch(cache_file: Path, url: str, params: dict) -> List[dict]:
    key = cache_file.name
    if key in _MEMORY_CACHE:
        return _MEMORY_CACHE[key]

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if cache_file.exists():
        data = json.loads(cache_file.read_text(encoding="utf-8"))
        _MEMORY_CACHE[key] = data
        return data

    data = _fetch_json(url, params)
    cache_file.write_text(json.dumps(data), encoding="utf-8")
    _MEMORY_CACHE[key] = data
    return data


def get_actuals(force_refresh: bool = False) -> List[dict]:
    cache_file = DATA_DIR / "fuelhh_jan2026.json"
    if force_refresh and cache_file.exists():
        cache_file.unlink()
        _MEMORY_CACHE.pop(cache_file.name, None)

    raw = _load_or_fetch(
        cache_file,
        FUELHH_STREAM_URL,
        {
            "settlementDateFrom": FETCH_START_DATE,
            "settlementDateTo": FETCH_END_DATE,
            "fuelType": "WIND",
        },
    )
    by_start: Dict[str, dict] = {}
    for row in raw:
        if row.get("fuelType") != "WIND":
            continue
        st = row.get("startTime")
        if st:
            by_start[st] = {
                "startTime": st,
                "generation": float(row["generation"]),
            }
    return [by_start[k] for k in sorted(by_start.keys())]


def get_forecasts(force_refresh: bool = False) -> List[dict]:
    cache_file = DATA_DIR / "windfor_jan2026.json"
    if force_refresh and cache_file.exists():
        cache_file.unlink()
        _MEMORY_CACHE.pop(cache_file.name, None)

    raw = _load_or_fetch(
        cache_file,
        WINDFOR_STREAM_URL,
        {
            "publishDateTimeFrom": f"{FETCH_START_DATE}T00:00:00Z",
            "publishDateTimeTo": f"{FETCH_END_DATE}T23:59:59Z",
        },
    )
    by_key: Dict[Tuple[str, str], dict] = {}
    for row in raw:
        st = row.get("startTime")
        pt = row.get("publishTime")
        if st and pt and row.get("generation") is not None:
            by_key[(st, pt)] = {
                "startTime": st,
                "publishTime": pt,
                "generation": float(row["generation"]),
            }
    return list(by_key.values())
