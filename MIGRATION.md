# The-Bible — Auth Migration & Setup Guide

## What Changed: Snowflake Authentication

### Before (mixed auth — 2 different methods)
| File | Auth Method | Problem |
|------|-------------|---------|
| `app.py` | JWT private key | ✓ Correct |
| `db.py` | Password (`SNOWFLAKE_PASSWORD`) | ✗ Less secure, inconsistent |
| `Check-In_Check-Out_Test.py` | Password | ✗ |
| `simulate_checkout_return.py` | Password | ✗ |
| `daily_library_imessage.py` | JWT private key | ✓ Correct |

### After (unified JWT everywhere)
All connections now route through `snowflake_conn.get_connection()`.
The `SNOWFLAKE_PASSWORD` variable is no longer needed anywhere.

---

## Required .env Variables

```env
# Snowflake (JWT auth — required)
SNOWFLAKE_USER=your_user@yourorg
SNOWFLAKE_ACCOUNT=yourorg-account
SNOWFLAKE_PRIVATE_KEY_PATH=/path/to/rsa_key.p8
SNOWFLAKE_WAREHOUSE=YOUR_WAREHOUSE
SNOWFLAKE_DATABASE=BIBLE
SNOWFLAKE_SCHEMA=BOOKS
SNOWFLAKE_ROLE=               # optional

# APIs (optional — improves metadata fallback)
GOOGLE_BOOKS_API_KEY=

# Web
CORS_ORIGIN=http://localhost:5173
PORT=5050

# Notifications
IMESSAGE_PHONE=6156046386
```

**Remove from .env:**
```
SNOWFLAKE_PASSWORD=   ← delete this line
```

---

## Generating a Private Key (if you haven't already)

```bash
# Generate RSA key pair
openssl genrsa 2048 | openssl pkcs8 -topk8 -nocrypt -out rsa_key.p8
openssl rsa -in rsa_key.p8 -pubout -out rsa_key.pub

# Register the public key with Snowflake
# In Snowflake worksheet:
ALTER USER your_user SET RSA_PUBLIC_KEY='<contents of rsa_key.pub, excluding header/footer>';
```

---

## Script Consolidation

### Retired scripts (replaced by `isbn_tools.py`)
- `isbn_catalog_stacker.py` → use `isbn_tools.batch_resolve_csv()`
- `loc_isbn_batch.py` → use `isbn_tools.batch_resolve_csv()`  
- `main.py` → use `isbn_tools.batch_resolve_csv()`

All three had overlapping ISBN resolution logic. `isbn_tools.py` consolidates them with:
- Better ISBN-9/10/13 normalization
- Pre-2001 LCCN support
- 4-source waterfall: LoC MODS → LoC DC → Open Library → Google Books

### CLI usage
```bash
# Batch resolve ISBNs.csv → Book_Metadata.csv
python isbn_tools.py ISBNs.csv Book_Metadata.csv

# Single lookup from Python
from isbn_tools import resolve_isbn
book = resolve_isbn("0785211578")
```

---

## Backend File Structure

```
backend/
├── snowflake_conn.py   ← NEW: single connection factory (JWT only)
├── db.py               ← Updated: uses snowflake_conn, adds search + stats
├── app.py              ← Updated: new /api/books, /api/stats, admin endpoints
├── enrich.py           ← Unchanged (was already clean)
├── isbn_tools.py       ← NEW: replaces 3 batch scripts
├── daily_library_imessage.py  ← Update import (see below)
└── requirements.txt
```

### Update daily_library_imessage.py
Replace the `get_snowflake_connection()` function with:
```python
from snowflake_conn import get_connection

def get_summary():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("CALL DAILY_LIBRARY_SUMMARY();")
    result = cursor.fetchone()
    cursor.close()
    conn.close()
    return result[0] if result else "No summary available."
```

---

## New API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/books` | All books; `?search=` for filtering |
| GET | `/api/books/:isbn` | Single book detail |
| GET | `/api/stats` | Total / available / checked out counts |
| POST | `/api/checkout` | `{isbn, user}` |
| POST | `/api/return` | `{isbn}` |
| GET | `/api/circulation` | Recent activity log |
| GET | `/api/admin/isbn-lookup?isbn=` | Live metadata preview |
| POST | `/api/admin/isbn-save` | Save one ISBN to library |
| POST | `/api/admin/upload-csv` | Bulk CSV import |
| GET | `/api/admin/circulation` | Full circulation log |

---

## Running Locally

```bash
# Backend
cd backend
pip install -r requirements.txt
python app.py          # runs on :5050

# Frontend
cd frontend
npm install
npm run dev            # runs on :5173
```
