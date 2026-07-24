import { serializeConfirmedCsv } from "./exportCsv.js";

// Configuration is injected at build time via Vite env vars. When the token or
// repo is missing (e.g. local `npm run dev` without secrets) the sync becomes a
// no-op so the app still runs normally.
const REPO = import.meta.env.VITE_GH_REPO; // "owner/repo"
const TOKEN = import.meta.env.VITE_GH_TOKEN;
// Confirmed answers are synced straight to the deployment branch (main by
// default) so all collected data lives in one place. Override with
// VITE_GH_BRANCH if you ever need to point the sync elsewhere.
const BRANCH = import.meta.env.VITE_GH_BRANCH || "main";

const API = "https://api.github.com";

export function isSyncEnabled() {
  return Boolean(REPO && TOKEN);
}

function headers() {
  return {
    Authorization: `Bearer ${TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

// Encode a UTF-8 string to base64 so multibyte (Devanagari) text survives.
function toBase64Utf8(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

let branchEnsured = false;

// Make sure the target branch exists, creating it from `main` if necessary.
// Runs at most once per session (subsequent calls short-circuit).
async function ensureBranch() {
  if (branchEnsured) return;

  const refRes = await fetch(
    `${API}/repos/${REPO}/git/refs/heads/${BRANCH}`,
    { headers: headers() }
  );

  if (refRes.ok) {
    branchEnsured = true;
    return;
  }
  if (refRes.status !== 404) {
    throw new Error(`Failed to check branch ${BRANCH}: ${refRes.status}`);
  }

  // Branch missing: base it off main's current commit.
  const mainRes = await fetch(
    `${API}/repos/${REPO}/git/refs/heads/main`,
    { headers: headers() }
  );
  if (!mainRes.ok) {
    throw new Error(`Failed to read main ref: ${mainRes.status}`);
  }
  const mainRef = await mainRes.json();
  const baseSha = mainRef.object.sha;

  const createRes = await fetch(`${API}/repos/${REPO}/git/refs`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ ref: `refs/heads/${BRANCH}`, sha: baseSha }),
  });
  // 422 = ref already exists (created concurrently); treat as success.
  if (!createRes.ok && createRes.status !== 422) {
    throw new Error(`Failed to create branch ${BRANCH}: ${createRes.status}`);
  }
  branchEnsured = true;
}

// Commit the confirmed rows to jobs/{sessionId}/selected_answers.csv on the
// sync branch (main by default). Returns { sha, content } to cache for the next call so we can
// (a) skip unchanged saves and (b) supply the sha required to update the file.
export async function commitSelectedAnswers({
  sessionId,
  rows,
  lastSha,
  lastContent,
}) {
  if (!isSyncEnabled()) return { sha: lastSha, content: lastContent };
  if (!rows || rows.length === 0) return { sha: lastSha, content: lastContent };

  const content = serializeConfirmedCsv(rows);
  if (content === lastContent) return { sha: lastSha, content: lastContent };

  await ensureBranch();

  const path = `jobs/${sessionId}/selected_answers.csv`;
  const body = {
    message: `chore(data): session ${sessionId} @ ${new Date().toISOString()}`,
    content: toBase64Utf8(content),
    branch: BRANCH,
  };
  if (lastSha) body.sha = lastSha;

  const res = await fetch(
    `${API}/repos/${REPO}/contents/${path}`,
    { method: "PUT", headers: headers(), body: JSON.stringify(body) }
  );
  if (!res.ok) {
    throw new Error(`Failed to commit ${path}: ${res.status}`);
  }
  const json = await res.json();
  return { sha: json.content?.sha ?? lastSha, content };
}
