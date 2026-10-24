export type SelectionMode = 'day_ahead' | 'horizon';
export type Resolution = 'hourly' | '30min';

export interface SeriesPoint {
  start_time: string;
  actual_mw: number | null;
  forecast_mw: number | null;
  publish_time: string | null;
  horizon_hours: number | null;
  error_mw: number | null;
  abs_error_mw: number | null;
  shortfall_mw: number | null;
}

export interface SummaryMetrics {
  sample_count: number;
  mean_actual_mw: number;
  mean_forecast_mw: number;
  mae_mw: number;
  rmse_mw: number;
  bias_mw: number;
  mape_pct: number;
  p90_shortfall_mw: number;
  p95_shortfall_mw: number;
  max_shortfall_mw: number;
  total_actual_gwh: number;
  total_forecast_gwh: number;
}

export interface HorizonBucket {
  horizon_label: string;
  horizon_min_h: number;
  horizon_max_h: number;
  sample_count: number;
  mae_mw: number;
  rmse_mw: number;
  bias_mw: number;
  p90_shortfall_mw: number;
}

export interface HourProfilePoint {
  hour_utc: number;
  label: string;
  mean_actual_mw: number;
  mean_forecast_mw: number;
  mae_mw: number;
  bias_mw: number;
  p90_shortfall_mw: number;
}

export interface ErrorBin {
  bin_min_mw: number;
  bin_max_mw: number;
  label: string;
  count: number;
}

export interface DailySummaryRow {
  date: string;
  decision_date: string;
  actual_gwh: number;
  forecast_gwh: number;
  net_shortfall_gwh: number;
  mae_mw: number;
  bias_mw: number;
  p90_shortfall_mw: number;
  max_shortfall_mw: number;
}

export interface DashboardData {
  mode: SelectionMode;
  start_date: string;
  end_date: string;
  cutoff_time: string;
  horizon_hours: number;
  resolution: Resolution;
  summary: SummaryMetrics;
  series: SeriesPoint[];
  horizon_profile: HorizonBucket[];
  hourly_profile: HourProfilePoint[];
  error_distribution: ErrorBin[];
  daily_rows: DailySummaryRow[];
}

export interface FilterState {
  startDate: string;
  endDate: string;
  mode: SelectionMode;
  cutoffTime: string;
  horizonHours: number;
  resolution: Resolution;
}
