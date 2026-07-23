// Shows, per category, how many proverbs the reviewer has confirmed so far,
// alongside how many exist in the loaded dataset. Gives a running count plus a
// bar so the reviewer can see the balance across categories at a glance.
export default function CategoryProgress({ stats, totalConfirmed }) {
  if (!stats || stats.length === 0) return null;

  const maxTotal = stats.reduce((m, s) => Math.max(m, s.total), 0) || 1;

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold text-slate-800">By category</h2>
        <span className="text-sm text-slate-500">
          <span className="font-semibold text-emerald-600">{totalConfirmed}</span> confirmed
        </span>
      </div>

      <ul className="space-y-3">
        {stats.map((s) => {
          const pct = s.total > 0 ? (s.confirmed / s.total) * 100 : 0;
          const width = (s.total / maxTotal) * 100;
          return (
            <li key={s.category}>
              <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                <span className="truncate text-slate-700 font-devanagari" title={s.category}>
                  {s.category}
                </span>
                <span className="flex-none tabular-nums text-slate-500">
                  <span className="font-semibold text-emerald-600">{s.confirmed}</span>
                  {" / "}
                  {s.total}
                </span>
              </div>
              {/* Track width is scaled to the largest category so counts stay comparable. */}
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-slate-200"
                  style={{ width: `${width}%` }}
                >
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
