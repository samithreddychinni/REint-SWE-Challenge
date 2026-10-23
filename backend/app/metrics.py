import math
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Dict, List

from .alignment import build_actual_lookup, parse_utc
from .models import (
    DailySummaryRow,
    ErrorBin,
    HorizonBucket,
    HourProfilePoint,
    SeriesPoint,
    SummaryMetrics,
)


def percentile(values: List[float], q: float) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    if len(ordered) == 1:
        return round(ordered[0], 1)
    pos = (len(ordered) - 1) * q
    low = int(math.floor(pos))
    high = int(math.ceil(pos))
    if low == high:
        return round(ordered[low], 1)
    weight = pos - low
    return round(ordered[low] * (1.0 - weight) + ordered[high] * weight, 1)


def compute_summary(series: List[SeriesPoint], resolution: str) -> SummaryMetrics:
    valid = [
        p for p in series if p.actual_mw is not None and p.forecast_mw is not None
    ]
    if not valid:
        return SummaryMetrics(
            sample_count=0,
            mean_actual_mw=0.0,
            mean_forecast_mw=0.0,
            mae_mw=0.0,
            rmse_mw=0.0,
            bias_mw=0.0,
            mape_pct=0.0,
            p90_shortfall_mw=0.0,
            p95_shortfall_mw=0.0,
            max_shortfall_mw=0.0,
            total_actual_gwh=0.0,
            total_forecast_gwh=0.0,
        )

    n = len(valid)
    hours_per_point = 0.5 if resolution == "30min" else 1.0
    actuals = [p.actual_mw for p in valid if p.actual_mw is not None]
    forecasts = [p.forecast_mw for p in valid if p.forecast_mw is not None]
    errors = [p.error_mw for p in valid if p.error_mw is not None]
    abs_errors = [p.abs_error_mw for p in valid if p.abs_error_mw is not None]
    shortfalls = [max(0.0, e) for e in errors]

    sq_errors = [e * e for e in errors]
    pct_errors = [
        abs(p.error_mw) / p.actual_mw * 100.0
        for p in valid
        if p.actual_mw and p.actual_mw > 0 and p.error_mw is not None
    ]

    return SummaryMetrics(
        sample_count=n,
        mean_actual_mw=round(sum(actuals) / n, 1),
        mean_forecast_mw=round(sum(forecasts) / n, 1),
        mae_mw=round(sum(abs_errors) / n, 1),
        rmse_mw=round(math.sqrt(sum(sq_errors) / n), 1),
        bias_mw=round(sum(errors) / n, 1),
        mape_pct=round(sum(pct_errors) / len(pct_errors), 2) if pct_errors else 0.0,
        p90_shortfall_mw=percentile(shortfalls, 0.90),
        p95_shortfall_mw=percentile(shortfalls, 0.95),
        max_shortfall_mw=round(max(shortfalls), 1) if shortfalls else 0.0,
        total_actual_gwh=round(sum(actuals) * hours_per_point / 1000.0, 2),
        total_forecast_gwh=round(sum(forecasts) * hours_per_point / 1000.0, 2),
    )


def compute_horizon_profile(
    actuals: List[dict],
    forecasts: List[dict],
    start_date: str,
    end_date: str,
) -> List[HorizonBucket]:
    actual_hourly = build_actual_lookup(actuals, "hourly")
    start_dt = datetime.fromisoformat(f"{start_date}T00:00:00+00:00")
    end_dt = datetime.fromisoformat(f"{end_date}T23:59:59+00:00")

    edges = [(0, 6), (6, 12), (12, 18), (18, 24), (24, 30), (30, 36), (36, 42), (42, 48)]
    bucket_errors: Dict[int, List[float]] = defaultdict(list)

    for row in forecasts:
        st = parse_utc(row["startTime"])
        if st < start_dt or st > end_dt:
            continue
        actual_val = actual_hourly.get(st)
        if actual_val is None:
            continue
        pt = parse_utc(row["publishTime"])
        lead_h = (st - pt).total_seconds() / 3600.0
        if lead_h < 0 or lead_h > 48:
            continue
        err = float(row["generation"]) - actual_val
        for idx, (low, high) in enumerate(edges):
            if low <= lead_h < high or (idx == len(edges) - 1 and lead_h == high):
                bucket_errors[idx].append(err)
                break

    results: List[HorizonBucket] = []
    for idx, (low, high) in enumerate(edges):
        errs = bucket_errors.get(idx, [])
        n = len(errs)
        if n == 0:
            results.append(
                HorizonBucket(
                    horizon_label=f"{low}-{high}h",
                    horizon_min_h=float(low),
                    horizon_max_h=float(high),
                    sample_count=0,
                    mae_mw=0.0,
                    rmse_mw=0.0,
                    bias_mw=0.0,
                    p90_shortfall_mw=0.0,
                )
            )
            continue
        abs_e = [abs(e) for e in errs]
        shortfalls = [max(0.0, e) for e in errs]
        results.append(
            HorizonBucket(
                horizon_label=f"{low}-{high}h",
                horizon_min_h=float(low),
                horizon_max_h=float(high),
                sample_count=n,
                mae_mw=round(sum(abs_e) / n, 1),
                rmse_mw=round(math.sqrt(sum(e * e for e in errs) / n), 1),
                bias_mw=round(sum(errs) / n, 1),
                p90_shortfall_mw=percentile(shortfalls, 0.90),
            )
        )
    return results


def compute_hourly_profile(series: List[SeriesPoint]) -> List[HourProfilePoint]:
    by_hour: Dict[int, List[SeriesPoint]] = defaultdict(list)
    for pt in series:
        if pt.actual_mw is None or pt.forecast_mw is None:
            continue
        hour = int(pt.start_time[11:13])
        by_hour[hour].append(pt)

    out: List[HourProfilePoint] = []
    for hour in range(24):
        pts = by_hour.get(hour, [])
        if not pts:
            out.append(
                HourProfilePoint(
                    hour_utc=hour,
                    label=f"{hour:02d}:00",
                    mean_actual_mw=0.0,
                    mean_forecast_mw=0.0,
                    mae_mw=0.0,
                    bias_mw=0.0,
                    p90_shortfall_mw=0.0,
                )
            )
            continue
        n = len(pts)
        errs = [p.error_mw or 0.0 for p in pts]
        shortfalls = [max(0.0, e) for e in errs]
        out.append(
            HourProfilePoint(
                hour_utc=hour,
                label=f"{hour:02d}:00",
                mean_actual_mw=round(sum(p.actual_mw or 0.0 for p in pts) / n, 1),
                mean_forecast_mw=round(sum(p.forecast_mw or 0.0 for p in pts) / n, 1),
                mae_mw=round(sum(abs(e) for e in errs) / n, 1),
                bias_mw=round(sum(errs) / n, 1),
                p90_shortfall_mw=percentile(shortfalls, 0.90),
            )
        )
    return out


def compute_error_distribution(series: List[SeriesPoint]) -> List[ErrorBin]:
    errors = [p.error_mw for p in series if p.error_mw is not None]
    step = 500
    bounds = list(range(-3500, 3500, step))
    bins: List[ErrorBin] = []

    for low in bounds:
        high = low + step
        count = sum(1 for e in errors if low <= e < high)
        bins.append(
            ErrorBin(
                bin_min_mw=float(low),
                bin_max_mw=float(high),
                label=f"{low:+d} to {high:+d}",
                count=count,
            )
        )
    return bins


def compute_daily_rows(
    series: List[SeriesPoint],
    resolution: str,
) -> List[DailySummaryRow]:
    by_day: Dict[str, List[SeriesPoint]] = defaultdict(list)
    for pt in series:
        if pt.actual_mw is None or pt.forecast_mw is None:
            continue
        by_day[pt.start_time[:10]].append(pt)

    hours_per_point = 0.5 if resolution == "30min" else 1.0
    rows: List[DailySummaryRow] = []

    for day_str in sorted(by_day.keys()):
        pts = by_day[day_str]
        n = len(pts)
        actual_gwh = sum(p.actual_mw or 0.0 for p in pts) * hours_per_point / 1000.0
        forecast_gwh = sum(p.forecast_mw or 0.0 for p in pts) * hours_per_point / 1000.0
        errs = [p.error_mw or 0.0 for p in pts]
        shortfalls = [max(0.0, e) for e in errs]
        decision_day = (
            datetime.fromisoformat(day_str).date() - timedelta(days=1)
        ).isoformat()

        rows.append(
            DailySummaryRow(
                date=day_str,
                decision_date=decision_day,
                actual_gwh=round(actual_gwh, 2),
                forecast_gwh=round(forecast_gwh, 2),
                net_shortfall_gwh=round(max(0.0, forecast_gwh - actual_gwh), 2),
                mae_mw=round(sum(abs(e) for e in errs) / n, 1),
                bias_mw=round(sum(errs) / n, 1),
                p90_shortfall_mw=percentile(shortfalls, 0.90),
                max_shortfall_mw=round(max(shortfalls), 1) if shortfalls else 0.0,
            )
        )
    return rows
