#!/usr/bin/env python3
"""
Add ALL "Hard Work and Perseverance" and "Wisdom and Knowledge" rows from
finaldataset.csv (the original dataset) into finaldataset_filtered_v2.csv,
restoring those two categories to their full original counts while leaving
every other category untouched. Existing rows (already present by id) are
kept as-is and not duplicated.

Prints the resulting per-category frequency count.
"""
import csv
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSV_DIR = ROOT / "csv_files"
TARGET_PATH = CSV_DIR / "finaldataset_filtered_v2.csv"
SOURCE_PATH = CSV_DIR / "finaldataset.csv"

CATEGORIES_TO_RESTORE = {"Hard Work and Perseverance", "Wisdom and Knowledge"}


def load_rows(path):
    with path.open(newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        return list(reader), reader.fieldnames


def main():
    target_rows, target_fields = load_rows(TARGET_PATH)
    source_rows, _ = load_rows(SOURCE_PATH)

    target_ids = {row["id"] for row in target_rows}

    to_add = [
        row
        for row in source_rows
        if row["category"] in CATEGORIES_TO_RESTORE and row["id"] not in target_ids
    ]

    print(f"Existing rows in {TARGET_PATH.name}: {len(target_rows)}")
    print(f"Rows to add (not already present): {len(to_add)}")

    combined_rows = target_rows + to_add

    with TARGET_PATH.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=target_fields)
        writer.writeheader()
        writer.writerows(combined_rows)

    print(f"Updated {TARGET_PATH} -> {len(combined_rows)} rows\n")

    counts = Counter((row["category"] or "Uncategorized") for row in combined_rows)
    print("Category frequency counts:")
    for cat, n in sorted(counts.items(), key=lambda kv: (-kv[1], kv[0])):
        print(f"  {cat}: {n}")
    print(f"  TOTAL: {sum(counts.values())}")


if __name__ == "__main__":
    main()
