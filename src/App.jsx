import { useEffect, useMemo, useRef, useState } from "react";
import QuestionCard from "./components/QuestionCard.jsx";
import ReviewControls from "./components/ReviewControls.jsx";
import SelectedList from "./components/SelectedList.jsx";
import CategoryProgress from "./components/CategoryProgress.jsx";
import Summary from "./components/Summary.jsx";
import JobsViewer from "./components/JobsViewer.jsx";
import { parseProverbCsv, shuffle } from "./utils/parseCsv.js";
import { commitSelectedAnswers, isSyncEnabled } from "./utils/githubSync.js";
// The dataset ships with the app; it is read from the repo at build time so the
// reviewer does not have to upload anything. We use a category-balanced subset
// (150 proverbs per category, plus all of the small Nature and Environment set)
// rather than the full finaldataset.
import datasetCsv from "../csv_files/balanced_dataset.csv?raw";

const SAVE_INTERVAL_MS = 90 * 1000;

// One stable session id per browser tab session; a reload keeps the same file,
// a new tab/session gets its own file.
function getSessionId() {
  const KEY = "npv-session-id";
  let id = sessionStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(KEY, id);
  }
  return id;
}

function readViewFromHash() {
  if (typeof window === "undefined") return "review";
  return window.location.hash.replace(/^#\/?/, "") === "jobs" ? "jobs" : "review";
}

export default function App() {
  const [view, setView] = useState(readViewFromHash); // "review" | "jobs"
  const [stage, setStage] = useState("loading"); // "loading" | "review" | "done" | "error"
  const [rows, setRows] = useState([]);
  const [index, setIndex] = useState(0);
  const [confirmed, setConfirmed] = useState([]);
  const [declinedKeys, setDeclinedKeys] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [loadError, setLoadError] = useState(null);

  const current = rows[index];
  const confirmedCount = confirmed.length;

  // Keep the active view in sync with the URL hash so a view is shareable and
  // survives reloads (#jobs shows the jobs viewer, anything else is review).
  useEffect(() => {
    const onHash = () => setView(readViewFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  function goToView(next) {
    window.location.hash = next === "jobs" ? "jobs" : "";
    setView(next);
  }

  // --- Background sync of confirmed rows to GitHub every 90s ---
  const sessionIdRef = useRef(null);
  const confirmedRef = useRef(confirmed);
  const syncStateRef = useRef({ sha: undefined, content: undefined });
  const syncingRef = useRef(false);

  confirmedRef.current = confirmed;

  useEffect(() => {
    if (!isSyncEnabled()) return;
    sessionIdRef.current = getSessionId();

    async function save() {
      if (syncingRef.current) return; // avoid overlapping requests
      syncingRef.current = true;
      try {
        const next = await commitSelectedAnswers({
          sessionId: sessionIdRef.current,
          rows: confirmedRef.current,
          lastSha: syncStateRef.current.sha,
          lastContent: syncStateRef.current.content,
        });
        syncStateRef.current = next;
      } catch (err) {
        console.warn("Selected-answers sync failed:", err);
      } finally {
        syncingRef.current = false;
      }
    }

    const timer = setInterval(save, SAVE_INTERVAL_MS);
    const onUnload = () => {
      save();
    };
    window.addEventListener("beforeunload", onUnload);

    return () => {
      clearInterval(timer);
      window.removeEventListener("beforeunload", onUnload);
      // Best-effort final save when unmounting.
      save();
    };
  }, []);

  // Trigger a save as soon as the review is finished.
  useEffect(() => {
    if (stage !== "done" || !isSyncEnabled()) return;
    commitSelectedAnswers({
      sessionId: sessionIdRef.current ?? getSessionId(),
      rows: confirmedRef.current,
      lastSha: syncStateRef.current.sha,
      lastContent: syncStateRef.current.content,
    })
      .then((next) => {
        syncStateRef.current = next;
      })
      .catch((err) => console.warn("Selected-answers sync failed:", err));
  }, [stage]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { rows: loadedRows, errors } = await parseProverbCsv(datasetCsv);
      if (cancelled) return;
      if (loadedRows.length === 0) {
        setLoadError(
          errors.length ? errors.join(" ") : "No valid rows found in the dataset."
        );
        setStage("error");
        return;
      }
      // Present the question/answer pairs in a random order rather than the
      // fixed order they appear in the CSV.
      setRows(shuffle(loadedRows));
      setWarnings(errors ?? []);
      setIndex(0);
      setConfirmed([]);
      setDeclinedKeys([]);
      setStage("review");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function advance() {
    if (index + 1 >= rows.length) {
      setStage("done");
    } else {
      setIndex(index + 1);
    }
  }

  function handleConfirm() {
    setConfirmed((prev) =>
      prev.some((r) => r._key === current._key) ? prev : [...prev, current]
    );
    setDeclinedKeys((prev) => prev.filter((k) => k !== current._key));
    advance();
  }

  function handleDecline() {
    setConfirmed((prev) => prev.filter((r) => r._key !== current._key));
    setDeclinedKeys((prev) =>
      prev.includes(current._key) ? prev : [...prev, current._key]
    );
    advance();
  }

  function handleBack() {
    if (index === 0) return;
    const prevRow = rows[index - 1];
    // Clear the previous decision so it can be re-reviewed.
    setConfirmed((prev) => prev.filter((r) => r._key !== prevRow._key));
    setDeclinedKeys((prev) => prev.filter((k) => k !== prevRow._key));
    setIndex(index - 1);
  }

  function handleRemove(key) {
    setConfirmed((prev) => prev.filter((r) => r._key !== key));
  }

  function handleRestart() {
    if (rows.length > 0) setRows((prev) => shuffle(prev));
    setIndex(0);
    setConfirmed([]);
    setDeclinedKeys([]);
    setStage(rows.length > 0 ? "review" : "loading");
  }

  // Per-category running counts: how many proverbs exist in the loaded dataset
  // vs. how many the reviewer has confirmed so far.
  const categoryStats = useMemo(() => {
    const totals = new Map();
    for (const row of rows) {
      const cat = row.category || "Uncategorized";
      totals.set(cat, (totals.get(cat) ?? 0) + 1);
    }
    const confirmedByCat = new Map();
    for (const row of confirmed) {
      const cat = row.category || "Uncategorized";
      confirmedByCat.set(cat, (confirmedByCat.get(cat) ?? 0) + 1);
    }
    return Array.from(totals.entries())
      .map(([category, total]) => ({
        category,
        total,
        confirmed: confirmedByCat.get(category) ?? 0,
      }))
      .sort((a, b) => b.total - a.total || a.category.localeCompare(b.category));
  }, [rows, confirmed]);

  const warningBanner = useMemo(() => {
    if (warnings.length === 0) return null;
    return (
      <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        <span className="font-semibold">{warnings.length}</span> row
        {warnings.length === 1 ? "" : "s"} were skipped during import.
      </div>
    );
  }, [warnings]);

  if (view === "jobs") {
    return (
      <div className="min-h-screen">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <h1 className="text-lg font-bold text-slate-900">Nepali Proverb Validator</h1>
            <nav className="flex items-center gap-1">
              <button
                onClick={() => goToView("review")}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100"
              >
                Review
              </button>
              <button
                onClick={() => goToView("jobs")}
                className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-800"
              >
                Jobs
              </button>
            </nav>
          </div>
        </header>
        <main className="px-4 py-6">
          <JobsViewer />
        </main>
      </div>
    );
  }

  if (stage === "loading") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Nepali Proverb Validator
        </h1>
        <p className="mt-3 text-slate-600">Loading proverbs…</p>
      </div>
    );
  }

  if (stage === "error") {
    return (
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-4 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Nepali Proverb Validator
        </h1>
        <div className="mt-6 w-full rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="mb-1 font-semibold">Could not load the dataset:</p>
          <p>{loadError}</p>
        </div>
      </div>
    );
  }

  if (stage === "done") {
    return (
      <Summary
        confirmed={confirmed}
        declinedCount={declinedKeys.length}
        total={rows.length}
        categoryStats={categoryStats}
        onRemove={handleRemove}
        onRestart={handleRestart}
      />
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold text-slate-900">Nepali Proverb Validator</h1>
          <nav className="flex items-center gap-1">
            <button
              onClick={() => goToView("jobs")}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100"
            >
              Jobs
            </button>
            <button
              onClick={handleRestart}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100"
            >
              Restart
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[1fr_22rem]">
        <section>
          {warningBanner}
          {current && <QuestionCard row={current} />}
          <ReviewControls
            index={index}
            total={rows.length}
            confirmedCount={confirmedCount}
            canGoBack={index > 0}
            onConfirm={handleConfirm}
            onDecline={handleDecline}
            onBack={handleBack}
          />
        </section>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
          <CategoryProgress stats={categoryStats} totalConfirmed={confirmedCount} />
          <div className="h-[32rem]">
            <SelectedList confirmed={confirmed} onRemove={handleRemove} />
          </div>
        </aside>
      </main>
    </div>
  );
}
