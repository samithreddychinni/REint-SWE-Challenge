import { FilterState, Resolution, SelectionMode } from '../types';

interface ControlBarProps {
  filters: FilterState;
  onChange: (next: FilterState) => void;
  loading: boolean;
}

const CUTOFF_OPTIONS = [
  { value: '07:30', label: '07:30 UTC (Early Morning Run)' },
  { value: '09:30', label: '09:30 UTC (Pre-Auction Gate Closure)' },
  { value: '11:30', label: '11:30 UTC (Midday Auction Update)' },
  { value: '15:30', label: '15:30 UTC (Afternoon Run)' },
  { value: '18:30', label: '18:30 UTC (Evening Run)' },
  { value: '22:30', label: '22:30 UTC (Late D-1 Run)' },
];

const QUICK_RANGES = [
  { label: 'Full Jan 2026', start: '2026-01-01', end: '2026-01-31' },
  { label: 'Week 1 (Jan 1-7)', start: '2026-01-01', end: '2026-01-07' },
  { label: 'Week 2 (Jan 8-14)', start: '2026-01-08', end: '2026-01-14' },
  { label: 'Week 3 (Jan 15-21)', start: '2026-01-15', end: '2026-01-21' },
  { label: 'Week 4 (Jan 22-31)', start: '2026-01-22', end: '2026-01-31' },
];

export function ControlBar({ filters, onChange, loading }: ControlBarProps) {
  const update = (patch: Partial<FilterState>) => {
    onChange({ ...filters, ...patch });
  };

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-end">
        <div className="md:col-span-3">
          <label className="block text-xs font-medium uppercase tracking-wider text-stone-500">
            Decision Rule
          </label>
          <select
            value={filters.mode}
            onChange={(e) => update({ mode: e.target.value as SelectionMode })}
            className="mt-1.5 w-full rounded border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-900 focus:border-teal-700 focus:outline-none"
          >
            <option value="day_ahead">Day-Ahead Auction Cutoff (D-1)</option>
            <option value="horizon">Rolling Forecast Horizon (Hours Ahead)</option>
          </select>
        </div>

        <div className="md:col-span-3">
          {filters.mode === 'day_ahead' ? (
            <>
              <label className="block text-xs font-medium uppercase tracking-wider text-stone-500">
                D-1 Cutoff Time
              </label>
              <select
                value={filters.cutoffTime}
                onChange={(e) => update({ cutoffTime: e.target.value })}
                className="mt-1.5 w-full rounded border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-900 focus:border-teal-700 focus:outline-none"
              >
                {CUTOFF_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium uppercase tracking-wider text-stone-500">
                  Forecast Horizon
                </label>
                <span className="font-mono text-xs font-semibold text-teal-800">
                  {filters.horizonHours}h ahead
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={48}
                step={2}
                value={filters.horizonHours}
                onChange={(e) => update({ horizonHours: Number(e.target.value) })}
                className="mt-2.5 w-full accent-teal-700"
              />
            </>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 md:col-span-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-stone-500">
              Delivery Start
            </label>
            <input
              type="date"
              min="2026-01-01"
              max={filters.endDate}
              value={filters.startDate}
              onChange={(e) => update({ startDate: e.target.value })}
              className="mt-1.5 w-full rounded border border-stone-300 bg-white px-2.5 py-1.5 font-mono text-sm text-stone-900 focus:border-teal-700 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-stone-500">
              Delivery End
            </label>
            <input
              type="date"
              min={filters.startDate}
              max="2026-01-31"
              value={filters.endDate}
              onChange={(e) => update({ endDate: e.target.value })}
              className="mt-1.5 w-full rounded border border-stone-300 bg-white px-2.5 py-1.5 font-mono text-sm text-stone-900 focus:border-teal-700 focus:outline-none"
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-medium uppercase tracking-wider text-stone-500">
            Time Resolution
          </label>
          <select
            value={filters.resolution}
            onChange={(e) => update({ resolution: e.target.value as Resolution })}
            className="mt-1.5 w-full rounded border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-900 focus:border-teal-700 focus:outline-none"
          >
            <option value="hourly">Hourly (60 min)</option>
            <option value="30min">Settlement Period (30 min)</option>
          </select>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-medium text-stone-500">Quick window:</span>
          {QUICK_RANGES.map((preset) => {
            const active =
              filters.startDate === preset.start && filters.endDate === preset.end;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => update({ startDate: preset.start, endDate: preset.end })}
                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                  active
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        <div className="text-xs text-stone-500">
          {loading ? (
            <span className="font-mono text-amber-700">Updating series...</span>
          ) : filters.mode === 'day_ahead' ? (
            <span>
              Selects the latest WINDFOR batch published at or before{' '}
              <strong className="font-mono text-stone-800">{filters.cutoffTime} UTC</strong> on day D-1.
            </span>
          ) : (
            <span>
              Selects the latest WINDFOR batch published at least{' '}
              <strong className="font-mono text-stone-800">{filters.horizonHours}h</strong> before delivery.
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
