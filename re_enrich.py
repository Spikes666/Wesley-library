#!/usr/bin/env python3
"""
re_enrich.py — Bulk re-enrichment of all books in WESLEY_LIBRARY.

Fetches all non-Unknown books, calls the improved ai_enrich() for each,
and updates only Summary, Audience, Category, Tags in Snowflake.

Usage:
    python re_enrich.py          # live run
    python re_enrich.py --dry-run  # preview without writing
"""
import argparse
import time
import sys
from dotenv import load_dotenv
load_dotenv()

from snowflake_conn import get_connection
from enrich import ai_enrich, fetch_google_books_context


def fetch_all_books() -> list[dict]:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT ISBN, Title, Author, Publisher
            FROM WESLEY_LIBRARY
            WHERE UPPER(Title) != 'UNKNOWN TITLE'
              AND UPPER(Title) != 'UNKNOWN'
            QUALIFY ROW_NUMBER() OVER (PARTITION BY ISBN ORDER BY Title) = 1
            ORDER BY Title
        """)
        cols = [c[0].lower() for c in cursor.description]
        return [dict(zip(cols, row)) for row in cursor.fetchall()]
    finally:
        cursor.close()
        conn.close()


def update_enrichment(isbn: str, summary: str | None, audience: str | None,
                      category: str | None, tags: str | None) -> None:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE WESLEY_LIBRARY
            SET Summary  = %s,
                Audience = %s,
                Category = %s,
                Tags     = %s
            WHERE ISBN = %s
        """, (summary, audience, category, tags, isbn))
        conn.commit()
    finally:
        cursor.close()
        conn.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Bulk re-enrich library books with AI metadata.")
    parser.add_argument("--dry-run", action="store_true", help="Print results without writing to DB")
    args = parser.parse_args()

    books = fetch_all_books()
    total = len(books)
    print(f"Found {total} books to re-enrich. {'DRY RUN — no DB writes.' if args.dry_run else 'Live run.'}\n")

    ok = 0
    failed = 0

    for i, book in enumerate(books, 1):
        isbn      = book["isbn"]
        title     = book["title"] or "Unknown"
        author    = book["author"] or ""
        publisher = book["publisher"] or ""

        print(f"[{i}/{total}] {title[:70]}")

        try:
            desc, subjects, subtitle = fetch_google_books_context(isbn)
            ai = ai_enrich(title, author, publisher,
                           description=desc, subjects=subjects, subtitle=subtitle)

            tags_val = ai.get("tags")
            if isinstance(tags_val, list):
                tags_val = ", ".join(tags_val)

            if args.dry_run:
                print(f"  category : {ai.get('category')}")
                print(f"  audience : {ai.get('audience')}")
                print(f"  tags     : {tags_val}")
                print(f"  summary  : {(ai.get('summary') or '')[:120]}")
            else:
                update_enrichment(isbn, ai.get("summary"), ai.get("audience"),
                                  ai.get("category"), tags_val)
            ok += 1
        except Exception as e:
            print(f"  ERROR: {e}")
            failed += 1

        time.sleep(0.3)

    print(f"\nDone. {ok} succeeded, {failed} failed out of {total}.")
    if failed:
        sys.exit(1)


if __name__ == "__main__":
    main()
