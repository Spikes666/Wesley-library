"""
snowflake_conn.py — Single source of truth for all Snowflake connections.
Uses JWT (private key) authentication exclusively.

Required .env variables:
    SNOWFLAKE_USER
    SNOWFLAKE_ACCOUNT
    SNOWFLAKE_PRIVATE_KEY_PATH
    SNOWFLAKE_WAREHOUSE
    SNOWFLAKE_DATABASE
    SNOWFLAKE_SCHEMA
    SNOWFLAKE_ROLE  (optional)
"""

import os
from dotenv import load_dotenv
import snowflake.connector
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend

load_dotenv()


def _load_private_key() -> bytes:
    """Load and serialize the DER private key for JWT auth."""
    key_path = os.environ.get("SNOWFLAKE_PRIVATE_KEY_PATH")
    if not key_path:
        raise EnvironmentError("SNOWFLAKE_PRIVATE_KEY_PATH is not set in your .env file.")

    with open(key_path, "rb") as key_file:
        raw = key_file.read()

    # Support both PEM and DER formats
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
    Return an authenticated Snowflake connection using JWT.
    Always use this function — never instantiate connections directly.

    Usage:
        conn = get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT 1")
        finally:
            conn.close()
    """
    required = ["SNOWFLAKE_USER", "SNOWFLAKE_ACCOUNT", "SNOWFLAKE_PRIVATE_KEY_PATH",
                "SNOWFLAKE_WAREHOUSE", "SNOWFLAKE_DATABASE", "SNOWFLAKE_SCHEMA"]

    missing = [v for v in required if not os.environ.get(v)]
    if missing:
        raise EnvironmentError(f"Missing required environment variables: {', '.join(missing)}")

    return snowflake.connector.connect(
        user=os.environ["SNOWFLAKE_USER"],
        account=os.environ["SNOWFLAKE_ACCOUNT"],
        private_key=_load_private_key(),
        warehouse=os.environ["SNOWFLAKE_WAREHOUSE"],
        database=os.environ["SNOWFLAKE_DATABASE"],
        schema=os.environ["SNOWFLAKE_SCHEMA"],
        role=os.environ.get("SNOWFLAKE_ROLE", ""),
        authenticator="SNOWFLAKE_JWT",
    )
