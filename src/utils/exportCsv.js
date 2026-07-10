import Papa from "papaparse";
import { ALL_COLUMNS } from "./parseCsv.js";

// Serialize confirmed rows back to the original CSV schema. A UTF-8 BOM is
// prepended so Excel renders Devanagari correctly. Shared by the download and
// the GitHub sync so both produce identical output.
export function serializeConfirmedCsv(rows) {
  const data = rows.map((r) => ({
    id: r.id,
    proverb: r.proverb,
    meaning: r.meaning,
    wrong1: r.wrong1,
    wrong2: r.wrong2,
    wrong3: r.wrong3,
    category: r.category,
  }));

  const csv = Papa.unparse({ fields: ALL_COLUMNS, data });
  return "\uFEFF" + csv;
}

// Serialize confirmed rows and trigger a browser download.
export function downloadConfirmedCsv(rows, filename = "confirmed-proverbs.csv") {
  const blob = new Blob([serializeConfirmedCsv(rows)], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
