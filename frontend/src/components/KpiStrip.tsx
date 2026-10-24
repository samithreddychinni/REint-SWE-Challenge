import { SummaryMetrics } from '../types';
import { formatMw, formatSignedMw } from '../utils/format';

interface KpiStripProps {
  summary: SummaryMetrics;
}

export function KpiStrip({ summary }: KpiStripProps) {
  const cards = [
    {
      title: 'Mean Forecast vs Actual',
      value: `${formatMw(summary.mean_forecast_mw)} / ${formatMw(summary.mean_actual_mw)}`,
      detail: `Total energy: ${summary.total_forecast_gwh.toFixed(1)} GWh forecast vs ${summary.total_actual_gwh.toFixed(1)} GWh actual`,
      tone: 'text-stone-900',
    },
    {
      title: 'Mean Absolute Error (MAE)',
      value: formatMw(summary.mae_mw),
      detail: `RMSE: ${formatMw(summary.rmse_mw)} · MAPE: ${summary.mape_pct.toFixed(1)}%`,
      tone: 'text-stone-900',
    },
    {
      title: 'Mean Forecast Bias',
      value: formatSignedMw(summary.bias_mw),
      detail:
        summary.bias_mw > 0
          ? 'Positive bias: forecast exceeded actual wind output on average'
          : 'Negative bias: actual wind output exceeded forecast on average',
      tone: summary.bias_mw > 0 ? 'text-amber-800' : 'text-teal-800',
    },
    {
      title: 'P90 Wind Shortfall Risk',
      value: formatMw(summary.p90_shortfall_mw),
      detail: `P95 shortfall: ${formatMw(summary.p95_shortfall_mw)} · Max shortfall: ${formatMw(summary.max_shortfall_mw)}`,
      tone: 'text-rose-800',
    },
  ];

  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm"
        >
          <p className="text-xs font-medium uppercase tracking-wider text-stone-500">
            {card.title}
          </p>
          <p className={`mt-1.5 font-mono text-xl font-semibold tabular-nums ${card.tone}`}>
            {card.value}
          </p>
          <p className="mt-1 text-xs text-stone-600">{card.detail}</p>
        </div>
      ))}
    </section>
  );
}
