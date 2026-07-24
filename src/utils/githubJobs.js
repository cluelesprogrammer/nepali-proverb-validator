// Read-side helpers for the Jobs viewer. These fetch the synced job folders and
// their selected_answers.csv files straight from the repository via the GitHub
// Contents API, so the viewer always reflects the latest committed data (rather
// than whatever was bundled at build time).

// Repo/branch/token are injected at build time. Fall back to sensible defaults
// so the viewer also works during local `npm run dev`.
const REPO = import.meta.env.VITE_GH_REPO || "cluelesprogrammer/nepali-proverb-validator";
const BRANCH = import.meta.env.VITE_GH_BRANCH || "main";
const TOKEN = import.meta.env.VITE_GH_TOKEN;

const API = "https://api.github.com";

export function getRepoInfo() {
  return { repo: REPO, branch: BRANCH };
}

function readHeaders() {
  const h = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  // A token is optional for public repos but raises the rate limit and is
  // required for private ones. Reuse the sync token when it is available.
  if (TOKEN) h.Authorization = `Bearer ${TOKEN}`;
  return h;
}

// Decode a base64 string (as returned by the Contents API) back into UTF-8 so
// multibyte Devanagari text is preserved.
function fromBase64Utf8(b64) {
  const binary = atob(b64.replace(/\s/g, ""));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

// List the available job ids (the sub-directories under jobs/).
export async function listJobIds() {
  const res = await fetch(`${API}/repos/${REPO}/contents/jobs?ref=${BRANCH}`, {
    headers: readHeaders(),
  });
  if (res.status === 404) return []; // no jobs synced yet
  if (!res.ok) {
    throw new Error(`Could not list jobs (HTTP ${res.status}).`);
  }
  const items = await res.json();
  if (!Array.isArray(items)) return [];
  return items
    .filter((i) => i.type === "dir")
    .map((i) => i.name)
    .sort();
}

// Fetch the raw selected_answers.csv content for a single job id.
export async function fetchJobCsv(jobId) {
  const path = `jobs/${encodeURIComponent(jobId)}/selected_answers.csv`;
  const res = await fetch(`${API}/repos/${REPO}/contents/${path}?ref=${BRANCH}`, {
    headers: readHeaders(),
  });
  if (res.status === 404) {
    throw new Error(`No selected_answers.csv found for job "${jobId}".`);
  }
  if (!res.ok) {
    throw new Error(`Could not load job "${jobId}" (HTTP ${res.status}).`);
  }
  const json = await res.json();
  if (!json.content) {
    throw new Error(`Job "${jobId}" returned no file content.`);
  }
  return fromBase64Utf8(json.content);
}
