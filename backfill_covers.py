"""
backfill_covers.py — Fetch and store cover image URLs for all books
                     in WESLEY_LIBRARY that currently have no IMAGE_URL.

Usage:
    python backfill_covers.py            # dry run (prints what it would do)
    python backfill_covers.py --commit   # actually writes to Snowflake

Safe to re-run: only touches rows where IMAGE_URL IS NULL.
Rate-limited to ~1 request/sec to be polite to Google Books / OpenLibrary.
"""

import sys
import time
import requests
from dotenv import load_dotenv
from snowflake_conn import get_connection

load_dotenv()

DRY_RUN = "--commit" not in sys.argv
PAUSE   = 1.0   # seconds between ISBN lookups


# ── Cover fetchers (same logic as enrich.py) ──────────────────────────────────

def fetch_cover_google(isbn: str) -> str | None:
    try:
        url  = f"https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}"
        data = requests.get(url, timeout=10).json()
        items = data.get("items")
        if not items:
            return None
        links = items[0].get("volumeInfo", {}).get("imageLinks", {})
        for size in ("large", "medium", "thumbnail", "smallThumbnail"):
            img = links.get(size)
            if img:
                return img.replace("http://", "https://")
    except Exception:
        pass
    return None


def fetch_cover_openlibrary(isbn: str) -> str | None:
    try:
        url  = f"https://covers.openlibrary.org/b/isbn/{isbn}-M.jpg?default=false"
        resp = requests.get(url, timeout=10, allow_redirects=True)
        if resp.status_code == 200 and "image" in resp.headers.get("Content-Type", ""):
            return url
    except Exception:
        pass
    return None


def fetch_cover(isbn: str) -> str | None:
    """Try Google Books first, then OpenLibrary."""
    return fetch_cover_google(isbn) or fetch_cover_openlibrary(isbn)


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    conn   = get_connection()
    cursor = conn.cursor()

    # Verify IMAGE_URL column exists
    try:
        cursor.execute("SELECT IMAGE_URL FROM WESLEY_LIBRARY LIMIT 1")
        print("✓ IMAGE_URL column found.")
    except Exception as e:
        print(f"❌ IMAGE_URL column missing: {e}")
        print("   Run in Snowflake: ALTER TABLE WESLEY_LIBRARY ADD COLUMN IF NOT EXISTS IMAGE_URL VARCHAR(1000);")
        cursor.close()
        conn.close()
        return

    # Fetch all ISBNs with no cover
    cursor.execute("""
        SELECT ISBN, Title
        FROM WESLEY_LIBRARY
        WHERE IMAGE_URL IS NULL
        ORDER BY Title
    """)
    print(f"Query executed successfully.")
    rows = cursor.fetchall()

    total    = len(rows)
    found    = 0
    not_found = 0

    print(f"{'[DRY RUN] ' if DRY_RUN else ''}Found {total} books without cover images.\n")

    if total == 0:
        print("✅ All books already have cover images.")
        cursor.close()
        conn.close()
        return

    for i, (isbn, title) in enumerate(rows, 1):
        prefix = f"[{i}/{total}]"
        url = fetch_cover(isbn)

        if url:
            found += 1
            print(f"  {prefix} ✓ {title[:55]:<55}  {url[:60]}")
            if not DRY_RUN:
                cursor.execute(
                    "UPDATE WESLEY_LIBRARY SET IMAGE_URL = %s WHERE ISBN = %s",
                    (url, isbn)
                )
        else:
            not_found += 1
            print(f"  {prefix} – {title[:55]:<55}  (no image found)")

        # Commit in batches of 25 to avoid losing everything on error
        if not DRY_RUN and i % 25 == 0:
            conn.commit()
            print(f"    💾 Committed batch ({i} processed so far)")

        time.sleep(PAUSE)

    if not DRY_RUN:
        conn.commit()

    cursor.close()
    conn.close()

    print(f"\n{'─'*60}")
    print(f"{'[DRY RUN] ' if DRY_RUN else ''}Complete: {found} covers found, {not_found} not found out of {total} books.")
    if DRY_RUN:
        print("Run with --commit to write changes to Snowflake.")


if __name__ == "__main__":
    main()