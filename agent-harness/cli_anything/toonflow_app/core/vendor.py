"""Vendor domain — /api/setting/vendorConfig/*.

A Toonflow vendor is a TypeScript file exporting ``vendor`` + ``textRequest`` /
``imageRequest`` / ``videoRequest`` / ``ttsRequest`` functions. addVendor takes
the raw ``tsCode`` string; the backend compiles + validates it.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any, Optional

from cli_anything.toonflow_app.core.api import client_from_session
from cli_anything.toonflow_app.core.session import Session


def add(sess: Session, ts_code: str) -> Any:
    """POST /api/setting/vendorConfig/addVendor with raw TypeScript code."""
    client = client_from_session(sess)
    return client.post(
        "/api/setting/vendorConfig/addVendor", {"tsCode": ts_code}
    )


def add_from_file(sess: Session, path: str) -> Any:
    p = Path(path)
    if not p.is_file():
        raise FileNotFoundError(f"Vendor .ts file not found: {path}")
    return add(sess, p.read_text(encoding="utf-8"))


def list_vendors(sess: Session) -> Any:
    """POST /api/setting/vendorConfig/getVendorList."""
    client = client_from_session(sess)
    return client.post("/api/setting/vendorConfig/getVendorList", {})


def set_inputs(
    sess: Session, vendor_id: str, input_values: dict[str, str]
) -> Any:
    """POST /api/setting/vendorConfig/updateVendorInputs.

    ``input_values`` are the API keys / endpoints the vendor declared.
    """
    client = client_from_session(sess)
    return client.post(
        "/api/setting/vendorConfig/updateVendorInputs",
        {"id": vendor_id, "inputValues": input_values},
    )


def enable(sess: Session, vendor_id: str, enabled: bool = True) -> Any:
    """POST /api/setting/vendorConfig/enableVendor."""
    client = client_from_session(sess)
    return client.post(
        "/api/setting/vendorConfig/enableVendor",
        {"id": vendor_id, "enable": 1 if enabled else 0},
    )
