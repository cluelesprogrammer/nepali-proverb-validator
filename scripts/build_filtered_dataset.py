#!/usr/bin/env python3
"""
Build csv_files/finaldataset_filtered.csv = finaldataset.csv MINUS the rows
already used in csv_files/N_200_balanced.csv.

Removal is done by id, but only after validating that the proverb text for
that id in N_200_balanced.csv matches the proverb text for the same id in
finaldataset.csv (whitespace-normalized). Any id that doesn't match (or
isn't found at all) is reported and NOT removed, so it's never silently
dropped.
"""
import csv
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSV_DIR = ROOT / "csv_files"
FINAL_PATH = CSV_DIR / "finaldataset.csv"
EXCLUDE_PATH = CSV_DIR / "N_200_balanced.csv"
OUTPUT_PATH = CSV_DIR / "finaldataset_filtered.csv"


def normalize(text):
    return " ".join((text or "").split())


def load_rows(path):
    with path.open(newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        return list(reader), reader.fieldnames


def main():
    final_rows, final_fields = load_rows(FINAL_PATH)
    exclude_rows, exclude_fields = load_rows(EXCLUDE_PATH)

    final_by_id = {row["id"]: row for row in final_rows}

    ids_to_remove = set()
    mismatches = []
    not_found = []

    for row in exclude_rows:
        rid = row["id"]
        final_row = final_by_id.get(rid)
        if final_row is None:
            not_found.append(rid)
            continue
        if normalize(final_row["proverb"]) != normalize(row["proverb"]):
            mismatches.append(rid)
            continue
        ids_to_remove.add(rid)

    print(f"finaldataset.csv rows:      {len(final_rows)}")
    print(f"N_200_balanced.csv rows:    {len(exclude_rows)}")
    print(f"Validated for removal:      {len(ids_to_remove)}")
    print(f"Mismatched proverb text:    {len(mismatches)} {mismatches}")
    print(f"Id not found in final:      {len(not_found)} {not_found}")

    if mismatches or not_found:
        print(
            "WARNING: some rows were NOT removed because they failed validation. "
            "Review them manually.",
            file=sys.stderr,
        )

    filtered_rows = [row for row in final_rows if row["id"] not in ids_to_remove]
    print(f"Output rows (filtered):     {len(filtered_rows)}")

    with OUTPUT_PATH.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=final_fields)
        writer.writeheader()
        writer.writerows(filtered_rows)

    print(f"Wrote {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
