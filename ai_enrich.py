"""
ai_enrich.py — Batch AI enrichment for Wesley Library.
Reads all books from WESLEY_LIBRARY that are missing AI fields,
calls Claude to generate SUMMARY, AUDIENCE, CATEGORY, and TAGS,
then writes them back to Snowflake.

Usage:
    python ai_enrich.py              # enrich all missing
    python ai_enrich.py --all        # re-enrich everything (overwrite)
    python ai_enrich.py --limit 20   # enrich only 20 books (for testing)
"""

import os
import sys
import json
import time
import argparse
import anthropic
from dotenv import load_dotenv
from snowflake_conn import get_connection

load_dotenv()

client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

AUDIENCE_OPTIONS  = "Academic, Reference, General, Children, Devotional"
CATEGORY_OPTIONS  = (
    "Theology, Biblical Studies, Church History, Biography, Devotional, "
    "Christian Living, Ministry, Philosophy, Fiction, Reference, History, Other"
)

SYSTEM_PROMPT = """You are a church librarian and bibliographer.
Given a book's title, author, and publisher, return a JSON object with exactly these four fields:
- summary: 1-2 sentence description of what the book is about (be specific, not generic)
- audience: exactly one of: Academic, Reference, General, Children, Devotional
- category: exactly one of: Theology, Biblical Studies, Church History, Biography, Devotional, Christian Living, Ministry, Philosophy, Fiction, Reference, History, Other
- tags: 3-6 comma-separated lowercase keywords relevant to the book

Respond with only valid JSON. No markdown, no explanation."""


def enrich_book(title: str, author: str, publisher: str) -> dict:
    """Call Claude to enrich a single book. Returns dict with 4 fields."""
    prompt = f"""Title: {title or "Unknown"}
Author: {author or "Unknown"}
Publisher: {publisher or "Unknown"}"""

    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=300,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}]
    )

    text = response.content[0].text.strip()
    # Strip markdown fences if model adds them despite instructions
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    return json.loads(text.strip())


def run(overwrite: bool = False, limit: int = None):
    conn = get_connection()
    cursor = conn.cursor()

    # Fetch books that need enrichment
    if overwrite:
        query = "SELECT ISBN, TITLE, AUTHOR, PUBLISHER FROM WESLEY_LIBRARY ORDER BY TITLE"
    else:
        query = """
            SELECT ISBN, TITLE, AUTHOR, PUBLISHER FROM WESLEY_LIBRARY
            WHERE SUMMARY IS NULL OR SUMMARY = ''
            ORDER BY TITLE
        """

    cursor.execute(query)
    rows = cursor.fetchall()

    if limit:
        rows = rows[:limit]

    total = len(rows)
    print(f"📚 Found {total} book(s) to enrich.")

    if total == 0:
        print("✅ Nothing to do.")
        return

    success = 0
    errors  = 0

    for i, (isbn, title, author, publisher) in enumerate(rows, 1):
        print(f"  [{i}/{total}] {title or isbn}...", end=" ", flush=True)
        try:
            enriched = enrich_book(title, author, publisher)

            cursor.execute("""
                UPDATE WESLEY_LIBRARY
                SET SUMMARY  = %s,
                    AUDIENCE = %s,
                    CATEGORY = %s,
                    TAGS     = %s
                WHERE ISBN = %s
            """, (
                enriched.get("summary", ""),
                enriched.get("audience", ""),
                enriched.get("category", ""),
                enriched.get("tags", ""),
                isbn
            ))
            conn.commit()
            print(f"✅ {enriched.get('category')} / {enriched.get('audience')}")
            success += 1

        except json.JSONDecodeError as e:
            print(f"⚠️  JSON parse error: {e}")
            errors += 1
        except Exception as e:
            print(f"❌ Error: {e}")
            errors += 1

        # Be polite to the API — small pause between calls
        time.sleep(0.3)

    cursor.close()
    conn.close()

    print(f"\n✅ Done. {success} enriched, {errors} errors out of {total} books.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="AI-enrich Wesley Library books")
    parser.add_argument("--all",   action="store_true", help="Re-enrich all books, not just missing")
    parser.add_argument("--limit", type=int, default=None, help="Only process N books (for testing)")
    args = parser.parse_args()

    run(overwrite=args.all, limit=args.limit)
