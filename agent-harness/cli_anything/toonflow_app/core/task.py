"""Task domain — /api/task/* (read-only, zero cost)."""

from __future__ import annotations

import time
from typing import Any, Optional

from cli_anything.toonflow_app.core.api import client_from_session
from cli_anything.toonflow_app.core.session import Session

# Backend task states considered "still running". Best-effort: any state NOT in
# this set is treated as terminal. Kept broad/lowercased to tolerate the
# backend's vocabulary; override via ``running_states`` if it differs.
RUNNING_TASK_STATES = {
    "pending", "running", "processing", "queue", "queued",
    "doing", "wait", "waiting", "start", "started", "0", "1",
}


def _extract_rows(resp: Any) -> list[dict[str, Any]]:
    """Pull a list of task rows out of the {code,data,message} envelope."""
    data = resp.get("data", resp) if isinstance(resp, dict) else resp
    if isinstance(data, dict):
        for key in ("list", "rows", "items", "data", "records"):
            if isinstance(data.get(key), list):
                return data[key]
        return []
    return data if isinstance(data, list) else []


def list_tasks(
    sess: Session,
    page: int = 1,
    limit: int = 10,
    state: Optional[str] = None,
    task_class: Optional[str] = None,
    project_id: Optional[int] = None,
) -> Any:
    """POST /api/task/getTaskApi (paginated; all filters optional)."""
    client = client_from_session(sess)
    body: dict[str, Any] = {"page": int(page), "limit": int(limit)}
    if state:
        body["state"] = state
    if task_class:
        body["taskClass"] = task_class
    pid = project_id if project_id is not None else sess.get("project_id")
    if pid is not None:
        body["projectId"] = int(pid)
    return client.post("/api/task/getTaskApi", body)


def details(sess: Session, task_id: int) -> Any:
    """POST /api/task/taskDetails."""
    client = client_from_session(sess)
    return client.post("/api/task/taskDetails", {"taskId": int(task_id)})


def categories(sess: Session) -> Any:
    """POST /api/task/getTaskCategories."""
    client = client_from_session(sess)
    return client.post("/api/task/getTaskCategories", {})


def wait_for_tasks(
    sess: Session,
    project_id: Optional[int] = None,
    *,
    interval: float = 3.0,
    timeout: int = 600,
    running_states: Optional[set[str]] = None,
) -> dict[str, Any]:
    """Poll getTaskApi until no project task is in a running state (best-effort).

    Read-only / zero cost itself (it just polls). Returns a small summary
    ``{done, waited, active, total}``. ``done`` is False if the timeout was hit
    while tasks were still running. Treats any state not in ``running_states``
    as terminal, so it degrades gracefully if the backend's vocabulary differs.
    """
    running = {s.lower() for s in (running_states or RUNNING_TASK_STATES)}
    pid = project_id if project_id is not None else sess.get("project_id")
    deadline = time.time() + timeout
    waited = 0.0
    rows: list[dict[str, Any]] = []
    while True:
        rows = _extract_rows(list_tasks(sess, page=1, limit=100, project_id=pid))
        active = [r for r in rows if str((r or {}).get("state", "")).lower() in running]
        if not active:
            return {"done": True, "waited": round(waited, 1),
                    "active": 0, "total": len(rows)}
        if time.time() >= deadline:
            return {"done": False, "waited": round(waited, 1),
                    "active": len(active), "total": len(rows)}
        time.sleep(interval)
        waited += interval
