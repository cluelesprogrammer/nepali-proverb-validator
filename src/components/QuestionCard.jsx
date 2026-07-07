const OPTION_LABELS = ["क", "ख", "ग", "घ"];

export default function QuestionCard({ row }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          उखान / Proverb
        </span>
        {row.category && (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 font-devanagari">
            {row.category}
          </span>
        )}
      </div>

      <p className="mb-6 text-2xl font-semibold leading-relaxed text-slate-900 font-devanagari">
        {row.proverb}
      </p>

      <ul className="space-y-3">
        {row.options.map((opt, i) => (
          <li
            key={i}
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 font-devanagari text-lg ${
              opt.correct
                ? "border-emerald-400 bg-emerald-50 text-emerald-900"
                : "border-slate-200 bg-white text-slate-700"
            }`}
          >
            <span
              className={`mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full text-sm font-semibold ${
                opt.correct
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {OPTION_LABELS[i]}
            </span>
            <span className="flex-1">{opt.text}</span>
            {opt.correct && (
              <svg
                className="mt-1 h-5 w-5 flex-none text-emerald-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.5 7.6a1 1 0 0 1-1.42.006l-3.5-3.5a1 1 0 1 1 1.414-1.414l2.79 2.79 6.796-6.89a1 1 0 0 1 1.414-.006Z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
