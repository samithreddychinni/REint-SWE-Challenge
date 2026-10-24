import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ErrorBin } from '../types';

interface ErrorDistributionChartProps {
  bins: ErrorBin[];
}

export function ErrorDistributionChart({ bins }: ErrorDistributionChartProps) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <div className="mb-3">
        <h2 className="text-base font-semibold text-stone-900">
          Forecast Error Distribution (Forecast minus Actual MW)
        </h2>
        <p className="text-xs text-stone-600">
          Positive bins (rose) indicate hours where wind under-delivered relative to forecast and required supplemental generation.
        </p>
      </div>

      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={bins} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
            <XAxis
              dataKey="bin_min_mw"
              tickFormatter={(v) => `${v > 0 ? '+' : ''}${v}`}
              tick={{ fontSize: 11, fill: '#57534e' }}
            />
            <YAxis tick={{ fontSize: 11, fill: '#57534e' }} width={40} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const b = payload[0].payload as ErrorBin;
                return (
                  <div className="rounded border border-stone-300 bg-white p-2.5 text-xs shadow-md font-mono">
                    <p className="font-semibold text-stone-900">Range: {b.label} MW</p>
                    <p className="mt-1 text-stone-700">Intervals: {b.count}</p>
                    <p className="text-stone-500">
                      {b.bin_min_mw >= 0
                        ? 'Shortfall regime (Forecast > Actual)'
                        : 'Surplus regime (Actual > Forecast)'}
                    </p>
                  </div>
                );
              }}
            />
            <Bar dataKey="count" radius={[2, 2, 0, 0]} isAnimationActive={false}>
              {bins.map((entry) => (
                <Cell
                  key={entry.label}
                  fill={entry.bin_min_mw >= 0 ? '#be123c' : '#0f766e'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
