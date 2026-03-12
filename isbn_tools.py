"""
isbn_tools.py — Unified ISBN metadata resolution.

Consolidates: isbn_catalog_stacker.py, loc_isbn_batch.py, main.py

Resolution order per ISBN:
  1. Library of Congress (SRU/MODS)
  2. Library of Congress (SRU/Dublin Core fallback)
  3. Open Library API
  4. Google Books API

Handles:
  - ISBN-9, ISBN-10, ISBN-13 normalization
  - Pre-2001 LCCN patterns (e.g. '55-10767')
  - Batch CSV processing with error logging
  - Single-ISBN lookup for the web API
"""

from __future__ import annotations

import csv
import os
import re
import time
import xml.etree.ElementTree as ET
from urllib.parse import quote_plus

import requests
from requests.adapters import HTTPAdapter
from unidecode import unidecode
from urllib3.util.retry import Retry
from dotenv import load_dotenv

load_dotenv()

# ── Config ──────────────────────────────────────────────────────────────────
GOOGLE_API_KEY   = os.getenv("GOOGLE_BOOKS_API_KEY", "")
PAUSE_SECS       = 0.8     # polite delay between LoC hits
SRU_BASE         = "http://lx2.loc.gov:210/LCDB"
SRU_PARAMS       = "?version=1.1&operation=searchRetrieve&maximumRecords=1"
NS_MODS          = {"mods": "http://www.loc.gov/mods/v3"}
NS_SRW           = {"srw": "http://www.loc.gov/zing/srw/"}
NS_DC            = {"dc": "http://purl.org/dc/elements/1.1/"}
DIGITS_RE        = re.compile(r"\D")
LCCN_OLD_RE      = re.compile(r"^\d{2}-\d{3,6}$")

FIELDNAMES = [
    "ISBN", "Title", "Author", "Edition", "Publisher",
    "Date", "Dewey", "LCCN", "CatalogNumber", "Pages", "Source", "Error",
]

# ── HTTP session with retry ──────────────────────────────────────────────────
_session = requests.Session()
_retry = Retry(total=4, backoff_factor=1, status_forcelist=[429, 500, 502, 503, 504],
               allowed_methods=["GET"])
_session.mount("http://", HTTPAdapter(max_retries=_retry))
_session.mount("https://", HTTPAdapter(max_retries=_retry))


# ── ISBN normalization ────────────────────────────────────────────────────────

def _isbn13_check(body12: str) -> str:
    weights = (1, 3) * 6
    s = sum(int(d) * w for d, w in zip(body12, weights))
    return str((10 - s % 10) % 10)


def _isbn10_check(body9: str) -> str:
    total = sum(int(d) * (10 - i) for i, d in enumerate(body9))
    check = (11 - total % 11) % 11
    return "X" if check == 10 else str(check)


def _isbn10_to_13(isbn10: str) -> str:
    stem = "978" + isbn10[:-1]
    return stem + _isbn13_check(stem)


def normalize_isbn(raw: str) -> tuple[str, str]:
    """Return (isbn13, isbn10). Raises ValueError on bad input."""
    digits = DIGITS_RE.sub("", raw.strip().upper())
    if len(digits) == 13:
        isbn13 = digits
    elif len(digits) == 10:
        isbn13 = _isbn10_to_13(digits)
    elif len(digits) == 9:
        isbn10_full = digits + _isbn10_check(digits)
        isbn13 = _isbn10_to_13(isbn10_full)
    else:
        raise ValueError(f"Unrecognizable ISBN: {raw!r}")

    try:
        body9 = isbn13[3:-1]
        isbn10 = body9 + _isbn10_check(body9)
    except Exception:
        isbn10 = ""
    return isbn13, isbn10


def normalize_lccn(lccn: str) -> str:
    """Normalize pre-2001 LCCNs like '55-10767' → '55010767'."""
    m = LCCN_OLD_RE.match(lccn)
    if not m:
        return lccn
    year, serial = lccn.split("-")
    return f"{year}{int(serial):06d}"


# ── SRU helpers ───────────────────────────────────────────────────────────────

def _xml_text(el: ET.Element | None, path: str, ns: dict, default: str = "") -> str:
    if el is None:
        return default
    node = el.find(path, ns)
    return unidecode(node.text.strip()) if (node is not None and node.text) else default


def _sru_fetch_mods(cql: str) -> list[ET.Element]:
    url = f"{SRU_BASE}{SRU_PARAMS}&recordSchema=mods&query={quote_plus(cql)}"
    try:
        resp = _session.get(url, timeout=20)
        resp.raise_for_status()
        root = ET.fromstring(resp.content)
        return root.findall(".//mods:mods", NS_MODS)
    except Exception:
        return []


def _sru_fetch_dc(cql: str) -> ET.Element | None:
    url = f"{SRU_BASE}{SRU_PARAMS}&recordSchema=dc&query={quote_plus(cql)}"
    try:
        resp = _session.get(url, timeout=20)
        resp.raise_for_status()
        content = re.sub(r"&(?!(amp|lt|gt|quot|apos);)", "&amp;", resp.text)
        root = ET.fromstring(content)
        record = root.find(".//{http://www.loc.gov/zing/srw/}recordData")
        if record is not None:
            return record.find(".//dc:dc", NS_DC)
    except Exception:
        pass
    return None


def _row_from_mods(isbn: str, mods: ET.Element) -> dict:
    return {
        "ISBN":          isbn,
        "Title":         _xml_text(mods, "mods:titleInfo/mods:title", NS_MODS),
        "Author":        _xml_text(mods, "mods:name/mods:namePart", NS_MODS),
        "Edition":       _xml_text(mods, "mods:originInfo/mods:edition", NS_MODS),
        "Publisher":     _xml_text(mods, "mods:originInfo/mods:publisher", NS_MODS),
        "Date":          _xml_text(mods, "mods:originInfo/mods:dateIssued", NS_MODS),
        "Dewey":         _xml_text(mods, "mods:classification[@authority='ddc']", NS_MODS),
        "LCCN":          _xml_text(mods, "mods:identifier[@type='lccn']", NS_MODS),
        "CatalogNumber": _xml_text(mods, "mods:identifier[@type='local']", NS_MODS),
        "Pages":         "",
        "Source":        "Library of Congress",
        "Error":         "",
    }


def _row_from_dc(isbn: str, dc: ET.Element) -> dict:
    creators = [e.text for e in dc.findall("dc:creator", NS_DC) if e.text]
    identifiers = [e.text for e in dc.findall("dc:identifier", NS_DC) if e.text]
    lccn = next((i for i in identifiers if "lccn" in i.lower()), "")
    return {
        "ISBN":          isbn,
        "Title":         _xml_text(dc, "dc:title", NS_DC),
        "Author":        ", ".join(creators),
        "Edition":       "",
        "Publisher":     _xml_text(dc, "dc:publisher", NS_DC),
        "Date":          _xml_text(dc, "dc:date", NS_DC),
        "Dewey":         "",
        "LCCN":          lccn,
        "CatalogNumber": f"CatalogNumber {isbn}",
        "Pages":         "",
        "Source":        "Library of Congress",
        "Error":         "",
    }


# ── Source fetchers ──────────────────────────────────────────────────────────

def fetch_loc(isbn: str) -> dict | None:
    try:
        isbn13, isbn10 = normalize_isbn(isbn)
    except ValueError:
        return None

    for cql in [f"bath.isbn={isbn13}", f"bath.isbn={isbn10}"]:
        mods_list = _sru_fetch_mods(cql)
        if mods_list:
            return _row_from_mods(isbn, mods_list[0])
        time.sleep(PAUSE_SECS)

    # DC fallback
    dc = _sru_fetch_dc(f"bath.isbn={isbn13}")
    if dc is not None:
        return _row_from_dc(isbn, dc)

    return None


def fetch_loc_by_lccn(lccn: str) -> dict | None:
    normalized = normalize_lccn(lccn)
    mods_list = _sru_fetch_mods(f'bath.lccn all "{normalized}"')
    if mods_list:
        row = _row_from_mods(lccn, mods_list[0])
        row["ISBN"] = ""
        row["CatalogNumber"] = lccn
        return row
    dc = _sru_fetch_dc(f'bath.lccn all "{normalized}"')
    if dc is not None:
        row = _row_from_dc(lccn, dc)
        row["ISBN"] = ""
        return row
    return None


def fetch_openlibrary(isbn: str) -> dict | None:
    try:
        url = f"https://openlibrary.org/api/books?bibkeys=ISBN:{isbn}&jscmd=data&format=json"
        resp = _session.get(url, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        book = data.get(f"ISBN:{isbn}")
        if not book:
            return None
        return {
            "ISBN":          isbn,
            "Title":         book.get("title", "Unknown Title"),
            "Author":        ", ".join(a["name"] for a in book.get("authors", [])) or "",
            "Edition":       book.get("edition_name", ""),
            "Publisher":     ", ".join(p["name"] for p in book.get("publishers", [])) or "",
            "Date":          book.get("publish_date", ""),
            "Dewey":         (book.get("dewey_decimal_class") or [""])[0],
            "LCCN":          (book.get("lccn") or [""])[0],
            "CatalogNumber": f"CatalogNumber {isbn}",
            "Pages":         str(book.get("number_of_pages", "")),
            "Source":        "Open Library",
            "Error":         "",
        }
    except Exception:
        return None


def fetch_google_books(isbn: str) -> dict | None:
    try:
        url = f"https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}"
        if GOOGLE_API_KEY:
            url += f"&key={GOOGLE_API_KEY}"
        resp = _session.get(url, timeout=10)
        resp.raise_for_status()
        items = resp.json().get("items")
        if not items:
            return None
        vol = items[0]["volumeInfo"]
        return {
            "ISBN":          isbn,
            "Title":         vol.get("title", "Unknown Title"),
            "Author":        ", ".join(vol.get("authors", [])) or "",
            "Edition":       "",
            "Publisher":     vol.get("publisher", ""),
            "Date":          vol.get("publishedDate", ""),
            "Dewey":         "",
            "LCCN":          "",
            "CatalogNumber": f"CatalogNumber {isbn}",
            "Pages":         str(vol.get("pageCount", "")),
            "Source":        "Google Books",
            "Error":         "",
        }
    except Exception:
        return None


# ── Public API ───────────────────────────────────────────────────────────────

def resolve_isbn(isbn: str) -> dict:
    """
    Resolve a single ISBN to its best available metadata.
    Returns a full row dict (never raises).
    """
    isbn = isbn.strip()

    # Detect old LCCN pattern
    if LCCN_OLD_RE.match(isbn):
        result = fetch_loc_by_lccn(isbn)
        if result:
            return result

    for fetcher in [fetch_loc, fetch_openlibrary, fetch_google_books]:
        result = fetcher(isbn)
        if result:
            return result
        time.sleep(0.3)

    # Log missing
    with open("missing_isbns.txt", "a") as f:
        f.write(f"{isbn}\n")

    return {
        "ISBN": isbn, "Title": "Unknown Title", "Author": "", "Edition": "",
        "Publisher": "", "Date": "", "Dewey": "", "LCCN": "",
        "CatalogNumber": f"CatalogNumber {isbn}", "Pages": "",
        "Source": "", "Error": "Metadata not found",
    }


def batch_resolve_csv(input_path: str, output_path: str) -> list[dict]:
    """
    Read ISBNs from a CSV (expects column named 'ISBN'),
    resolve each, write results to output_path, return list of rows.
    """
    with open(input_path, newline="") as f:
        reader = csv.DictReader(f)
        isbns = [row.get("ISBN", "").strip() for row in reader if row.get("ISBN")]

    results = []
    total = len(isbns)
    for i, isbn in enumerate(isbns, 1):
        row = resolve_isbn(isbn)
        results.append(row)
        if i % 20 == 0 or i == total:
            print(f"  [{i}/{total}] {row['Title'][:50]}")

    with open(output_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
        writer.writeheader()
        writer.writerows(results)

    return results


if __name__ == "__main__":
    # CLI usage: python isbn_tools.py ISBNs.csv Book_Metadata.csv
    import sys
    inp = sys.argv[1] if len(sys.argv) > 1 else "ISBNs.csv"
    out = sys.argv[2] if len(sys.argv) > 2 else "Book_Metadata.csv"
    print(f"📖 Resolving ISBNs from {inp} → {out}")
    batch_resolve_csv(inp, out)
    print("✅ Done.")
