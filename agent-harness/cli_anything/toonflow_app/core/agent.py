"""Agent deploy domain — /api/setting/agentDeploy/*.

Binds an internal Toonflow agent (e.g. the ScriptAgent) to a model/vendor.
"""

from __future__ import annotations

from typing import Any, Optional

from cli_anything.toonflow_app.core.api import client_from_session
from cli_anything.toonflow_app.core.session import Session


def list_deploy(sess: Session) -> Any:
    """POST /api/setting/agentDeploy/getAgentDeploy."""
    client = client_from_session(sess)
    return client.post("/api/setting/agentDeploy/getAgentDeploy", {})


def deploy(
    sess: Session,
    deploy_id: int,
    name: str,
    model: str,
    model_name: str,
    desc: str,
    vendor_id: Optional[str] = None,
    temperature: Optional[float] = None,
    max_output_tokens: Optional[int] = None,
) -> Any:
    """POST /api/setting/agentDeploy/deployAgentModel."""
    client = client_from_session(sess)
    body: dict[str, Any] = {
        "id": int(deploy_id),
        "name": name,
        "model": model,
        "modelName": model_name,
        "vendorId": vendor_id,
        "desc": desc,
    }
    if temperature is not None:
        body["temperature"] = float(temperature)
    if max_output_tokens is not None:
        body["maxOutputTokens"] = int(max_output_tokens)
    return client.post("/api/setting/agentDeploy/deployAgentModel", body)
