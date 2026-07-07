import Papa from "papaparse";

export const REQUIRED_COLUMNS = ["proverb", "meaning", "wrong1", "wrong2", "wrong3"];
export const ALL_COLUMNS = ["id", "proverb", "meaning", "wrong1", "wrong2", "wrong3", "category"];

// Fisher-Yates shuffle returning a new array.
export function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Build the shuffled 4-option list for a row. Each option keeps track of
// whether it is the correct one (the `meaning`).
export function buildOptions(row) {
  const options = [
    { text: row.meaning, correct: true },
    { text: row.wrong1, correct: false },
    { text: row.wrong2, correct: false },
    { text: row.wrong3, correct: false },
  ];
  return shuffle(options);
}

// Parses a CSV File object and resolves with { rows, errors }.
// - rows: normalized, valid question rows (each with a stable id + shuffled options)
// - errors: human-readable messages about skipped rows / structural problems
export function parseProverbCsv(file) {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (h) => h.trim().toLowerCase(),
      complete: (results) => {
        const errors = [];
        const headerFields = results.meta.fields ?? [];

        const missingCols = REQUIRED_COLUMNS.filter((c) => !headerFields.includes(c));
        if (missingCols.length > 0) {
          resolve({
            rows: [],
            errors: [
              `Missing required column(s): ${missingCols.join(", ")}. ` +
                `Expected header: ${ALL_COLUMNS.join(", ")}`,
            ],
          });
          return;
        }

        const rows = [];
        results.data.forEach((raw, index) => {
          const lineNo = index + 2; // +1 for header, +1 for 1-based
          const row = {
            id: (raw.id ?? "").trim(),
            proverb: (raw.proverb ?? "").trim(),
            meaning: (raw.meaning ?? "").trim(),
            wrong1: (raw.wrong1 ?? "").trim(),
            wrong2: (raw.wrong2 ?? "").trim(),
            wrong3: (raw.wrong3 ?? "").trim(),
            category: (raw.category ?? "").trim(),
          };

          const missingFields = REQUIRED_COLUMNS.filter((c) => !row[c]);
          if (missingFields.length > 0) {
            errors.push(`Row ${lineNo}: skipped (empty ${missingFields.join(", ")}).`);
            return;
          }

          if (!row.id) row.id = `row-${lineNo}`;

          rows.push({
            ...row,
            _key: `${row.id}-${index}`,
            options: buildOptions(row),
          });
        });

        if (rows.length === 0 && errors.length === 0) {
          errors.push("No data rows found in the file.");
        }

        resolve({ rows, errors });
      },
      error: (err) => {
        resolve({ rows: [], errors: [`Could not read file: ${err.message}`] });
      },
    });
  });
}
