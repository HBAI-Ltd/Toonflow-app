"""Production domain — storyboard + image/video generation (出片).

These call /api/production/* on the real backend. ``generate_image`` and
``generate_video`` trigger PAID image/video model calls, so the CLI gates them
behind an explicit ``--confirm`` flag (enforced in the CLI layer; this module
exposes a ``confirmed`` guard for defense in depth).
"""

from __future__ import annotations

from typing import Any, Optional

from cli_anything.toonflow_app.core._socketchat import agent_chat
from cli_anything.toonflow_app.core.api import (
    client_from_session,
    require_project,
    require_script,
)
from cli_anything.toonflow_app.core.session import Session
from cli_anything.toonflow_app.utils.toonflow_app_backend import ToonflowError

STORYBOARD_NAMESPACE = "/api/socket/productionAgent"


def storyboard_chat(
    sess: Session,
    message: str,
    project_id: Optional[int] = None,
    script_id: Optional[int] = None,
    think: bool = False,
    think_level: int = 0,
    timeout: int = 180,
) -> dict[str, Any]:
    """Send one message to the ProductionAgent (视频策划) and stream the reply.

    Drives the storyboard/分镜 agent over Socket.IO. This is a real,
    potentially PAID LLM operation; the CLI gates it behind --confirm.
    Thin wrapper over the shared driver (see core._socketchat).
    """
    return agent_chat(
        sess,
        message,
        STORYBOARD_NAMESPACE,
        project_id=project_id,
        script_id=script_id,
        think=think,
        think_level=think_level,
        timeout=timeout,
    )


def storyboard(
    sess: Session,
    project_id: Optional[int] = None,
    script_id: Optional[int] = None,
) -> Any:
    """POST /api/production/storyboard/getStoryboardData (read-only, zero cost)."""
    client = client_from_session(sess)
    pid = require_project(sess, project_id)
    body: dict[str, Any] = {"projectId": pid}
    sid = script_id if script_id is not None else sess.get("script_id")
    if sid is not None:
        body["scriptId"] = int(sid)
    return client.post("/api/production/storyboard/getStoryboardData", body)


def generate_image(
    sess: Session,
    storyboard_ids: list[int],
    confirmed: bool,
    project_id: Optional[int] = None,
    script_id: Optional[int] = None,
    concurrent_count: Optional[int] = None,
    compulsory: bool = False,
) -> Any:
    """POST /api/production/storyboard/batchGenerateImage (PAID — needs confirm)."""
    if not confirmed:
        raise ToonflowError(
            "Refusing to trigger paid image generation without --confirm."
        )
    client = client_from_session(sess)
    pid = require_project(sess, project_id)
    sid = require_script(sess, script_id)
    body: dict[str, Any] = {
        "storyboardIds": [int(x) for x in storyboard_ids],
        "projectId": pid,
        "scriptId": sid,
        "compulsory": bool(compulsory),
    }
    if concurrent_count:
        body["concurrentCount"] = int(concurrent_count)
    return client.post(
        "/api/production/storyboard/batchGenerateImage", body, timeout=600
    )


def generate_video(
    sess: Session,
    upload_data: list[dict[str, Any]],
    prompt: str,
    model: str,
    mode: str,
    resolution: str,
    duration: int,
    track_id: int,
    confirmed: bool,
    project_id: Optional[int] = None,
    script_id: Optional[int] = None,
    audio: Optional[bool] = None,
) -> Any:
    """POST /api/production/workbench/generateVideo (PAID — needs confirm)."""
    if not confirmed:
        raise ToonflowError(
            "Refusing to trigger paid video generation without --confirm."
        )
    client = client_from_session(sess)
    pid = require_project(sess, project_id)
    sid = require_script(sess, script_id)
    body: dict[str, Any] = {
        "projectId": pid,
        "scriptId": sid,
        "uploadData": [
            {"id": int(u["id"]), "sources": str(u["sources"])}
            for u in upload_data
        ],
        "prompt": prompt,
        "model": model,
        "mode": mode,
        "resolution": resolution,
        "duration": int(duration),
        "trackId": int(track_id),
    }
    if audio is not None:
        body["audio"] = bool(audio)
    return client.post(
        "/api/production/workbench/generateVideo", body, timeout=600
    )
