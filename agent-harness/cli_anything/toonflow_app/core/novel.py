"""Novel domain — wraps /api/novel/* (import chapters, list, extract events)."""

from __future__ import annotations

from typing import Any, Optional

from cli_anything.toonflow_app.core.api import client_from_session, require_project
from cli_anything.toonflow_app.core.session import Session


def import_chapters(
    sess: Session,
    chapters: list[dict[str, Any]],
    project_id: Optional[int] = None,
) -> dict[str, Any]:
    """POST /api/novel/addNovel.

    Each chapter dict needs: index(int), reel(str), chapter(str),
    chapterData(str).
    """
    client = client_from_session(sess)
    pid = require_project(sess, project_id)
    norm = []
    for i, c in enumerate(chapters):
        norm.append(
            {
                "index": int(c.get("index", i + 1)),
                "reel": str(c.get("reel", "")),
                "chapter": str(c.get("chapter", f"Chapter {i + 1}")),
                "chapterData": str(c.get("chapterData", "")),
            }
        )
    result = client.post(
        "/api/novel/addNovel", {"projectId": pid, "data": norm}
    )
    return {"imported": len(norm), "project_id": pid, "result": result}


def list_chapters(
    sess: Session,
    project_id: Optional[int] = None,
    page: int = 1,
    limit: int = 50,
    search: Optional[str] = None,
) -> Any:
    """POST /api/novel/getNovel (paginated)."""
    client = client_from_session(sess)
    pid = require_project(sess, project_id)
    body: dict[str, Any] = {"projectId": pid, "page": page, "limit": limit}
    if search:
        body["search"] = search
    return client.post("/api/novel/getNovel", body)


def extract_events(
    sess: Session,
    novel_ids: list[int],
    project_id: Optional[int] = None,
    concurrent_count: Optional[int] = None,
) -> dict[str, Any]:
    """POST /api/novel/event/generateEvents — clean novel text -> event list.

    This drives the real backend's novel-cleaning pipeline (no extra paid LLM
    call is forced beyond what the configured vendor performs).
    """
    client = client_from_session(sess)
    pid = require_project(sess, project_id)
    body: dict[str, Any] = {
        "projectId": pid,
        "novelIds": [int(x) for x in novel_ids],
    }
    if concurrent_count:
        body["concurrentCount"] = int(concurrent_count)
    result = client.post(
        "/api/novel/event/generateEvents", body, timeout=600
    )
    return {"project_id": pid, "novel_ids": body["novelIds"], "result": result}
