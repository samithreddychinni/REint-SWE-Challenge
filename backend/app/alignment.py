from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Tuple

from .models import SeriesPoint


def parse_utc(ts: str) -> datetime:
    return datetime.fromisoformat(ts.replace("Z", "+00:00")).astimezone(timezone.utc)


def format_utc(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def build_actual_lookup(actuals: List[dict], resolution: str) -> Dict[datetime, float]:
    half_hour: Dict[datetime, float] = {}
    for row in actuals:
        half_hour[parse_utc(row["startTime"])] = float(row["generation"])

    if resolution == "30min":
        return half_hour

    # Aggregate two 30-minute settlement periods into hourly mean MW
    hourly_buckets: Dict[datetime, List[float]] = defaultdict(list)
    for dt, gen in half_hour.items():
        hour_dt = dt.replace(minute=0, second=0, microsecond=0)
        hourly_buckets[hour_dt].append(gen)

    return {
        hour_dt: round(sum(vals) / len(vals), 1)
        for hour_dt, vals in hourly_buckets.items()
    }


def index_forecasts(forecasts: List[dict]) -> Dict[datetime, List[Tuple[datetime, float]]]:
    indexed: Dict[datetime, List[Tuple[datetime, float]]] = defaultdict(list)
    for row in forecasts:
        st = parse_utc(row["startTime"])
        pt = parse_utc(row["publishTime"])
        # Drop backcast rows where publishTime is after target startTime
        if pt <= st:
            indexed[st].append((pt, float(row["generation"])))

    for st in indexed:
        indexed[st].sort(key=lambda item: item[0])
    return indexed


def _select_forecast_for_target(
    candidates: List[Tuple[datetime, float]],
    cutoff_dt: datetime,
) -> Optional[Tuple[datetime, float]]:
    chosen: Optional[Tuple[datetime, float]] = None
    for pt, gen in candidates:
        if pt <= cutoff_dt:
            chosen = (pt, gen)
        else:
            break
    return chosen


def align_series(
    actuals: List[dict],
    forecasts: List[dict],
    start_date: str,
    end_date: str,
    mode: str = "day_ahead",
    cutoff_time: str = "09:30",
    horizon_hours: float = 24.0,
    resolution: str = "hourly",
) -> List[SeriesPoint]:
    actual_map = build_actual_lookup(actuals, resolution)
    forecast_index = index_forecasts(forecasts)

    start_dt = datetime.fromisoformat(f"{start_date}T00:00:00+00:00")
    end_dt = datetime.fromisoformat(f"{end_date}T23:59:59+00:00")

    cutoff_parts = [int(p) for p in cutoff_time.split(":")]
    cutoff_hour = cutoff_parts[0]
    cutoff_minute = cutoff_parts[1] if len(cutoff_parts) > 1 else 0

    step = timedelta(minutes=30 if resolution == "30min" else 60)
    points: List[SeriesPoint] = []
    cur = start_dt

    while cur <= end_dt:
        actual_mw = actual_map.get(cur)
        forecast_hour = cur.replace(minute=0, second=0, microsecond=0)
        candidates = forecast_index.get(forecast_hour, [])

        if mode == "day_ahead":
            # Purchase decision for delivery date D is made on D-1 at cutoff_time UTC
            decision_day = cur.date() - timedelta(days=1)
            cutoff_dt = datetime(
                decision_day.year,
                decision_day.month,
                decision_day.day,
                cutoff_hour,
                cutoff_minute,
                tzinfo=timezone.utc,
            )
        else:
            cutoff_dt = cur - timedelta(hours=horizon_hours)

        selected = _select_forecast_for_target(candidates, cutoff_dt)
        forecast_mw: Optional[float] = None
        publish_time: Optional[str] = None
        lead_hours: Optional[float] = None
        error_mw: Optional[float] = None
        abs_error_mw: Optional[float] = None
        shortfall_mw: Optional[float] = None

        if selected is not None:
            pt, f_val = selected
            forecast_mw = round(f_val, 1)
            publish_time = format_utc(pt)
            lead_hours = round((cur - pt).total_seconds() / 3600.0, 2)

        if actual_mw is not None and forecast_mw is not None:
            # Positive error means forecast exceeded actual (wind under-generation / supply shortfall)
            error_mw = round(forecast_mw - actual_mw, 1)
            abs_error_mw = round(abs(error_mw), 1)
            shortfall_mw = round(max(0.0, forecast_mw - actual_mw), 1)

        points.append(
            SeriesPoint(
                start_time=format_utc(cur),
                actual_mw=actual_mw,
                forecast_mw=forecast_mw,
                publish_time=publish_time,
                horizon_hours=lead_hours,
                error_mw=error_mw,
                abs_error_mw=abs_error_mw,
                shortfall_mw=shortfall_mw,
            )
        )
        cur += step

    return points
