import { useState } from 'react';
import { SummaryMetrics } from '../types';
import { formatMw } from '../utils/format';

interface ProcurementCalculatorProps {
  summary: SummaryMetrics;
}

type BufferPolicy = 'none' | 'mae' | 'p90' | 'p95';

export function ProcurementCalculator({ summary }: ProcurementCalculatorProps) {
  const [demandMw, setDemandMw] = useState<number>(32000);
  const [policy, setPolicy] = useState<BufferPolicy>('p90');

  const bufferMap: Record<BufferPolicy, { label: string; mw: number; note: string }> = {
    none: {
      label: 'Unbuffered Forecast (0 MW reserve)',
      mw: 0,
      note: 'Assumes wind delivers 100% of the forecast. Exposes the desk to shortfall in over-forecast hours.',
    },
    mae: {
      label: `Mean Absolute Error Buffer (${formatMw(summary.mae_mw)})`,
      mw: summary.mae_mw,
      note: 'Covers average absolute deviation but leaves extreme under-generation hours exposed.',
    },
    p90: {
      label: `P90 Shortfall Buffer (${formatMw(summary.p90_shortfall_mw)})`,
      mw: summary.p90_shortfall_mw,
      note: 'Covers wind under-delivery in 90% of settlement periods in the selected window.',
    },
    p95: {
      label: `P95 Shortfall Buffer (${formatMw(summary.p95_shortfall_mw)})`,
      mw: summary.p95_shortfall_mw,
      note: 'Conservative reserve policy covering 95% of wind shortfall intervals.',
    },
  };

  const activeBuffer = bufferMap[policy];
  const firmWindCreditMw = Math.max(0, summary.mean_forecast_mw - activeBuffer.mw);
  const requiredThermalMw = Math.max(0, demandMw - firmWindCreditMw);
  const unbufferedThermalMw = Math.max(0, demandMw - summary.mean_forecast_mw);

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <div className="mb-3">
        <h2 className="text-base font-semibold text-stone-900">
          Day-Ahead Thermal &amp; Non-Renewable Procurement Calculator
        </h2>
        <p className="text-xs text-stone-600">
          Translates forecasted wind output and quantified forecast error into firm day-ahead purchase volume.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="space-y-3 lg:col-span-5">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-stone-500">
              Target Consumer Demand (MW)
            </label>
            <input
              type="number"
              min={5000}
              max={60000}
              step={500}
              value={demandMw}
              onChange={(e) => setDemandMw(Math.max(0, Number(e.target.value)))}
              className="mt-1 w-full rounded border border-stone-300 bg-white px-3 py-1.5 font-mono text-sm text-stone-900 focus:border-teal-700 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-stone-500">
              Error Risk Buffer Policy
            </label>
            <select
              value={policy}
              onChange={(e) => setPolicy(e.target.value as BufferPolicy)}
              className="mt-1 w-full rounded border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-900 focus:border-teal-700 focus:outline-none"
            >
              <option value="p90">{bufferMap.p90.label}</option>
              <option value="p95">{bufferMap.p95.label}</option>
              <option value="mae">{bufferMap.mae.label}</option>
              <option value="none">{bufferMap.none.label}</option>
            </select>
            <p className="mt-1.5 text-xs text-stone-500">{activeBuffer.note}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:col-span-7">
          <div className="rounded border border-stone-200 bg-stone-50 p-3">
            <p className="text-xs text-stone-500">Raw Wind Forecast</p>
            <p className="mt-1 font-mono text-base font-semibold tabular-nums text-stone-900">
              {formatMw(summary.mean_forecast_mw)}
            </p>
            <p className="mt-1 text-xs text-stone-500">Mean over window</p>
          </div>

          <div className="rounded border border-stone-200 bg-stone-50 p-3">
            <p className="text-xs text-stone-500">Error Reserve Deduction</p>
            <p className="mt-1 font-mono text-base font-semibold tabular-nums text-rose-800">
              -{formatMw(activeBuffer.mw)}
            </p>
            <p className="mt-1 text-xs text-stone-500">Hedges forecast error</p>
          </div>

          <div className="rounded border border-stone-200 bg-stone-50 p-3">
            <p className="text-xs text-stone-500">Firm Wind Credit</p>
            <p className="mt-1 font-mono text-base font-semibold tabular-nums text-teal-800">
              {formatMw(firmWindCreditMw)}
            </p>
            <p className="mt-1 text-xs text-stone-500">Forecast minus buffer</p>
          </div>

          <div className="rounded border border-stone-900 bg-stone-900 p-3 text-white">
            <p className="text-xs text-stone-300">Required Thermal Buy</p>
            <p className="mt-1 font-mono text-base font-semibold tabular-nums text-white">
              {formatMw(requiredThermalMw)}
            </p>
            <p className="mt-1 text-xs text-stone-300">
              vs {formatMw(unbufferedThermalMw)} unbuffered
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
