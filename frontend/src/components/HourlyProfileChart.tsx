import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { HourProfilePoint } from '../types';
import { formatMw, formatSignedMw } from '../utils/format';

interface HourlyProfileChartProps {
  profile: HourProfilePoint[];
}

export function HourlyProfileChart({ profile }: HourlyProfileChartProps) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <div className="mb-3">
        <h2 className="text-base font-semibold text-stone-900">
          Diurnal Error Profile by Delivery Hour (UTC)
        </h2>
        <p className="text-xs text-stone-600">
          Shows MAE and P90 wind shortfall by hour of day to identify peak-demand exposure windows.
        </p>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={profile} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
            <XAxis
              dataKey="label"
              interval={2}
              tick={{ fontSize: 11, fill: '#57534e' }}
            />
            <YAxis tick={{ fontSize: 11, fill: '#57534e' }} width={44} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const pt = payload[0].payload as HourProfilePoint;
                return (
                  <div className="rounded border border-stone-300 bg-white p-2.5 text-xs shadow-md font-mono">
                    <p className="font-semibold text-stone-900">Hour: {pt.label} UTC</p>
                    <p className="mt-1 text-stone-700">Mean Actual: {formatMw(pt.mean_actual_mw)}</p>
                    <p className="text-teal-800">Mean Forecast: {formatMw(pt.mean_forecast_mw)}</p>
                    <p className="text-stone-900">MAE: {formatMw(pt.mae_mw)}</p>
                    <p className="text-rose-700">P90 Shortfall: {formatMw(pt.p90_shortfall_mw)}</p>
                    <p className="text-amber-800">Bias: {formatSignedMw(pt.bias_mw)}</p>
                  </div>
                );
              }}
            />
            <Bar
              dataKey="mae_mw"
              name="MAE (MW)"
              fill="#57534e"
              radius={[2, 2, 0, 0]}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="p90_shortfall_mw"
              name="P90 Shortfall (MW)"
              stroke="#be123c"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
