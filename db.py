"""
db.py — All database operations for Wesley Library.
Uses snowflake_conn.get_connection() (JWT auth) exclusively.
"""

from snowflake_conn import get_connection


# ── Books ────────────────────────────────────────────────────────────────────

def fetch_books(search: str = "", limit: int = 500, offset: int = 0) -> list[dict]:
    """Fetch books with optional full-text search across title/author/isbn/tags/category."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        if search:
            like = f"%{search.upper()}%"
            cursor.execute("""
                SELECT ISBN, Title, Author, Publisher, Edition, Date,
                       Dewey, LCCN, CatalogNumber, Pages, Source,
                       Checked_Out_By, Summary, Audience, Category, Tags
                FROM WESLEY_LIBRARY
                WHERE UPPER(Title) LIKE %s
                   OR UPPER(Author) LIKE %s
                   OR ISBN LIKE %s
                   OR UPPER(Tags) LIKE %s
                   OR UPPER(Category) LIKE %s
                ORDER BY Title
                LIMIT %s OFFSET %s
            """, (like, like, like, like, like, limit, offset))
        else:
            cursor.execute("""
                SELECT ISBN, Title, Author, Publisher, Edition, Date,
                       Dewey, LCCN, CatalogNumber, Pages, Source,
                       Checked_Out_By, Summary, Audience, Category, Tags
                FROM WESLEY_LIBRARY
                ORDER BY Title
                LIMIT %s OFFSET %s
            """, (limit, offset))

        columns = [col[0].lower() for col in cursor.description]
        return [dict(zip(columns, row)) for row in cursor.fetchall()]
    finally:
        cursor.close()
        conn.close()


def fetch_book_by_isbn(isbn: str) -> dict | None:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT ISBN, Title, Author, Publisher, Edition, Date,
                   Dewey, LCCN, CatalogNumber, Pages, Source,
                   Checked_Out_By, Summary, Audience, Category, Tags
            FROM WESLEY_LIBRARY WHERE ISBN = %s
        """, (isbn,))
        row = cursor.fetchone()
        if not row:
            return None
        columns = [col[0].lower() for col in cursor.description]
        return dict(zip(columns, row))
    finally:
        cursor.close()
        conn.close()


def upsert_books(books: list[dict]) -> int:
    """Insert or update books including AI enrichment fields. Returns count processed."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        for book in books:
            cursor.execute("""
                MERGE INTO WESLEY_LIBRARY AS target
                USING (SELECT %(ISBN)s AS ISBN) AS source
                ON target.ISBN = source.ISBN
                WHEN MATCHED THEN UPDATE SET
                    Title         = %(Title)s,
                    Author        = %(Author)s,
                    Publisher     = %(Publisher)s,
                    Edition       = %(Edition)s,
                    Date          = %(Date)s,
                    Dewey         = %(Dewey)s,
                    LCCN          = %(LCCN)s,
                    CatalogNumber = %(CatalogNumber)s,
                    Pages         = %(Pages)s,
                    Source        = %(Source)s,
                    Summary       = %(Summary)s,
                    Audience      = %(Audience)s,
                    Category      = %(Category)s,
                    Tags          = %(Tags)s
                WHEN NOT MATCHED THEN INSERT (
                    ISBN, Title, Author, Publisher, Edition, Date,
                    Dewey, LCCN, CatalogNumber, Pages, Source,
                    Summary, Audience, Category, Tags
                ) VALUES (
                    %(ISBN)s, %(Title)s, %(Author)s, %(Publisher)s, %(Edition)s,
                    %(Date)s, %(Dewey)s, %(LCCN)s, %(CatalogNumber)s, %(Pages)s, %(Source)s,
                    %(Summary)s, %(Audience)s, %(Category)s, %(Tags)s
                )
            """, {
                "ISBN":          book.get("ISBN"),
                "Title":         book.get("Title"),
                "Author":        book.get("Author"),
                "Publisher":     book.get("Publisher"),
                "Edition":       book.get("Edition"),
                "Date":          book.get("Date"),
                "Dewey":         book.get("Dewey"),
                "LCCN":          book.get("LCCN"),
                "CatalogNumber": book.get("CatalogNumber"),
                "Pages":         book.get("Pages"),
                "Source":        book.get("Source"),
                "Summary":       book.get("Summary"),
                "Audience":      book.get("Audience"),
                "Category":      book.get("Category"),
                "Tags":          book.get("Tags"),
            })
        conn.commit()
        return len(books)
    finally:
        cursor.close()
        conn.close()


# ── Circulation ───────────────────────────────────────────────────────────────

def checkout_book(isbn: str, user: str) -> tuple[bool, str]:
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT Checked_Out_By FROM WESLEY_LIBRARY WHERE ISBN = %s", (isbn,))
        row = cursor.fetchone()
        if not row:
            return False, "Book not found."
        if row[0]:
            return False, f"Already checked out by {row[0]}."
        cursor.execute(
            "UPDATE WESLEY_LIBRARY SET Checked_Out_By = %s WHERE ISBN = %s",
            (user, isbn)
        )
        cursor.execute("""
            INSERT INTO CHECKOUTS_WESLEY (ISBN, ACTION, CHECKED_OUT_BY, CHECKED_OUT_AT, NOTES)
            VALUES (%s, 'checkout', %s, CURRENT_TIMESTAMP(), 'Web checkout')
        """, (isbn, user))
        conn.commit()
        return True, "Book successfully checked out."
    finally:
        cursor.close()
        conn.close()


def return_book(isbn: str) -> tuple[bool, str]:
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT Checked_Out_By FROM WESLEY_LIBRARY WHERE ISBN = %s", (isbn,))
        row = cursor.fetchone()
        if not row:
            return False, "Book not found."
        if not row[0]:
            return False, "Book is not currently checked out."
        cursor.execute(
            "UPDATE WESLEY_LIBRARY SET Checked_Out_By = NULL WHERE ISBN = %s",
            (isbn,)
        )
        cursor.execute("""
            INSERT INTO CHECKOUTS_WESLEY (ISBN, ACTION, CHECKED_OUT_BY, CHECKED_OUT_AT, NOTES)
            VALUES (%s, 'checkin', NULL, CURRENT_TIMESTAMP(), 'Web return')
        """, (isbn,))
        conn.commit()
        return True, "Book successfully returned."
    finally:
        cursor.close()
        conn.close()


def fetch_circulation_log(limit: int = 100) -> list[dict]:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT c.ISBN, w.Title, c.ACTION, c.CHECKED_OUT_BY,
                   c.CHECKED_OUT_AT, c.NOTES
            FROM CHECKOUTS_WESLEY c
            LEFT JOIN WESLEY_LIBRARY w ON c.ISBN = w.ISBN
            ORDER BY c.CHECKED_OUT_AT DESC
            LIMIT %s
        """, (limit,))
        columns = [col[0].lower() for col in cursor.description]
        return [dict(zip(columns, row)) for row in cursor.fetchall()]
    finally:
        cursor.close()
        conn.close()


# ── Stats ─────────────────────────────────────────────────────────────────────

def fetch_stats() -> dict:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT
                COUNT(*) AS total_books,
                COUNT(Checked_Out_By) AS checked_out,
                COUNT(*) - COUNT(Checked_Out_By) AS available
            FROM WESLEY_LIBRARY
        """)
        row = cursor.fetchone()
        return {"total": row[0], "checked_out": row[1], "available": row[2]}
    finally:
        cursor.close()
        conn.close()
