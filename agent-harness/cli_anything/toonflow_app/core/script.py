"""Script domain — wraps /api/script/* and /api/scriptAgent/{get,set}PlanData."""

from __future__ import annotations

from typing import Any, Optional

from cli_anything.toonflow_app.core.api import client_from_session, require_project
from cli_anything.toonflow_app.core.session import Session


def add(
    sess: Session,
    name: str,
    content: str,
    assets: Optional[list[int]] = None,
    project_id: Optional[int] = None,
) -> dict[str, Any]:
    """POST /api/script/addScript."""
    client = client_from_session(sess)
    pid = require_project(sess, project_id)
    body = {
        "name": name,
        "content": content,
        "projectId": pid,
        "assets": [int(a) for a in (assets or [])],
    }
    result = client.post("/api/script/addScript", body)
    return {"added": True, "name": name, "project_id": pid, "result": result}


def list_scripts(
    sess: Session,
    project_id: Optional[int] = None,
    name: Optional[str] = None,
) -> Any:
    """POST /api/script/getScrptApi."""
    client = client_from_session(sess)
    pid = require_project(sess, project_id)
    body: dict[str, Any] = {"projectId": pid}
    if name:
        body["name"] = name
    return client.post("/api/script/getScrptApi", body)


def export_script(
    sess: Session, script_id: int, project_id: Optional[int] = None
) -> Any:
    """POST /api/script/exportScript."""
    client = client_from_session(sess)
    pid = require_project(sess, project_id)
    return client.post(
        "/api/script/exportScript",
        {"scriptId": int(script_id), "projectId": pid},
    )


def use(sess: Session, script_id: int) -> dict[str, Any]:
    sess.update(script_id=int(script_id))
    return {"script_id": int(script_id)}


def get_plan(sess: Session, project_id: Optional[int] = None) -> Any:
    """POST /api/scriptAgent/getPlanData (策划: story skeleton + strategy)."""
    client = client_from_session(sess)
    pid = require_project(sess, project_id)
    return client.post(
        "/api/scriptAgent/getPlanData",
        {"projectId": pid, "agentType": "scriptAgent"},
    )


def set_plan(
    sess: Session,
    story_skeleton: str,
    adaptation_strategy: str,
    project_id: Optional[int] = None,
) -> Any:
    """POST /api/scriptAgent/setPlanData."""
    client = client_from_session(sess)
    pid = require_project(sess, project_id)
    return client.post(
        "/api/scriptAgent/setPlanData",
        {
            "projectId": pid,
            "agentType": "scriptAgent",
            "data": {
                "storySkeleton": story_skeleton,
                "adaptationStrategy": adaptation_strategy,
            },
        },
    )
