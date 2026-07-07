import { downloadConfirmedCsv } from "../utils/exportCsv.js";

export default function SelectedList({ confirmed, onRemove }) {
  return (
    <div className="flex h-full flex-col rounded-2xl bg-white shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 p-4">
        <div>
          <h2 className="font-semibold text-slate-800">Confirmed pairs</h2>
          <p className="text-sm text-slate-500">
            {confirmed.length} selected
          </p>
        </div>
        <button
          onClick={() => downloadConfirmedCsv(confirmed)}
          disabled={confirmed.length === 0}
          className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-900 disabled:opacity-40"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
            <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
          </svg>
          CSV
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {confirmed.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-slate-400">
            Confirmed proverbs will appear here.
          </p>
        ) : (
          <ul className="space-y-2">
            {confirmed.map((row) => (
              <li
                key={row._key}
                className="group rounded-xl border border-slate-100 bg-slate-50 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="flex-1 text-sm font-medium leading-snug text-slate-800 font-devanagari">
                    {row.proverb}
                  </p>
                  <button
                    onClick={() => onRemove(row._key)}
                    title="Remove"
                    className="flex-none rounded-md p-1 text-slate-400 transition hover:bg-red-100 hover:text-red-600"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                    </svg>
                  </button>
                </div>
                <p className="mt-1 text-sm text-emerald-700 font-devanagari">
                  {row.meaning}
                </p>
                {row.category && (
                  <span className="mt-2 inline-block rounded-full bg-white px-2 py-0.5 text-xs text-slate-500 font-devanagari">
                    {row.category}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
