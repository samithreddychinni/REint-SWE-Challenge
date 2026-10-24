import { DashboardData, FilterState } from './types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export async function fetchDashboardData(
  filters: FilterState,
  signal?: AbortSignal
): Promise<DashboardData> {
  const params = new URLSearchParams({
    start_date: filters.startDate,
    end_date: filters.endDate,
    mode: filters.mode,
    cutoff_time: filters.cutoffTime,
    horizon_hours: String(filters.horizonHours),
    resolution: filters.resolution,
  });

  const response = await fetch(`${API_BASE}/api/dashboard?${params.toString()}`, {
    signal,
  });

  if (!response.ok) {
    throw new Error(`API returned status ${response.status}`);
  }

  return response.json();
}
