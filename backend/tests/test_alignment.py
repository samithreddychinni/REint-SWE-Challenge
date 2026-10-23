from app.alignment import align_series


def test_day_ahead_cutoff_ignores_later_publications():
    actuals = [
        {"startTime": "2026-01-02T10:00:00Z", "generation": 12000.0},
        {"startTime": "2026-01-02T10:30:00Z", "generation": 12400.0},
    ]
    forecasts = [
        {
            "startTime": "2026-01-02T10:00:00Z",
            "publishTime": "2026-01-01T07:30:00Z",
            "generation": 12800.0,
        },
        {
            "startTime": "2026-01-02T10:00:00Z",
            "publishTime": "2026-01-01T09:30:00Z",
            "generation": 13100.0,
        },
        {
            "startTime": "2026-01-02T10:00:00Z",
            "publishTime": "2026-01-01T15:30:00Z",
            "generation": 12500.0,
        },
        # Backcast row published after target startTime
        {
            "startTime": "2026-01-02T10:00:00Z",
            "publishTime": "2026-01-02T15:30:00Z",
            "generation": 12200.0,
        },
    ]

    points = align_series(
        actuals=actuals,
        forecasts=forecasts,
        start_date="2026-01-02",
        end_date="2026-01-02",
        mode="day_ahead",
        cutoff_time="09:30",
        resolution="hourly",
    )
    target = [p for p in points if p.start_time == "2026-01-02T10:00:00Z"][0]

    assert target.actual_mw == 12200.0
    assert target.forecast_mw == 13100.0
    assert target.publish_time == "2026-01-01T09:30:00Z"
    assert target.error_mw == 900.0
    assert target.shortfall_mw == 900.0


def test_rolling_horizon_selection():
    actuals = [
        {"startTime": "2026-01-02T12:00:00Z", "generation": 10000.0},
        {"startTime": "2026-01-02T12:30:00Z", "generation": 10000.0},
    ]
    forecasts = [
        {
            "startTime": "2026-01-02T12:00:00Z",
            "publishTime": "2026-01-01T09:30:00Z",
            "generation": 9400.0,
        },
        {
            "startTime": "2026-01-02T12:00:00Z",
            "publishTime": "2026-01-02T07:30:00Z",
            "generation": 9800.0,
        },
    ]

    points = align_series(
        actuals=actuals,
        forecasts=forecasts,
        start_date="2026-01-02",
        end_date="2026-01-02",
        mode="horizon",
        horizon_hours=6.0,
        resolution="hourly",
    )
    target = [p for p in points if p.start_time == "2026-01-02T12:00:00Z"][0]

    assert target.forecast_mw == 9400.0
    assert target.error_mw == -600.0
    assert target.shortfall_mw == 0.0
