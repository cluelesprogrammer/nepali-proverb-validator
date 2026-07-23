import { downloadConfirmedCsv } from "../utils/exportCsv.js";
import SelectedList from "./SelectedList.jsx";
import CategoryProgress from "./CategoryProgress.jsx";

export default function Summary({
  confirmed,
  declinedCount,
  total,
  categoryStats,
  onRemove,
  onRestart,
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          <svg className="h-8 w-8 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.5 7.6a1 1 0 0 1-1.42.006l-3.5-3.5a1 1 0 1 1 1.414-1.414l2.79 2.79 6.796-6.89a1 1 0 0 1 1.414-.006Z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Review complete</h1>
        <p className="mt-2 text-slate-600">
          You reviewed {total} proverb{total === 1 ? "" : "s"}.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-emerald-50 p-4">
            <p className="text-3xl font-bold text-emerald-600">{confirmed.length}</p>
            <p className="text-sm text-emerald-700">Confirmed</p>
          </div>
          <div className="rounded-xl bg-red-50 p-4">
            <p className="text-3xl font-bold text-red-500">{declinedCount}</p>
            <p className="text-sm text-red-600">Declined</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            onClick={() => downloadConfirmedCsv(confirmed)}
            disabled={confirmed.length === 0}
            className="rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-40"
          >
            Download confirmed CSV
          </button>
          <button
            onClick={onRestart}
            className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Start over
          </button>
        </div>
      </div>

      {categoryStats && categoryStats.length > 0 && (
        <div className="mt-6">
          <CategoryProgress stats={categoryStats} totalConfirmed={confirmed.length} />
        </div>
      )}

      <div className="mt-6 h-[28rem]">
        <SelectedList confirmed={confirmed} onRemove={onRemove} />
      </div>
    </div>
  );
}
