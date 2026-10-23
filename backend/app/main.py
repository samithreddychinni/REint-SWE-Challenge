from pathlib import Path
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .alignment import align_series
from .config import (
    DEFAULT_CUTOFF_TIME,
    DEFAULT_END_DATE,
    DEFAULT_HORIZON_HOURS,
    DEFAULT_START_DATE,
)
from .elexon import get_actuals, get_forecasts
from .metrics import (
    compute_daily_rows,
    compute_error_distribution,
    compute_horizon_profile,
    compute_hourly_profile,
    compute_summary,
)
from .models import DashboardResponse

app = FastAPI(
    title="UK Day-Ahead Wind Forecast & Error API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check() -> dict:
    return {"status": "ok"}


@app.get("/api/dashboard", response_model=DashboardResponse)
def get_dashboard(
    start_date: str = Query(DEFAULT_START_DATE, pattern=r"^\d{4}-\d{2}-\d{2}$"),
    end_date: str = Query(DEFAULT_END_DATE, pattern=r"^\d{4}-\d{2}-\d{2}$"),
    mode: str = Query("day_ahead", pattern=r"^(day_ahead|horizon)$"),
    cutoff_time: str = Query(DEFAULT_CUTOFF_TIME, pattern=r"^\d{2}:\d{2}$"),
    horizon_hours: float = Query(DEFAULT_HORIZON_HOURS, ge=0.0, le=66.0),
    resolution: str = Query("hourly", pattern=r"^(hourly|30min)$"),
    refresh: bool = Query(False),
) -> DashboardResponse:
    actuals = get_actuals(force_refresh=refresh)
    forecasts = get_forecasts(force_refresh=refresh)

    series = align_series(
        actuals=actuals,
        forecasts=forecasts,
        start_date=start_date,
        end_date=end_date,
        mode=mode,
        cutoff_time=cutoff_time,
        horizon_hours=horizon_hours,
        resolution=resolution,
    )

    summary = compute_summary(series, resolution)
    horizon_profile = compute_horizon_profile(actuals, forecasts, start_date, end_date)
    hourly_profile = compute_hourly_profile(series)
    error_distribution = compute_error_distribution(series)
    daily_rows = compute_daily_rows(series, resolution)

    return DashboardResponse(
        mode=mode,
        start_date=start_date,
        end_date=end_date,
        cutoff_time=cutoff_time,
        horizon_hours=horizon_hours,
        resolution=resolution,
        summary=summary,
        series=series,
        horizon_profile=horizon_profile,
        hourly_profile=hourly_profile,
        error_distribution=error_distribution,
        daily_rows=daily_rows,
    )


FRONTEND_DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str) -> FileResponse:
        target = FRONTEND_DIST / full_path
        if target.is_file():
            return FileResponse(target)
        return FileResponse(FRONTEND_DIST / "index.html")
