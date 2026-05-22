"""Auth domain: log in to Toonflow-app and store the Bearer token in session."""

from __future__ import annotations

from typing import Any

from cli_anything.toonflow_app.core.api import client_from_session
from cli_anything.toonflow_app.core.session import Session


def login(sess: Session, username: str, password: str) -> dict[str, Any]:
    """POST /api/login/login -> store Bearer token + username in the session."""
    client = client_from_session(sess, require_auth=False)
    data = client.login(username, password)
    sess.update(token=data.get("token"), username=data.get("name"))
    return {
        "username": data.get("name"),
        "user_id": data.get("id"),
        "token_present": bool(data.get("token")),
    }


def whoami(sess: Session) -> dict[str, Any]:
    return {
        "base_url": sess.get("base_url"),
        "username": sess.get("username"),
        "authenticated": bool(sess.get("token")),
        "project_id": sess.get("project_id"),
        "script_id": sess.get("script_id"),
    }
