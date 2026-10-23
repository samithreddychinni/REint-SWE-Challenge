from typing import List, Optional
from pydantic import BaseModel


class SeriesPoint(BaseModel):
    start_time: str
    actual_mw: Optional[float]
    forecast_mw: Optional[float]
    publish_time: Optional[str]
    horizon_hours: Optional[float]
    error_mw: Optional[float]
    abs_error_mw: Optional[float]
    shortfall_mw: Optional[float]


class SummaryMetrics(BaseModel):
    sample_count: int
    mean_actual_mw: float
    mean_forecast_mw: float
    mae_mw: float
    rmse_mw: float
    bias_mw: float
    mape_pct: float
    p90_shortfall_mw: float
    p95_shortfall_mw: float
    max_shortfall_mw: float
    total_actual_gwh: float
    total_forecast_gwh: float


class HorizonBucket(BaseModel):
    horizon_label: str
    horizon_min_h: float
    horizon_max_h: float
    sample_count: int
    mae_mw: float
    rmse_mw: float
    bias_mw: float
    p90_shortfall_mw: float


class HourProfilePoint(BaseModel):
    hour_utc: int
    label: str
    mean_actual_mw: float
    mean_forecast_mw: float
    mae_mw: float
    bias_mw: float
    p90_shortfall_mw: float


class ErrorBin(BaseModel):
    bin_min_mw: float
    bin_max_mw: float
    label: str
    count: int


class DailySummaryRow(BaseModel):
    date: str
    decision_date: str
    actual_gwh: float
    forecast_gwh: float
    net_shortfall_gwh: float
    mae_mw: float
    bias_mw: float
    p90_shortfall_mw: float
    max_shortfall_mw: float


class DashboardResponse(BaseModel):
    mode: str
    start_date: str
    end_date: str
    cutoff_time: str
    horizon_hours: float
    resolution: str
    summary: SummaryMetrics
    series: List[SeriesPoint]
    horizon_profile: List[HorizonBucket]
    hourly_profile: List[HourProfilePoint]
    error_distribution: List[ErrorBin]
    daily_rows: List[DailySummaryRow]
