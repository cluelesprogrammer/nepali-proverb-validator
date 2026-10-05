#!/usr/bin/env python3
"""
Build csv_files/balanced_150_dataset.csv: up to 150 rows per category,
randomly sampled from finaldataset_filtered_v2.csv. If a category has
fewer than 150 rows available, all of its rows are included (and this is
reported, not silently padded).

Deterministic (fixed seed) so the sample is reproducible.
"""
import csv
import random
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSV_DIR = ROOT / "csv_files"
SOURCE_PATH = CSV_DIR / "finaldataset_filtered_v2.csv"
OUTPUT_PATH = CSV_DIR / "balanced_150_dataset.csv"

PER_CATEGORY = 150
SEED = 42


def load_rows(path):
    with path.open(newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        return list(reader), reader.fieldnames


def main():
    rows, fields = load_rows(SOURCE_PATH)

    by_category = defaultdict(list)
    for row in rows:
        by_category[row["category"] or "Uncategorized"].append(row)

    rng = random.Random(SEED)
    selected = []
    for category, cat_rows in by_category.items():
        if len(cat_rows) <= PER_CATEGORY:
            print(f"  {category}: only {len(cat_rows)} available, taking all")
            selected.extend(cat_rows)
        else:
            selected.extend(rng.sample(cat_rows, PER_CATEGORY))

    # Stable, readable ordering: by category then id.
    selected.sort(key=lambda r: (r["category"], int(r["id"])))

    with OUTPUT_PATH.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        writer.writerows(selected)

    print(f"\nWrote {OUTPUT_PATH} -> {len(selected)} rows\n")

    counts = Counter(r["category"] for r in selected)
    print("Category frequency counts:")
    for cat, n in sorted(counts.items(), key=lambda kv: (-kv[1], kv[0])):
        print(f"  {cat}: {n}")
    print(f"  TOTAL: {sum(counts.values())}")


if __name__ == "__main__":
    main()
