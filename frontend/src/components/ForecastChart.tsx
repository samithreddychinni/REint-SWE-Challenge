import { useState } from 'react';
import {
  Area,
  ComposedChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from 'recharts';
import { SeriesPoint } from '../types';
import {
  formatFullTimestamp,
  formatMw,
  formatShortTimestamp,
  formatSignedMw,
} from '../utils/format';

interface ForecastChartProps {
  series: SeriesPoint[];
}

export function ForecastChart({ series }: ForecastChartProps) {
  const [showErrorBand, setShowErrorBand] = useState(true);

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-stone-900">
            National Wind Generation: Forecast vs Actual (MW)
          </h2>
          <p className="text-xs text-stone-600">
            Compares Elexon FUELHH actual wind output against the latest eligible WINDFOR forecast at decision time.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-stone-900" />
            <span className="font-medium text-stone-700">Actual (FUELHH)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-teal-600" />
            <span className="font-medium text-stone-700">Forecast (WINDFOR)</span>
          </div>
          <label className="flex cursor-pointer items-center gap-1.5 text-stone-700">
            <input
              type="checkbox"
              checked={showErrorBand}
              onChange={(e) => setShowErrorBand(e.target.checked)}
              className="rounded border-stone-300 accent-amber-700"
            />
            <span>Show shortfall (Forecast &gt; Actual)</span>
          </label>
        </div>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={series} margin={{ top: 8, right: 16, left: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
            <XAxis
              dataKey="start_time"
              tickFormatter={formatShortTimestamp}
              minTickGap={42}
              tick={{ fontSize: 11, fill: '#57534e' }}
            />
            <YAxis
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 11, fill: '#57534e' }}
              width={44}
            />
            <ReferenceLine y={0} stroke="#d6d3d1" />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const pt = payload[0].payload as SeriesPoint;
                return (
                  <div className="rounded border border-stone-300 bg-white p-3 text-xs shadow-md">
                    <p className="font-mono font-semibold text-stone-900">
                      Delivery: {formatFullTimestamp(pt.start_time)}
                    </p>
                    <p className="mt-0.5 font-mono text-stone-500">
                      Published: {formatFullTimestamp(pt.publish_time)}
                      {pt.horizon_hours !== null ? ` (${pt.horizon_hours}h lead)` : ''}
                    </p>
                    <div className="mt-2 space-y-1 border-t border-stone-100 pt-1.5 font-mono">
                      <div className="flex justify-between gap-4">
                        <span className="text-stone-600">Actual:</span>
                        <span className="font-semibold text-stone-900">
                          {formatMw(pt.actual_mw)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-teal-700">Forecast:</span>
                        <span className="font-semibold text-teal-800">
                          {formatMw(pt.forecast_mw)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-stone-600">Error (F - A):</span>
                        <span
                          className={
                            (pt.error_mw ?? 0) > 0
                              ? 'font-semibold text-rose-700'
                              : 'font-semibold text-teal-700'
                          }
                        >
                          {formatSignedMw(pt.error_mw)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            {showErrorBand && (
              <Area
                type="monotone"
                dataKey="shortfall_mw"
                name="Supply Shortfall"
                fill="#fecdd3"
                stroke="#e11d48"
                strokeWidth={1}
                fillOpacity={0.45}
                isAnimationActive={false}
              />
            )}
            <Line
              type="monotone"
              dataKey="actual_mw"
              name="Actual MW"
              stroke="#1c1917"
              strokeWidth={1.75}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="forecast_mw"
              name="Forecast MW"
              stroke="#0d9488"
              strokeWidth={1.75}
              dot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
