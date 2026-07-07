export default function ReviewControls({
  index,
  total,
  confirmedCount,
  canGoBack,
  onConfirm,
  onDecline,
  onBack,
}) {
  const progress = total > 0 ? ((index) / total) * 100 : 0;

  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center justify-between text-sm text-slate-500">
        <span>
          Question <span className="font-semibold text-slate-700">{index + 1}</span> / {total}
        </span>
        <span>
          <span className="font-semibold text-emerald-600">{confirmedCount}</span> confirmed
        </span>
      </div>

      <div className="mb-5 h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onDecline}
          className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-3 font-semibold text-red-600 transition hover:bg-red-50"
        >
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
          Decline
        </button>
        <button
          onClick={onConfirm}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-white transition hover:bg-emerald-600"
        >
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.5 7.6a1 1 0 0 1-1.42.006l-3.5-3.5a1 1 0 1 1 1.414-1.414l2.79 2.79 6.796-6.89a1 1 0 0 1 1.414-.006Z"
              clipRule="evenodd"
            />
          </svg>
          Confirm
        </button>
      </div>

      <button
        onClick={onBack}
        disabled={!canGoBack}
        className="mt-3 w-full rounded-xl px-4 py-2 text-sm font-medium text-slate-500 transition enabled:hover:bg-slate-100 disabled:opacity-40"
      >
        ← Back to previous
      </button>
    </div>
  );
}
