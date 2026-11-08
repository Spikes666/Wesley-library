"""
snowflake_conn.py — Single source of truth for all Snowflake connections.
Prefers JWT (private key) auth; falls back to password auth when the key
file is absent or unset.

Required .env variables (password auth):
    SNOWFLAKE_USER
    SNOWFLAKE_PASSWORD
    SNOWFLAKE_ACCOUNT
    SNOWFLAKE_WAREHOUSE
    SNOWFLAKE_DATABASE
    SNOWFLAKE_SCHEMA
    SNOWFLAKE_ROLE  (optional)

For JWT auth also set:
    SNOWFLAKE_PRIVATE_KEY_PATH
"""

import os
from dotenv import load_dotenv
import snowflake.connector
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend

load_dotenv()


def _load_private_key() -> bytes | None:
    """Load and serialize the private key for JWT auth. Returns None if unavailable."""
    key_path = os.environ.get("SNOWFLAKE_PRIVATE_KEY_PATH", "").strip()
    if not key_path or not os.path.exists(key_path):
        return None

    with open(key_path, "rb") as key_file:
        raw = key_file.read()

    try:
        p_key = serialization.load_pem_private_key(raw, password=None, backend=default_backend())
    except Exception:
        p_key = serialization.load_der_private_key(raw, password=None, backend=default_backend())

    return p_key.private_bytes(
        encoding=serialization.Encoding.DER,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )


def get_connection() -> snowflake.connector.SnowflakeConnection:
    """
    Return an authenticated Snowflake connection.
    Uses JWT (private key) when SNOWFLAKE_PRIVATE_KEY_PATH exists on disk,
    otherwise falls back to password auth via SNOWFLAKE_PASSWORD.
    """
    base_required = ["SNOWFLAKE_USER", "SNOWFLAKE_ACCOUNT",
                     "SNOWFLAKE_WAREHOUSE", "SNOWFLAKE_DATABASE", "SNOWFLAKE_SCHEMA"]
    missing = [v for v in base_required if not os.environ.get(v)]
    if missing:
        raise EnvironmentError(f"Missing required environment variables: {', '.join(missing)}")

    private_key = _load_private_key()

    common = dict(
        user=os.environ["SNOWFLAKE_USER"],
        account=os.environ["SNOWFLAKE_ACCOUNT"],
        warehouse=os.environ["SNOWFLAKE_WAREHOUSE"],
        database=os.environ["SNOWFLAKE_DATABASE"],
        schema=os.environ["SNOWFLAKE_SCHEMA"],
        role=os.environ.get("SNOWFLAKE_ROLE", ""),
    )

    if private_key:
        return snowflake.connector.connect(
            **common,
            private_key=private_key,
            authenticator="SNOWFLAKE_JWT",
        )

    password = os.environ.get("SNOWFLAKE_PASSWORD", "").strip()
    if not password:
        raise EnvironmentError(
            "No private key file found and SNOWFLAKE_PASSWORD is not set. "
            "Set one of SNOWFLAKE_PRIVATE_KEY_PATH or SNOWFLAKE_PASSWORD."
        )

    return snowflake.connector.connect(**common, password=password)
