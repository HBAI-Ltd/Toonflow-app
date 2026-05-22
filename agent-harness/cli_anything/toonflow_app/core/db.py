"""Database domain — /api/setting/dbConfig/* (export / import the SQLite data).

export is the ONLY GET route in Toonflow-app's API; it streams a JSON file
``{exportTime, tables:{...}}``. import takes ``{tables:{...}}`` and replaces
all data — destructive, so the CLI gates it behind --confirm.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from cli_anything.toonflow_app.core.api import client_from_session
from cli_anything.toonflow_app.core.session import Session
from cli_anything.toonflow_app.utils.toonflow_app_backend import ToonflowError


def export_db(sess: Session, out_path: str) -> dict[str, Any]:
    """GET /api/setting/dbConfig/exportData -> write JSON backup to out_path."""
    client = client_from_session(sess)
    raw = client.get(
        "/api/setting/dbConfig/exportData", raw_response=True, timeout=300
    )
    out = Path(out_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(raw)
    try:
        parsed = json.loads(raw.decode("utf-8"))
        tables = list((parsed.get("tables") or {}).keys())
    except Exception:  # noqa: BLE001
        tables = []
    return {
        "output": str(out.resolve()),
        "bytes": len(raw),
        "tables": tables,
    }


def import_db(sess: Session, in_path: str, confirmed: bool) -> Any:
    """POST /api/setting/dbConfig/importData (DESTRUCTIVE — needs confirm)."""
    if not confirmed:
        raise ToonflowError(
            "Refusing destructive DB import without --confirm."
        )
    p = Path(in_path)
    if not p.is_file():
        raise FileNotFoundError(f"Backup file not found: {in_path}")
    payload = json.loads(p.read_text(encoding="utf-8"))
    tables = payload.get("tables", payload)
    client = client_from_session(sess)
    return client.post(
        "/api/setting/dbConfig/importData", {"tables": tables}, timeout=300
    )


def info(sess: Session) -> Any:
    """GET /api/setting/dbConfig/dbInfo (read-only, zero cost).

    Like exportData, dbInfo is a GET route in Toonflow-app.
    """
    client = client_from_session(sess)
    return client.get("/api/setting/dbConfig/dbInfo")
