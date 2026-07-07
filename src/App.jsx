import { useMemo, useState } from "react";
import FileUpload from "./components/FileUpload.jsx";
import QuestionCard from "./components/QuestionCard.jsx";
import ReviewControls from "./components/ReviewControls.jsx";
import SelectedList from "./components/SelectedList.jsx";
import Summary from "./components/Summary.jsx";

export default function App() {
  const [stage, setStage] = useState("upload"); // "upload" | "review" | "done"
  const [rows, setRows] = useState([]);
  const [index, setIndex] = useState(0);
  const [confirmed, setConfirmed] = useState([]);
  const [declinedKeys, setDeclinedKeys] = useState([]);
  const [warnings, setWarnings] = useState([]);

  const current = rows[index];
  const confirmedCount = confirmed.length;

  function handleLoaded(loadedRows, loadErrors) {
    setRows(loadedRows);
    setWarnings(loadErrors ?? []);
    setIndex(0);
    setConfirmed([]);
    setDeclinedKeys([]);
    setStage("review");
  }

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
    setStage("upload");
    setRows([]);
    setIndex(0);
    setConfirmed([]);
    setDeclinedKeys([]);
    setWarnings([]);
  }

  const warningBanner = useMemo(() => {
    if (warnings.length === 0) return null;
    return (
      <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        <span className="font-semibold">{warnings.length}</span> row
        {warnings.length === 1 ? "" : "s"} were skipped during import.
      </div>
    );
  }, [warnings]);

  if (stage === "upload") {
    return <FileUpload onLoaded={handleLoaded} />;
  }

  if (stage === "done") {
    return (
      <Summary
        confirmed={confirmed}
        declinedCount={declinedKeys.length}
        total={rows.length}
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
          <button
            onClick={handleRestart}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100"
          >
            New file
          </button>
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

        <aside className="h-[32rem] lg:sticky lg:top-6 lg:h-[calc(100vh-6rem)]">
          <SelectedList confirmed={confirmed} onRemove={handleRemove} />
        </aside>
      </main>
    </div>
  );
}
