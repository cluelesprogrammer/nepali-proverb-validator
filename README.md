# Nepali Proverb Validator

A small, browser-only web app for **data collection and validation** of a Nepali proverb multiple-choice dataset. Upload a CSV, review each proverb with its correct meaning highlighted in green (among three distractors), **Confirm** or **Decline** each item, and export the confirmed rows back to CSV.

Everything runs in the browser — there is **no backend** — so it deploys to GitHub Pages for free.

## Features

- Upload a comma-separated CSV (UTF-8, with header row).
- One proverb shown at a time with four answer options; the correct meaning is always highlighted green.
- Options are shuffled so the correct answer is not always in the same position.
- Confirm / Decline / Back controls with a progress bar.
- A live **running list** of confirmed pairs, with per-item remove and a download button available at any time.
- Export confirmed rows as `confirmed-proverbs.csv` (preserves the original columns, includes a UTF-8 BOM so Excel renders Nepali correctly).

## CSV format

Comma-separated, UTF-8, **with a header row**:

```
id,proverb,meaning,wrong1,wrong2,wrong3,category
```

| Column     | Meaning                                             |
| ---------- | --------------------------------------------------- |
| `id`       | Optional identifier (auto-generated if blank)       |
| `proverb`  | The proverb (the question)                          |
| `meaning`  | The **correct** answer                              |
| `wrong1-3` | Three distractor answers                            |
| `category` | Optional label shown as a badge, carried to export  |

A ready-to-try example lives at [`public/sample-proverbs.csv`](public/sample-proverbs.csv).

## Run locally

```bash
npm install
npm run dev
```

Then open the printed local URL and upload a CSV (or the sample file).

## Build

```bash
npm run build      # outputs static files to dist/
npm run preview    # preview the production build
```

## Deploy to GitHub Pages

1. Push this repo to GitHub. If your repo name is **not** `nepali-proverb-validator`, update `base` in [`vite.config.js`](vite.config.js) to `/<your-repo-name>/` (or set the `BASE_PATH` env var at build time).
2. In the repo, go to **Settings -> Pages** and set **Source** to **GitHub Actions**.
3. Push to `main`. The workflow in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) builds the app and publishes it.
4. The app will be live at `https://<your-user>.github.io/<your-repo>/`.

## Tech stack

React + Vite, Tailwind CSS, PapaParse, and Noto Sans Devanagari for Nepali text.
