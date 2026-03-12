"""
app.py — Wesley Library Flask API
Serves both the public catalog and admin dashboard.
"""

import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import pandas as pd

from db import (
    fetch_books, fetch_book_by_isbn, upsert_books,
    checkout_book, return_book, fetch_circulation_log, fetch_stats
)
from enrich import enrich_metadata
from isbn_tools import resolve_isbn, batch_resolve_csv

load_dotenv()

app = Flask(__name__)
CORS(app, supports_credentials=True, resources={r"/*": {"origins": os.getenv("CORS_ORIGIN", "http://localhost:5173")}})


# ── Health ────────────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


# ── Public: Catalog ───────────────────────────────────────────────────────────

@app.route("/api/books", methods=["GET"])
def get_books():
    """GET /api/books?search=&limit=&offset="""
    try:
        search = request.args.get("search", "").strip()
        limit  = int(request.args.get("limit", 100))
        offset = int(request.args.get("offset", 0))
        books = fetch_books(search=search, limit=limit, offset=offset)
        return jsonify({"books": books, "count": len(books)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/books/<isbn>", methods=["GET"])
def get_book(isbn):
    """GET /api/books/:isbn — single book detail"""
    try:
        book = fetch_book_by_isbn(isbn)
        if not book:
            return jsonify({"error": "Book not found"}), 404
        return jsonify(book)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Public: Stats ─────────────────────────────────────────────────────────────

@app.route("/api/stats", methods=["GET"])
def get_stats():
    try:
        return jsonify(fetch_stats())
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Circulation ───────────────────────────────────────────────────────────────

@app.route("/api/checkout", methods=["POST"])
def do_checkout():
    data = request.json or {}
    isbn = data.get("isbn", "").strip()
    user = data.get("user", "").strip()
    if not isbn or not user:
        return jsonify({"error": "Missing isbn or user"}), 400
    success, msg = checkout_book(isbn, user)
    return jsonify({"success": success, "message": msg}), (200 if success else 400)


@app.route("/api/return", methods=["POST"])
def do_return():
    data = request.json or {}
    isbn = data.get("isbn", "").strip()
    if not isbn:
        return jsonify({"error": "Missing isbn"}), 400
    success, msg = return_book(isbn)
    return jsonify({"success": success, "message": msg}), (200 if success else 400)


@app.route("/api/circulation", methods=["GET"])
def get_circulation():
    try:
        limit = int(request.args.get("limit", 100))
        return jsonify(fetch_circulation_log(limit))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Admin: ISBN Lookup ────────────────────────────────────────────────────────

@app.route("/api/admin/isbn-lookup", methods=["GET"])
def isbn_lookup():
    """GET /api/admin/isbn-lookup?isbn=0785211578 — live metadata preview"""
    isbn = request.args.get("isbn", "").strip()
    if not isbn:
        return jsonify({"error": "Missing isbn parameter"}), 400
    try:
        metadata = resolve_isbn(isbn)
        return jsonify(metadata)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/admin/isbn-save", methods=["POST"])
def isbn_save():
    """Save a single ISBN's metadata directly to the library."""
    data = request.json or {}
    isbn = data.get("isbn", "").strip()
    if not isbn:
        return jsonify({"error": "Missing isbn"}), 400
    try:
        metadata = enrich_metadata(isbn)
        count = upsert_books([metadata])
        return jsonify({"success": True, "book": metadata, "saved": count})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Admin: Bulk Upload ────────────────────────────────────────────────────────

@app.route("/api/admin/upload-csv", methods=["POST"])
def upload_csv():
    """Upload a CSV of ISBNs, enrich all, upsert to Snowflake."""
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    if not file.filename.endswith(".csv"):
        return jsonify({"error": "File must be a .csv"}), 400

    try:
        df = pd.read_csv(file, dtype=str)
        isbn_col = next((c for c in df.columns if c.strip().upper() == "ISBN"), None)
        if not isbn_col:
            return jsonify({"error": "CSV must contain an 'ISBN' column"}), 400

        isbns = df[isbn_col].dropna().str.strip().tolist()
        enriched = [enrich_metadata(isbn) for isbn in isbns if isbn]
        saved = upsert_books([b for b in enriched if b])

        errors = [b["ISBN"] for b in enriched if b.get("Source") == "Not Found"]
        return jsonify({
            "success": True,
            "processed": len(isbns),
            "saved": saved,
            "errors": errors,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Admin: Circulation Log ────────────────────────────────────────────────────

@app.route("/api/admin/circulation", methods=["GET"])
def admin_circulation():
    try:
        limit = int(request.args.get("limit", 200))
        return jsonify(fetch_circulation_log(limit))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/circulation", methods=["GET"])
def circulation():
    limit = request.args.get("limit", 200)
    try:
        conn = get_snowflake_connection()
        cursor = conn.cursor()
        cursor.execute(f"""
            SELECT 
                c.ISBN,
                c.ACTION,
                c.CHECKED_OUT_BY,
                c.CHECKED_OUT_AT,
                c.NOTES,
                b.TITLE
            FROM CHECKOUTS_WESLEY c
            LEFT JOIN WESLEY_LIBRARY b ON c.ISBN = b.ISBN
            ORDER BY c.CHECKED_OUT_AT DESC
            LIMIT {limit}
        """)
        columns = [col[0].lower() for col in cursor.description]
        results = [dict(zip(columns, row)) for row in cursor.fetchall()]
        cursor.close()
        conn.close()
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Run ───────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5050))
    print(f"🚀 Wesley Library API running on http://localhost:{port}")
    app.run(debug=True, host="localhost", port=port)
