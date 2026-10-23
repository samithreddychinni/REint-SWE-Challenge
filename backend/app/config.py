from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"

ELEXON_BASE_URL = "https://data.elexon.co.uk/bmrs/api/v1/datasets"
FUELHH_STREAM_URL = f"{ELEXON_BASE_URL}/FUELHH/stream"
WINDFOR_STREAM_URL = f"{ELEXON_BASE_URL}/WINDFOR/stream"

# Includes D-1 buffer for Jan 1 delivery and D+1 buffer for Jan 31 decisions
FETCH_START_DATE = "2025-12-30"
FETCH_END_DATE = "2026-02-02"

DEFAULT_START_DATE = "2026-01-01"
DEFAULT_END_DATE = "2026-01-31"
DEFAULT_CUTOFF_TIME = "09:30"
DEFAULT_HORIZON_HOURS = 24.0
