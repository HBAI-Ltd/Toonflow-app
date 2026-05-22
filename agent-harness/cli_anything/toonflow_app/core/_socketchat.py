"""Shared Socket.IO chat driver for the script/production agents.

Both ScriptAgent (/api/socket/scriptAgent) and ProductionAgent
(/api/socket/productionAgent) speak the same protocol:

  handshake auth = {token, isolationKey, projectId, scriptId}
  client emits:   chat {content} | stop | updateThinkConfig {think, thinkLevel}
  server emits:   message (init), content:add / content:update (stream chunks),
                  message:update {status: pending|complete|error}

This module connects, sends one chat message, streams the assistant response,
and returns it. It is a real, potentially PAID LLM operation — callers gate it
behind --confirm in the CLI layer.

Requires the optional ``python-socketio[client]`` dependency.
"""

from __future__ import annotations

from typing import Any, Optional

from cli_anything.toonflow_app.core.api import require_project
from cli_anything.toonflow_app.core.session import Session
from cli_anything.toonflow_app.utils.toonflow_app_backend import ToonflowError


def agent_chat(
    sess: Session,
    message: str,
    namespace: str,
    project_id: Optional[int] = None,
    script_id: Optional[int] = None,
    think: bool = False,
    think_level: int = 0,
    timeout: int = 180,
) -> dict[str, Any]:
    """Connect to ``namespace``, send one chat message, stream the reply, return it."""
    try:
        import socketio  # type: ignore
    except ImportError:
        raise ToonflowError(
            "agent chat needs python-socketio. Install with: "
            "pip install 'cli-anything-toonflow-app[socket]' "
            "(or: pip install python-socketio[client])"
        ) from None

    token = sess.get("token")
    if not token:
        raise ToonflowError("Not authenticated. Run: auth login ...")
    pid = require_project(sess, project_id)
    sid = script_id if script_id is not None else sess.get("script_id")
    base_url = (sess.get("base_url") or "http://localhost:10588").rstrip("/")
    isolation_key = sess.get("isolation_key") or "agent-cli"

    sio = socketio.Client(reconnection=False)
    collected: dict[str, Any] = {
        "messages": [],
        "content": [],
        "status": None,
        "error": None,
    }
    done = {"flag": False}

    @sio.on("message", namespace=namespace)
    def _on_message(data):  # noqa: ANN001
        collected["messages"].append(data)

    @sio.on("content:add", namespace=namespace)
    def _on_content_add(data):  # noqa: ANN001
        collected["content"].append(data)

    @sio.on("content:update", namespace=namespace)
    def _on_content_update(data):  # noqa: ANN001
        collected["content"].append(data)

    @sio.on("message:update", namespace=namespace)
    def _on_message_update(data):  # noqa: ANN001
        status = (data or {}).get("status")
        collected["status"] = status
        if status in ("complete", "error"):
            if status == "error":
                collected["error"] = (data or {}).get("ext", {}).get("error")
            done["flag"] = True

    try:
        sio.connect(
            base_url,
            namespaces=[namespace],
            auth={
                "token": token,
                "isolationKey": isolation_key,
                "projectId": pid,
                "scriptId": sid,
            },
            wait_timeout=15,
        )
    except Exception as e:  # noqa: BLE001
        raise ToonflowError(
            f"Socket.IO connect failed: {e}. Is the server running and the "
            f"token valid?"
        ) from None

    try:
        if think:
            # Emit both keys: thinkLevel (new) + thinlLevel (legacy) so the
            # call works against any backend version. Handlers accept either.
            sio.emit(
                "updateThinkConfig",
                {
                    "think": True,
                    "thinkLevel": int(think_level),
                    "thinlLevel": int(think_level),
                },
                namespace=namespace,
            )
        sio.emit("chat", {"content": message}, namespace=namespace)
        sio.sleep(0)  # yield
        waited = 0.0
        while not done["flag"] and waited < timeout:
            sio.sleep(0.5)
            waited += 0.5
    finally:
        try:
            sio.disconnect()
        except Exception:  # noqa: BLE001
            pass

    return {
        "project_id": pid,
        "script_id": sid,
        "status": collected["status"] or ("timeout" if not done["flag"] else None),
        "error": collected["error"],
        "messages": collected["messages"],
        "content": collected["content"],
    }
