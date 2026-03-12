"""
enrich.py — Metadata + AI enrichment for Wesley Library.
Fetches bibliographic data from LoC → OpenLibrary → Google Books,
then calls Claude to add SUMMARY, AUDIENCE, CATEGORY, TAGS.
"""

import os
import json
import requests
import xml.etree.ElementTree as ET
import anthropic
from dotenv import load_dotenv

load_dotenv()

_anthropic_client = None

def _get_client():
    global _anthropic_client
    if _anthropic_client is None:
        _anthropic_client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    return _anthropic_client


# ── Bibliographic sources ─────────────────────────────────────────────────────

def clean(text):
    return text.strip() if isinstance(text, str) else text

def fetch_loc_metadata(isbn):
    url = f"https://lx2.loc.gov:210/LCDB?version=1.1&operation=searchRetrieve&query=isbn={isbn}&maximumRecords=1"
    resp = requests.get(url, timeout=10)
    resp.raise_for_status()
    root = ET.fromstring(resp.content)
    ns = {'srw': 'http://www.loc.gov/zing/srw/'}
    record_data = root.find('.//srw:recordData', ns)
    if record_data is None:
        raise ValueError("No record found in LoC")
    marc_xml = record_data[0]
    title     = marc_xml.find(".//*[@tag='245']//*[@code='a']").text
    author    = marc_xml.find(".//*[@tag='100']//*[@code='a']")
    publisher = marc_xml.find(".//*[@tag='260']//*[@code='b']")
    date      = marc_xml.find(".//*[@tag='260']//*[@code='c']")
    pages     = marc_xml.find(".//*[@tag='300']//*[@code='a']")
    dewey     = marc_xml.find(".//*[@tag='082']//*[@code='a']")
    lccn      = marc_xml.find(".//*[@tag='010']//*[@code='a']")
    return {
        "ISBN": isbn, "Title": clean(title),
        "Author": clean(author.text) if author is not None else None,
        "Publisher": clean(publisher.text) if publisher is not None else None,
        "Edition": None,
        "Date": clean(date.text) if date is not None else None,
        "Dewey": clean(dewey.text) if dewey is not None else None,
        "LCCN": clean(lccn.text) if lccn is not None else None,
        "CatalogNumber": None,
        "Pages": clean(pages.text) if pages is not None else None,
        "Source": "Library of Congress",
    }

def fetch_openlibrary_metadata(isbn):
    url = f"https://openlibrary.org/api/books?bibkeys=ISBN:{isbn}&jscmd=data&format=json"
    resp = requests.get(url, timeout=10)
    resp.raise_for_status()
    data = resp.json()
    book = data.get(f"ISBN:{isbn}")
    if not book:
        raise ValueError("Not found in OpenLibrary")
    return {
        "ISBN": isbn, "Title": clean(book.get("title")),
        "Author": ", ".join(a['name'] for a in book.get("authors", [])) if book.get("authors") else None,
        "Publisher": book["publishers"][0]["name"] if book.get("publishers") else None,
        "Edition": None, "Date": book.get("publish_date"),
        "Dewey": None, "LCCN": None, "CatalogNumber": None,
        "Pages": book.get("number_of_pages"), "Source": "OpenLibrary",
    }

def fetch_google_books_metadata(isbn):
    url = f"https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}"
    resp = requests.get(url, timeout=10)
    resp.raise_for_status()
    data = resp.json()
    items = data.get("items")
    if not items:
        raise ValueError("Not found in Google Books")
    volume = items[0]["volumeInfo"]
    return {
        "ISBN": isbn, "Title": clean(volume.get("title")),
        "Author": ", ".join(volume.get("authors", [])) if volume.get("authors") else None,
        "Publisher": volume.get("publisher"), "Edition": None,
        "Date": volume.get("publishedDate"), "Dewey": None,
        "LCCN": None, "CatalogNumber": None,
        "Pages": str(volume.get("pageCount")) if volume.get("pageCount") else None,
        "Source": "Google Books",
    }

def fetch_bibliographic_metadata(isbn: str) -> dict:
    """Try LoC → OpenLibrary → Google Books. Always returns a dict."""
    for fetcher in [fetch_loc_metadata, fetch_openlibrary_metadata, fetch_google_books_metadata]:
        try:
            return fetcher(isbn)
        except Exception:
            continue
    return {
        "ISBN": isbn, "Title": "Unknown", "Author": None,
        "Publisher": None, "Edition": None, "Date": None,
        "Dewey": None, "LCCN": None, "CatalogNumber": None,
        "Pages": None, "Source": "Not Found",
    }


# ── AI enrichment ─────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are a church librarian and bibliographer.
Given a book's title, author, and publisher, return a JSON object with exactly these four fields:
- summary: 1-2 sentence description of what the book is about (be specific, not generic)
- audience: exactly one of: Academic, Reference, General, Children, Devotional
- category: exactly one of: Theology, Biblical Studies, Church History, Biography, Devotional, Christian Living, Ministry, Philosophy, Fiction, Reference, History, Other
- tags: 3-6 comma-separated lowercase keywords relevant to the book

Respond with only valid JSON. No markdown, no explanation."""

def ai_enrich(title: str, author: str, publisher: str) -> dict:
    """Call Claude Haiku to generate summary, audience, category, tags."""
    try:
        response = _get_client().messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=300,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": f"Title: {title or 'Unknown'}\nAuthor: {author or 'Unknown'}\nPublisher: {publisher or 'Unknown'}"}]
        )
        text = response.content[0].text.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        return json.loads(text.strip())
    except Exception as e:
        print(f"  ⚠️  AI enrichment failed for '{title}': {e}")
        return {"summary": None, "audience": None, "category": None, "tags": None}


# ── Public API ────────────────────────────────────────────────────────────────

def enrich_metadata(isbn: str) -> dict:
    """
    Full enrichment pipeline for a single ISBN:
    1. Fetch bibliographic metadata from external sources
    2. Call Claude to generate summary, audience, category, tags
    Returns a single flat dict ready for upsert into WESLEY_LIBRARY.
    """
    meta = fetch_bibliographic_metadata(isbn)
    ai   = ai_enrich(meta.get("Title"), meta.get("Author"), meta.get("Publisher"))

    return {
        "ISBN":          meta.get("ISBN"),
        "Title":         meta.get("Title"),
        "Author":        meta.get("Author"),
        "Publisher":     meta.get("Publisher"),
        "Edition":       meta.get("Edition"),
        "Date":          meta.get("Date"),
        "Dewey":         meta.get("Dewey"),
        "LCCN":          meta.get("LCCN"),
        "CatalogNumber": meta.get("CatalogNumber"),
        "Pages":         meta.get("Pages"),
        "Source":        meta.get("Source"),
        "Summary":       ai.get("summary"),
        "Audience":      ai.get("audience"),
        "Category":      ai.get("category"),
        "Tags":          ai.get("tags"),
    }
