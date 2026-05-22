"""ScriptAgent domain — Socket.IO chat with Toonflow-app's 统筹 (ScriptAgent).

Namespace: /api/socket/scriptAgent
Auth handshake: {token, isolationKey, projectId, scriptId}
Client emits:   chat {content} | stop | updateThinkConfig {think, thinkLevel}
Server emits:   message (init), content:add / content:update (stream chunks),
                message:update (status: pending|complete|error)

This is a real, potentially paid LLM operation (it runs the ScriptAgent against
the configured text vendor). The CLI gates it behind --confirm.
"""

from __future__ import annotations

from typing import Any, Optional

from cli_anything.toonflow_app.core._socketchat import agent_chat
from cli_anything.toonflow_app.core.session import Session

NAMESPACE = "/api/socket/scriptAgent"


def chat(
    sess: Session,
    message: str,
    project_id: Optional[int] = None,
    script_id: Optional[int] = None,
    think: bool = False,
    think_level: int = 0,
    timeout: int = 180,
) -> dict[str, Any]:
    """Send one message to the ScriptAgent (统筹) and stream the reply.

    Thin wrapper over the shared Socket.IO driver (see core._socketchat).
    Requires the optional ``python-socketio[client]`` dependency.
    """
    return agent_chat(
        sess,
        message,
        NAMESPACE,
        project_id=project_id,
        script_id=script_id,
        think=think,
        think_level=think_level,
        timeout=timeout,
    )
