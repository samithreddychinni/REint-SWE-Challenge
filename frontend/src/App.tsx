import { useEffect, useState } from 'react';
import { fetchDashboardData } from './api';
import { ControlBar } from './components/ControlBar';
import { DailySummaryTable } from './components/DailySummaryTable';
import { ErrorDistributionChart } from './components/ErrorDistributionChart';
import { ForecastChart } from './components/ForecastChart';
import { Header } from './components/Header';
import { HorizonErrorChart } from './components/HorizonErrorChart';
import { HourlyProfileChart } from './components/HourlyProfileChart';
import { KpiStrip } from './components/KpiStrip';
import { ProcurementCalculator } from './components/ProcurementCalculator';
import { DashboardData, FilterState } from './types';

const INITIAL_FILTERS: FilterState = {
  startDate: '2026-01-01',
  endDate: '2026-01-31',
  mode: 'day_ahead',
  cutoffTime: '09:30',
  horizonHours: 24,
  resolution: 'hourly',
};

export function App() {
  const [activeTab, setActiveTab] = useState<'explorer' | 'accuracy'>('explorer');
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetchDashboardData(filters, controller.signal)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (err.name === 'AbortError') return;
        setError(err.message || 'Failed to load wind dataset');
        setLoading(false);
      });

    return () => controller.abort();
  }, [filters]);

  const handleSelectSingleDate = (date: string) => {
    setFilters((prev) => ({
      ...prev,
      startDate: date,
      endDate: date,
    }));
    setActiveTab('explorer');
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="mx-auto max-w-7xl space-y-4 px-4 py-5 sm:px-6">
        <ControlBar filters={filters} onChange={setFilters} loading={loading} />

        {error && (
          <div className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            Error loading Elexon dataset: {error}
          </div>
        )}

        {data && (
          <>
            <KpiStrip summary={data.summary} />

            {activeTab === 'explorer' ? (
              <div className="space-y-4">
                <ForecastChart series={data.series} />
                <ProcurementCalculator summary={data.summary} />
                <DailySummaryTable
                  rows={data.daily_rows}
                  onSelectDate={handleSelectSingleDate}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <HorizonErrorChart buckets={data.horizon_profile} />
                  <HourlyProfileChart profile={data.hourly_profile} />
                </div>
                <ErrorDistributionChart bins={data.error_distribution} />
                <DailySummaryTable
                  rows={data.daily_rows}
                  onSelectDate={handleSelectSingleDate}
                />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
export default App;
