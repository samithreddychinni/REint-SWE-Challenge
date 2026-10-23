from app.metrics import compute_summary, percentile
from app.models import SeriesPoint


def test_percentile_interpolation():
    values = [0.0, 100.0, 200.0, 300.0, 400.0]
    assert percentile(values, 0.5) == 200.0
    assert percentile(values, 0.9) == 360.0


def test_compute_summary_metrics():
    series = [
        SeriesPoint(
            start_time="2026-01-01T00:00:00Z",
            actual_mw=10000.0,
            forecast_mw=11000.0,
            publish_time="2025-12-31T09:30:00Z",
            horizon_hours=14.5,
            error_mw=1000.0,
            abs_error_mw=1000.0,
            shortfall_mw=1000.0,
        ),
        SeriesPoint(
            start_time="2026-01-01T01:00:00Z",
            actual_mw=10000.0,
            forecast_mw=9500.0,
            publish_time="2025-12-31T09:30:00Z",
            horizon_hours=15.5,
            error_mw=-500.0,
            abs_error_mw=500.0,
            shortfall_mw=0.0,
        ),
    ]

    summary = compute_summary(series, "hourly")
    assert summary.sample_count == 2
    assert summary.mae_mw == 750.0
    assert summary.bias_mw == 250.0
    assert summary.max_shortfall_mw == 1000.0
    assert summary.total_actual_gwh == 20.0
