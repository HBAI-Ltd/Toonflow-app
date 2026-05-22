"""Shared helpers binding the Session to a live ToonflowClient."""

from __future__ import annotations

from typing import Optional

from cli_anything.toonflow_app.core.session import Session
from cli_anything.toonflow_app.utils.toonflow_app_backend import (
    ToonflowClient,
    ToonflowError,
)


def client_from_session(sess: Session, require_auth: bool = True) -> ToonflowClient:
    """Build a ToonflowClient using base_url + token from the session."""
    base_url = sess.get("base_url") or "http://localhost:10588"
    token = sess.get("token")
    if require_auth and not token:
        raise ToonflowError(
            "Not authenticated. Run: cli-anything-toonflow-app auth login "
            "-u admin -p admin123"
        )
    return ToonflowClient(base_url=base_url, token=token)


def require_project(sess: Session, override: Optional[int] = None) -> int:
    pid = override if override is not None else sess.get("project_id")
    if pid is None:
        raise ToonflowError(
            "No current project. Set one: project use <id> (or create/list)."
        )
    return int(pid)


def require_script(sess: Session, override: Optional[int] = None) -> int:
    sid = override if override is not None else sess.get("script_id")
    if sid is None:
        raise ToonflowError(
            "No current script. Set one: script use <id> (or script list)."
        )
    return int(sid)
