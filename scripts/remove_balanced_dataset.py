#!/usr/bin/env python3
"""
Build csv_files/finaldataset_filtered_v2.csv =
    finaldataset_filtered.csv MINUS the rows already used in
    csv_files/balanced_dataset.csv.

Removal is done by id, but only after validating that the proverb text for
that id in balanced_dataset.csv matches the proverb text for the same id in
finaldataset_filtered.csv (whitespace-normalized). Any id that doesn't match
(or isn't found at all) is reported and NOT removed.

Also prints the per-category frequency count of the resulting csv.
"""
import csv
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSV_DIR = ROOT / "csv_files"
SOURCE_PATH = CSV_DIR / "finaldataset_filtered.csv"
EXCLUDE_PATH = CSV_DIR / "balanced_dataset.csv"
OUTPUT_PATH = CSV_DIR / "finaldataset_filtered_v2.csv"


def normalize(text):
    return " ".join((text or "").split())


def load_rows(path):
    with path.open(newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        return list(reader), reader.fieldnames


def main():
    source_rows, source_fields = load_rows(SOURCE_PATH)
    exclude_rows, _ = load_rows(EXCLUDE_PATH)

    source_by_id = {row["id"]: row for row in source_rows}

    ids_to_remove = set()
    mismatches = []
    not_found = []

    for row in exclude_rows:
        rid = row["id"]
        source_row = source_by_id.get(rid)
        if source_row is None:
            not_found.append(rid)
            continue
        if normalize(source_row["proverb"]) != normalize(row["proverb"]):
            mismatches.append(rid)
            continue
        ids_to_remove.add(rid)

    print(f"{SOURCE_PATH.name} rows:        {len(source_rows)}")
    print(f"{EXCLUDE_PATH.name} rows:       {len(exclude_rows)}")
    print(f"Validated for removal:          {len(ids_to_remove)}")
    print(f"Mismatched proverb text:        {len(mismatches)} {mismatches}")
    print(f"Id not found in source:         {len(not_found)} {not_found}")

    filtered_rows = [row for row in source_rows if row["id"] not in ids_to_remove]
    print(f"Output rows (filtered):         {len(filtered_rows)}")

    with OUTPUT_PATH.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=source_fields)
        writer.writeheader()
        writer.writerows(filtered_rows)

    print(f"Wrote {OUTPUT_PATH}\n")

    counts = Counter((row["category"] or "Uncategorized") for row in filtered_rows)
    print("Category frequency counts:")
    for cat, n in sorted(counts.items(), key=lambda kv: (-kv[1], kv[0])):
        print(f"  {cat}: {n}")
    print(f"  TOTAL: {sum(counts.values())}")


if __name__ == "__main__":
    main()
