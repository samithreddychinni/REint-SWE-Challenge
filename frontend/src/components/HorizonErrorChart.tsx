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
import { HorizonBucket } from '../types';
import { formatMw, formatSignedMw } from '../utils/format';

interface HorizonErrorChartProps {
  buckets: HorizonBucket[];
}

export function HorizonErrorChart({ buckets }: HorizonErrorChartProps) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <div className="mb-3">
        <h2 className="text-base font-semibold text-stone-900">
          Forecast Error vs Lead Time Horizon (0h to 48h)
        </h2>
        <p className="text-xs text-stone-600">
          Quantifies how MAE and P90 shortfall grow as purchase decisions are made further ahead of delivery.
        </p>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={buckets} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
            <XAxis dataKey="horizon_label" tick={{ fontSize: 11, fill: '#57534e' }} />
            <YAxis
              tickFormatter={(v) => `${v}`}
              tick={{ fontSize: 11, fill: '#57534e' }}
              width={44}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const b = payload[0].payload as HorizonBucket;
                return (
                  <div className="rounded border border-stone-300 bg-white p-2.5 text-xs shadow-md font-mono">
                    <p className="font-semibold text-stone-900">Horizon: {b.horizon_label}</p>
                    <p className="text-stone-600">Samples: {b.sample_count}</p>
                    <p className="mt-1 text-stone-900">MAE: {formatMw(b.mae_mw)}</p>
                    <p className="text-stone-700">RMSE: {formatMw(b.rmse_mw)}</p>
                    <p className="text-rose-700">P90 Shortfall: {formatMw(b.p90_shortfall_mw)}</p>
                    <p className="text-amber-800">Bias: {formatSignedMw(b.bias_mw)}</p>
                  </div>
                );
              }}
            />
            <Bar
              dataKey="mae_mw"
              name="MAE (MW)"
              fill="#0d9488"
              radius={[3, 3, 0, 0]}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="p90_shortfall_mw"
              name="P90 Shortfall (MW)"
              stroke="#be123c"
              strokeWidth={2}
              dot={{ r: 3 }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
