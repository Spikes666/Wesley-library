"""
enrich.py — Metadata + AI enrichment for Wesley Library.
Fetches bibliographic data from LoC → OpenLibrary → Google Books,
then calls Claude to add SUMMARY, AUDIENCE, CATEGORY, TAGS.
Also captures cover image URL from Google Books or OpenLibrary.
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
        try:
            from anthropic import DefaultHttpxClient
            import httpx2
            # Use a transport that sends Accept-Encoding: gzip only,
            # avoiding brotli which has a decompressor incompatibility in this env.
            transport = httpx2.HTTPTransport()
            http_client = DefaultHttpxClient(
                transport=transport,
                headers={"Accept-Encoding": "gzip, deflate"},
            )
            _anthropic_client = anthropic.Anthropic(
                api_key=os.environ["ANTHROPIC_API_KEY"],
                http_client=http_client,
            )
        except Exception:
            _anthropic_client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    return _anthropic_client


# ── Cover image helpers ───────────────────────────────────────────────────────

def fetch_cover_image_url(isbn: str) -> str | None:
    """
    Try to find a cover image URL for the given ISBN.
    Priority: Google Books → OpenLibrary covers API.
    Returns a URL string or None.
    """
    # Google Books
    try:
        url = f"https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}"
        resp = requests.get(url, timeout=10)
        data = resp.json()
        items = data.get("items")
        if items:
            image_links = items[0].get("volumeInfo", {}).get("imageLinks", {})
            for size in ("large", "medium", "thumbnail", "smallThumbnail"):
                img = image_links.get(size)
                if img:
                    return img.replace("http://", "https://")
    except Exception:
        pass

    # OpenLibrary covers API fallback
    try:
        url = f"https://covers.openlibrary.org/b/isbn/{isbn}-M.jpg?default=false"
        resp = requests.get(url, timeout=10, allow_redirects=True)
        if resp.status_code == 200 and "image" in resp.headers.get("Content-Type", ""):
            return url
    except Exception:
        pass

    return None


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
        "Image_URL": None,  # LoC doesn't provide images
    }

def fetch_openlibrary_metadata(isbn):
    url = f"https://openlibrary.org/api/books?bibkeys=ISBN:{isbn}&jscmd=data&format=json"
    resp = requests.get(url, timeout=10)
    resp.raise_for_status()
    data = resp.json()
    book = data.get(f"ISBN:{isbn}")
    if not book:
        raise ValueError("Not found in OpenLibrary")
    cover = None
    if book.get("cover"):
        cover = book["cover"].get("large") or book["cover"].get("medium") or book["cover"].get("small")
    return {
        "ISBN": isbn, "Title": clean(book.get("title")),
        "Author": ", ".join(a['name'] for a in book.get("authors", [])) if book.get("authors") else None,
        "Publisher": book["publishers"][0]["name"] if book.get("publishers") else None,
        "Edition": None, "Date": book.get("publish_date"),
        "Dewey": None, "LCCN": None, "CatalogNumber": None,
        "Pages": book.get("number_of_pages"), "Source": "OpenLibrary",
        "Image_URL": cover,
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
    image_links = volume.get("imageLinks", {})
    cover = None
    for size in ("large", "medium", "thumbnail", "smallThumbnail"):
        img = image_links.get(size)
        if img:
            cover = img.replace("http://", "https://")
            break
    return {
        "ISBN": isbn, "Title": clean(volume.get("title")),
        "Author": ", ".join(volume.get("authors", [])) if volume.get("authors") else None,
        "Publisher": volume.get("publisher"), "Edition": None,
        "Date": volume.get("publishedDate"), "Dewey": None,
        "LCCN": None, "CatalogNumber": None,
        "Pages": str(volume.get("pageCount")) if volume.get("pageCount") else None,
        "Source": "Google Books",
        "Image_URL": cover,
        # Extra context for AI enrichment (not persisted as a column)
        "_description": (volume.get("description") or "")[:600],
        "_subjects": volume.get("categories", []),
        "_subtitle": volume.get("subtitle", ""),
    }


def fetch_google_books_context(isbn: str) -> tuple[str, list[str], str]:
    """
    Lightweight Google Books fetch just for AI context (description, subjects, subtitle).
    Returns (description, categories, subtitle). Never raises.
    """
    try:
        url = f"https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}"
        resp = requests.get(url, headers={"User-Agent": "WesleyLibrary/1.0"}, timeout=10)
        items = resp.json().get("items", [])
        if not items:
            return "", [], ""
        vi = items[0]["volumeInfo"]
        desc     = (vi.get("description") or "")[:600]
        subjects = vi.get("categories", [])
        subtitle = vi.get("subtitle", "")
        return desc, subjects, subtitle
    except Exception:
        return "", [], ""

def fetch_bibliographic_metadata(isbn: str) -> dict:
    """Try LoC → OpenLibrary → Google Books. Always returns a dict."""
    for fetcher in [fetch_loc_metadata, fetch_openlibrary_metadata, fetch_google_books_metadata]:
        try:
            result = fetcher(isbn)
            # If metadata found but no image, try the cover helper
            if not result.get("Image_URL"):
                result["Image_URL"] = fetch_cover_image_url(isbn)
            return result
        except Exception:
            continue
    return {
        "ISBN": isbn, "Title": "Unknown", "Author": None,
        "Publisher": None, "Edition": None, "Date": None,
        "Dewey": None, "LCCN": None, "CatalogNumber": None,
        "Pages": None, "Source": "Not Found", "Image_URL": None,
    }


# ── Reddit context ────────────────────────────────────────────────────────────

CHURCH_SUBS = {"books", "Christianity", "Reformed", "theology", "Catholicism",
               "DebateReligion", "Christian", "biblestudy", "Methodism", "UnitedMethodist"}

def fetch_reddit_context(title: str, author: str = "") -> str:
    """
    Pull top Reddit discussion snippets for the book to give the AI richer context.
    Uses the public JSON API — no auth required.
    Returns a short string (empty if nothing found or on error).
    """
    try:
        last_name = author.split(",")[0].strip() if author else ""
        query = f'"{title}"' + (f" {last_name}" if last_name else "")
        url = (
            "https://www.reddit.com/search.json"
            f"?q={requests.utils.quote(query)}&sort=relevance&limit=5&t=all"
        )
        resp = requests.get(url, headers={"User-Agent": "WesleyLibrary/1.0"}, timeout=8)
        posts = resp.json().get("data", {}).get("children", [])
        snippets = []
        for p in posts:
            d = p.get("data", {})
            sub = d.get("subreddit", "")
            if sub not in CHURCH_SUBS:
                continue
            heading = d.get("title", "")
            body = (d.get("selftext", "") or "")[:180].replace("\n", " ").strip()
            snippets.append(f"r/{sub}: {heading}. {body}".rstrip(". "))
            if len(snippets) >= 2:
                break
        return " | ".join(snippets)
    except Exception:
        return ""


# ── AI enrichment ─────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are a church librarian and expert theologian creating catalog metadata for a Methodist/Wesleyan church library.

Given a book's title, author, publisher, and any additional context, return a JSON object with exactly these four fields:

- summary: 2-3 sentence description that NAMES specific biblical figures (Jesus, Isaiah, Moses, Paul, John the Baptist, David, Abraham, etc.), theological concepts (salvation, grace, atonement, resurrection, sanctification, etc.), and historical movements. Be specific—not "explores faith" but "examines Paul's theology of justification by grace in Romans."

- audience: exactly one of: Academic, Reference, General, Children, Devotional

- category: exactly one of: Theology, Biblical Studies, Old Testament, New Testament, Christology, Church History, Biography, Devotional, Christian Living, Ministry, Wesleyan/Methodist, Missions, Philosophy, Fiction, Reference, History, Other

- tags: 10-15 comma-separated lowercase tags. MUST include relevant items from these pools:
  * Biblical figures: jesus, paul, moses, isaiah, david, john the baptist, peter, mary, abraham, joseph, elijah, john, luke, matthew, mark
  * Books of the Bible: genesis, psalms, isaiah, matthew, john, romans, revelation, acts, luke, corinthians, ephesians, hebrews, exodus, proverbs, job
  * Theological themes: salvation, grace, atonement, resurrection, sanctification, justification, redemption, covenant, sin, faith, prayer, worship, discipleship, evangelism, eschatology, trinity, holy spirit, baptism, eucharist, forgiveness, prophecy, healing
  * Church tradition: wesleyan, methodist, protestant, catholic, evangelical, reformed, pentecostal, early church, church fathers, reformation, puritans
  * Academic/practical: systematic theology, biblical commentary, church history, pastoral care, preaching, missions, social justice, spiritual formation, apologetics, hermeneutics

  Include ONLY tags genuinely relevant to this specific book. Do not pad with generic terms.

Respond with only valid JSON. No markdown, no explanation."""

def ai_enrich(title: str, author: str, publisher: str,
              description: str = "", subjects: list | None = None,
              subtitle: str = "") -> dict:
    """Call Claude Sonnet to generate summary, audience, category, tags with theological depth."""
    try:
        reddit = fetch_reddit_context(title, author)
        user_msg = f"Title: {title or 'Unknown'}"
        if subtitle:
            user_msg += f"\nSubtitle: {subtitle}"
        user_msg += f"\nAuthor: {author or 'Unknown'}\nPublisher: {publisher or 'Unknown'}"
        if description:
            user_msg += f"\nDescription: {description[:500]}"
        if subjects:
            user_msg += f"\nSubjects: {', '.join(subjects[:8])}"
        if reddit:
            user_msg += f"\n\nCommunity discussion: {reddit}"
        response = _get_client().messages.create(
            model="claude-sonnet-5-5",
            max_tokens=600,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_msg}]
        )
        text_block = next((b for b in response.content if b.type == "text"), None)
        if text_block is None:
            raise ValueError("No text block in response")
        text = text_block.text.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
            text = text.rstrip("`").strip()
        # Extract just the first JSON object in case model added extra text
        brace = text.find("{")
        close = text.rfind("}")
        if brace != -1 and close != -1:
            text = text[brace:close + 1]
        return json.loads(text.strip())
    except Exception as e:
        print(f"  ⚠️  AI enrichment failed for '{title}': {e}")
        return {"summary": None, "audience": None, "category": None, "tags": None}


# ── Public API ────────────────────────────────────────────────────────────────

def enrich_metadata(isbn: str) -> dict:
    """
    Full enrichment pipeline for a single ISBN:
    1. Fetch bibliographic metadata + cover image from external sources
    2. Call Claude to generate summary, audience, category, tags
    Returns a single flat dict ready for upsert into WESLEY_LIBRARY.
    """
    meta = fetch_bibliographic_metadata(isbn)
    desc, subjects, subtitle = fetch_google_books_context(isbn)
    ai   = ai_enrich(
        meta.get("Title"), meta.get("Author"), meta.get("Publisher"),
        description=desc, subjects=subjects, subtitle=subtitle,
    )

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
        "Image_URL":     meta.get("Image_URL"),
        "Summary":       ai.get("summary"),
        "Audience":      ai.get("audience"),
        "Category":      ai.get("category"),
        "Tags":          ai.get("tags"),
    }