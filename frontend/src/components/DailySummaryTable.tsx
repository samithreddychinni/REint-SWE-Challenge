import { DailySummaryRow } from '../types';
import { formatMw, formatSignedMw } from '../utils/format';

interface DailySummaryTableProps {
  rows: DailySummaryRow[];
  onSelectDate: (date: string) => void;
}

export function DailySummaryTable({ rows, onSelectDate }: DailySummaryTableProps) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white shadow-sm">
      <div className="border-b border-stone-200 px-4 py-3">
        <h2 className="text-base font-semibold text-stone-900">
          Daily Delivery &amp; Procurement Ledger (January 2026)
        </h2>
        <p className="text-xs text-stone-600">
          Click any delivery date row to isolate that 24-hour settlement window on the chart.
        </p>
      </div>

      <div className="max-h-96 overflow-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead className="sticky top-0 border-b border-stone-200 bg-stone-50 font-mono uppercase text-stone-500">
            <tr>
              <th className="px-4 py-2.5">Delivery Date</th>
              <th className="px-4 py-2.5">Decision Date (D-1)</th>
              <th className="px-4 py-2.5 text-right">Forecast (GWh)</th>
              <th className="px-4 py-2.5 text-right">Actual (GWh)</th>
              <th className="px-4 py-2.5 text-right">MAE</th>
              <th className="px-4 py-2.5 text-right">Bias (F - A)</th>
              <th className="px-4 py-2.5 text-right">P90 Shortfall</th>
              <th className="px-4 py-2.5 text-right">Peak Shortfall</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 font-mono tabular-nums">
            {rows.map((row) => (
              <tr
                key={row.date}
                onClick={() => onSelectDate(row.date)}
                className="cursor-pointer transition-colors hover:bg-stone-50"
              >
                <td className="px-4 py-2 font-medium text-stone-900 underline decoration-stone-300 underline-offset-2">
                  {row.date}
                </td>
                <td className="px-4 py-2 text-stone-600">{row.decision_date}</td>
                <td className="px-4 py-2 text-right text-teal-800">
                  {row.forecast_gwh.toFixed(1)}
                </td>
                <td className="px-4 py-2 text-right text-stone-900">
                  {row.actual_gwh.toFixed(1)}
                </td>
                <td className="px-4 py-2 text-right text-stone-800">
                  {formatMw(row.mae_mw)}
                </td>
                <td
                  className={`px-4 py-2 text-right ${
                    row.bias_mw > 0 ? 'text-rose-700' : 'text-teal-700'
                  }`}
                >
                  {formatSignedMw(row.bias_mw)}
                </td>
                <td className="px-4 py-2 text-right font-medium text-rose-800">
                  {formatMw(row.p90_shortfall_mw)}
                </td>
                <td className="px-4 py-2 text-right text-stone-700">
                  {formatMw(row.max_shortfall_mw)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
