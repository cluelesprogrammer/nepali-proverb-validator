import { useRef, useState } from "react";
import { parseProverbCsv, ALL_COLUMNS } from "../utils/parseCsv.js";

export default function FileUpload({ onLoaded }) {
  const inputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState([]);
  const [busy, setBusy] = useState(false);

  async function handleFile(file) {
    if (!file) return;
    setBusy(true);
    setErrors([]);
    const { rows, errors } = await parseProverbCsv(file);
    setBusy(false);

    if (rows.length === 0) {
      setErrors(errors.length ? errors : ["No valid rows found in the file."]);
      return;
    }
    onLoaded(rows, errors);
  }

  function onDrop(e) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-4 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Nepali Proverb Validator
        </h1>
        <p className="mt-2 text-slate-600">
          Upload a CSV of proverbs, review each one, and export the confirmed pairs.
        </p>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-white p-12 text-center transition ${
          dragActive
            ? "border-emerald-500 bg-emerald-50"
            : "border-slate-300 hover:border-slate-400"
        }`}
      >
        <svg
          className="mb-3 h-10 w-10 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
          />
        </svg>
        <p className="font-medium text-slate-700">
          {busy ? "Reading file…" : "Click to choose a CSV or drag & drop it here"}
        </p>
        <p className="mt-1 text-sm text-slate-500">Comma-separated, UTF-8, with a header row</p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>

      <div className="mt-6 w-full rounded-xl bg-white p-4 text-sm text-slate-600 shadow-sm">
        <p className="font-medium text-slate-700">Expected columns</p>
        <code className="mt-1 block overflow-x-auto rounded bg-slate-100 px-3 py-2 text-slate-800">
          {ALL_COLUMNS.join(",")}
        </code>
        <p className="mt-2 text-slate-500">
          <span className="font-medium">meaning</span> is the correct answer;{" "}
          <span className="font-medium">wrong1–3</span> are distractors.
        </p>
      </div>

      {errors.length > 0 && (
        <div className="mt-6 w-full rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="mb-1 font-semibold">Could not load the file:</p>
          <ul className="list-inside list-disc space-y-1">
            {errors.slice(0, 8).map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
