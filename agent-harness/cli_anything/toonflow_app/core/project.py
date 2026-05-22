"""Project domain — wraps /api/project/* on the real Toonflow-app backend."""

from __future__ import annotations

from typing import Any, Optional

from cli_anything.toonflow_app.core.api import client_from_session, require_project
from cli_anything.toonflow_app.core.session import Session

# Defaults mirror Toonflow-app's addProject zod schema (all string fields).
_ADD_DEFAULTS = {
    "projectType": "shortDrama",
    "intro": "",
    "type": "novel",
    "artStyle": "",
    "directorManual": "",
    "videoRatio": "9:16",
    "imageModel": "",
    "videoModel": "",
    "imageQuality": "standard",
    "mode": "agent",
}


def create(sess: Session, name: str, **overrides: Any) -> dict[str, Any]:
    """POST /api/project/addProject. ``overrides`` may set any schema field."""
    client = client_from_session(sess)
    body = dict(_ADD_DEFAULTS)
    body["name"] = name
    for k, v in overrides.items():
        if v is not None:
            body[k] = v
    result = client.post("/api/project/addProject", body)
    return {"created": True, "name": name, "result": result}


def list_projects(sess: Session) -> list[dict[str, Any]]:
    """POST /api/project/getProject -> all projects."""
    client = client_from_session(sess)
    data = client.post("/api/project/getProject", {})
    return data if isinstance(data, list) else (data or [])


def get(sess: Session, project_id: Optional[int] = None) -> dict[str, Any]:
    pid = require_project(sess, project_id)
    for p in list_projects(sess):
        if int(p.get("id", -1)) == pid:
            return p
    raise ValueError(f"Project {pid} not found")


def edit(sess: Session, project_id: int, **fields: Any) -> dict[str, Any]:
    """POST /api/project/editProject. Missing fields are filled from current."""
    client = client_from_session(sess)
    current = get(sess, project_id)
    body: dict[str, Any] = {"id": int(project_id)}
    for key in (
        "name",
        "intro",
        "type",
        "artStyle",
        "directorManual",
        "videoRatio",
        "imageModel",
        "videoModel",
        "projectType",
        "imageQuality",
        "mode",
    ):
        body[key] = fields.get(key, current.get(key, _ADD_DEFAULTS.get(key, "")))
    result = client.post("/api/project/editProject", body)
    return {"edited": True, "id": int(project_id), "result": result}


def delete(sess: Session, project_id: int) -> dict[str, Any]:
    client = client_from_session(sess)
    result = client.post("/api/project/delProject", {"id": int(project_id)})
    if sess.get("project_id") == int(project_id):
        # sess.update() skips None values, so use set() to actually clear it.
        sess.set("project_id", None)
    return {"deleted": True, "id": int(project_id), "result": result}


def use(sess: Session, project_id: int) -> dict[str, Any]:
    """Set the current project id in the session (no server call)."""
    sess.update(project_id=int(project_id))
    return {"project_id": int(project_id)}
