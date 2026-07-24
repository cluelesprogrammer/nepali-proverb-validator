import { useEffect, useMemo, useState } from "react";
import { listJobIds, fetchJobCsv, getRepoInfo } from "../utils/githubJobs.js";
import { parseProverbCsv } from "../utils/parseCsv.js";

// Lets a reviewer pick one of the synced jobs by id and inspect it: a per-category
// breakdown of how many proverbs were selected, plus a collapsible list of the
// selected proverbs themselves.
export default function JobsViewer() {
  const [jobIds, setJobIds] = useState([]);
  const [listStatus, setListStatus] = useState("loading"); // loading | ready | error
  const [listError, setListError] = useState(null);

  const [selectedId, setSelectedId] = useState("");
  const [manualId, setManualId] = useState("");

  const [rows, setRows] = useState([]);
  const [loadStatus, setLoadStatus] = useState("idle"); // idle | loading | ready | error
  const [loadError, setLoadError] = useState(null);

  const { repo, branch } = getRepoInfo();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setListStatus("loading");
      setListError(null);
      try {
        const ids = await listJobIds();
        if (cancelled) return;
        setJobIds(ids);
        setListStatus("ready");
      } catch (err) {
        if (cancelled) return;
        setListError(err.message ?? String(err));
        setListStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function loadJob(id) {
    const jobId = (id ?? "").trim();
    if (!jobId) return;
    setSelectedId(jobId);
    setLoadStatus("loading");
    setLoadError(null);
    setRows([]);
    try {
      const csv = await fetchJobCsv(jobId);
      const { rows: parsed, errors } = await parseProverbCsv(csv);
      if (parsed.length === 0) {
        throw new Error(
          errors.length ? errors.join(" ") : "No valid rows found for this job."
        );
      }
      setRows(parsed);
      setLoadStatus("ready");
    } catch (err) {
      setLoadError(err.message ?? String(err));
      setLoadStatus("error");
    }
  }

  // Per-category counts for the loaded job, largest first.
  const categoryCounts = useMemo(() => {
    const counts = new Map();
    for (const row of rows) {
      const cat = row.category || "Uncategorized";
      counts.set(cat, (counts.get(cat) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category));
  }, [rows]);

  const maxCount = categoryCounts.reduce((m, c) => Math.max(m, c.count), 0) || 1;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* --- Job picker --- */}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">Browse collected jobs</h2>
        <p className="mt-1 text-sm text-slate-500">
          Reading from{" "}
          <span className="font-medium text-slate-600">
            {repo}@{branch}
          </span>
          .
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">
              Job id
            </label>
            <select
              value={jobIds.includes(selectedId) ? selectedId : ""}
              onChange={(e) => loadJob(e.target.value)}
              disabled={listStatus !== "ready" || jobIds.length === 0}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 disabled:opacity-50"
            >
              <option value="">
                {listStatus === "loading"
                  ? "Loading jobs…"
                  : jobIds.length === 0
                    ? "No jobs found"
                    : "Select a job…"}
              </option>
              {jobIds.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2">
            <div className="flex-1 sm:w-56">
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">
                …or load by id
              </label>
              <input
                type="text"
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") loadJob(manualId);
                }}
                placeholder="paste job id"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
              />
            </div>
            <button
              onClick={() => loadJob(manualId)}
              disabled={!manualId.trim()}
              className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-900 disabled:opacity-40"
            >
              Load
            </button>
          </div>
        </div>

        {listStatus === "error" && (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-2 text-sm text-amber-800">
            Could not list jobs: {listError} You can still paste a job id above.
          </p>
        )}
      </div>

      {/* --- Loaded job details --- */}
      {loadStatus === "loading" && (
        <div className="rounded-2xl bg-white p-6 text-center text-slate-500 shadow-sm">
          Loading job <span className="font-medium">{selectedId}</span>…
        </div>
      )}

      {loadStatus === "error" && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800 shadow-sm">
          <p className="font-semibold">Could not load this job:</p>
          <p className="mt-1">{loadError}</p>
        </div>
      )}

      {loadStatus === "ready" && (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-3xl font-bold text-emerald-600">{rows.length}</p>
              <p className="text-sm text-slate-500">Proverbs selected</p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-3xl font-bold text-slate-800">{categoryCounts.length}</p>
              <p className="text-sm text-slate-500">Categories covered</p>
            </div>
          </div>

          {/* Per-category breakdown */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-semibold text-slate-800">Selected by category</h3>
            <ul className="space-y-3">
              {categoryCounts.map((c) => (
                <li key={c.category}>
                  <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                    <span className="truncate text-slate-700 font-devanagari" title={c.category}>
                      {c.category}
                    </span>
                    <span className="flex-none tabular-nums font-semibold text-emerald-600">
                      {c.count}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${(c.count / maxCount) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Collapsible list of selected proverbs */}
          <details open className="rounded-2xl bg-white p-6 shadow-sm">
            <summary className="cursor-pointer select-none font-semibold text-slate-800">
              Selected proverbs ({rows.length})
            </summary>
            <ul className="mt-4 space-y-2">
              {rows.map((row) => (
                <li key={row._key}>
                  <details className="group rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <summary className="flex cursor-pointer select-none items-start justify-between gap-2">
                      <span className="flex-1 text-sm font-medium leading-snug text-slate-800 font-devanagari">
                        {row.proverb}
                      </span>
                      {row.category && (
                        <span className="flex-none rounded-full bg-white px-2 py-0.5 text-xs text-slate-500 font-devanagari">
                          {row.category}
                        </span>
                      )}
                    </summary>
                    <p className="mt-2 text-sm text-emerald-700 font-devanagari">
                      {row.meaning}
                    </p>
                  </details>
                </li>
              ))}
            </ul>
          </details>
        </>
      )}
    </div>
  );
}
