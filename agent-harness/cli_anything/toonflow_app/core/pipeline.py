"""Pipeline domain — end-to-end orchestration of the short-drama chain.

Chains the existing single-purpose operations into ONE resumable flow:

  novel-import → extract-events → script (ScriptAgent chat)
  → storyboard (ProductionAgent chat) → [generate-image]

Design:
- novel-import is zero cost; every later stage is a real, potentially PAID
  operation (event extraction / LLM / image model), so ``pipeline run``
  requires --confirm to execute and --dry-run to preview the plan without
  touching the network.
- Per-stage completion is recorded in the session under the "pipeline" key,
  so a re-run resumes after the last finished stage (--restart redoes all).
- Video (出片) is intentionally NOT part of the automatic run: the
  /api/production/workbench/generateVideo endpoint needs per-shot upload data,
  model, mode, resolution and duration that are not derivable generically.
  Drive video explicitly via ``production generate-video``, or let the
  ProductionAgent handle it during the storyboard stage.
"""

from __future__ import annotations

import json
from typing import Any, Optional

from cli_anything.toonflow_app.core import novel as novel_mod
from cli_anything.toonflow_app.core import production as prod_mod
from cli_anything.toonflow_app.core import scriptagent as scriptagent_mod
from cli_anything.toonflow_app.core import task as task_mod
from cli_anything.toonflow_app.core.api import require_project
from cli_anything.toonflow_app.core.session import Session
from cli_anything.toonflow_app.utils.toonflow_app_backend import ToonflowError

DEFAULT_SCRIPT_MESSAGE = (
    "请基于已导入的小说与已提取的章节事件，完成故事骨架、改编策略，并产出结构化剧本。"
)
DEFAULT_STORYBOARD_MESSAGE = (
    "请基于已生成的剧本，产出导演规划、分镜表与分镜面板，并准备所需的衍生资产与分镜图。"
)


def build_plan(with_image: bool = False) -> list[dict[str, Any]]:
    """Return the ordered pipeline stages (pure; no network).

    Each entry: ``{name, paid, desc}``. ``paid`` stages require --confirm.
    """
    plan: list[dict[str, Any]] = [
        {"name": "novel-import", "paid": False,
         "desc": "导入小说章节 (/api/novel/addNovel)"},
        {"name": "extract-events", "paid": True,
         "desc": "提取章节事件 (/api/novel/event/generateEvents)"},
        {"name": "script", "paid": True,
         "desc": "ScriptAgent 生成结构化剧本 (socket /api/socket/scriptAgent)"},
        {"name": "storyboard", "paid": True,
         "desc": "ProductionAgent 生成分镜 (socket /api/socket/productionAgent)"},
    ]
    if with_image:
        plan.append(
            {"name": "generate-image", "paid": True,
             "desc": "批量生成分镜图 (/api/production/storyboard/batchGenerateImage)"}
        )
    return plan


# ── session-backed resume state ────────────────────────────────────────────


def _pipeline_state(sess: Session, pid: Optional[int]) -> dict[str, Any]:
    st = sess.get("pipeline") or {}
    if not isinstance(st, dict) or st.get("project_id") != pid:
        st = {"project_id": pid, "completed": []}
    st.setdefault("completed", [])
    return st


def _mark_done(sess: Session, st: dict[str, Any], stage: str) -> None:
    if stage not in st["completed"]:
        st["completed"].append(stage)
    sess.set("pipeline", st)


# ── response parsing (best-effort; envelopes vary) ──────────────────────────


def _rows(resp: Any) -> list[dict[str, Any]]:
    data = resp.get("data", resp) if isinstance(resp, dict) else resp
    if isinstance(data, dict):
        for key in ("list", "rows", "items", "data", "records"):
            if isinstance(data.get(key), list):
                return data[key]
        return []
    return data if isinstance(data, list) else []


def _ids(resp: Any) -> list[int]:
    out: list[int] = []
    for r in _rows(resp):
        if isinstance(r, dict) and r.get("id") is not None:
            try:
                out.append(int(r["id"]))
            except (TypeError, ValueError):
                pass
    return out


# ── execution ───────────────────────────────────────────────────────────────


def run(
    sess: Session,
    *,
    novel_file: Optional[str] = None,
    chapters: Optional[list[dict[str, Any]]] = None,
    script_message: str = DEFAULT_SCRIPT_MESSAGE,
    storyboard_message: str = DEFAULT_STORYBOARD_MESSAGE,
    with_image: bool = False,
    storyboard_ids: Optional[list[int]] = None,
    confirm: bool = False,
    dry_run: bool = False,
    restart: bool = False,
    poll: bool = True,
    timeout: int = 600,
    think: bool = False,
    think_level: int = 0,
) -> dict[str, Any]:
    """Execute the end-to-end pipeline (resumable). See module docstring."""
    plan = build_plan(with_image=with_image)
    pid = sess.get("project_id")

    if dry_run:
        st = _pipeline_state(sess, pid)
        steps = [
            {**s, "skip_completed": (s["name"] in st["completed"]) and not restart}
            for s in plan
        ]
        return {
            "dry_run": True,
            "project_id": pid,
            "plan": steps,
            "note": "no network calls performed; pass --confirm to execute.",
        }

    if not confirm:
        raise ToonflowError(
            "pipeline run executes paid stages (events/LLM/image) — pass "
            "--confirm to run, or --dry-run to preview the plan."
        )

    pid = require_project(sess)
    st = _pipeline_state(sess, pid)
    if restart:
        st = {"project_id": pid, "completed": []}
        sess.set("pipeline", st)

    results: dict[str, Any] = {}
    for stage in plan:
        name = stage["name"]
        if name in st["completed"] and not restart:
            results[name] = {"skipped": "already completed"}
            continue
        results[name] = _run_stage(
            sess, name, pid,
            novel_file=novel_file, chapters=chapters,
            script_message=script_message,
            storyboard_message=storyboard_message,
            storyboard_ids=storyboard_ids,
            poll=poll, timeout=timeout, think=think, think_level=think_level,
        )
        _mark_done(sess, st, name)

    return {"project_id": pid, "completed": st["completed"], "results": results}


def _load_chapters(
    novel_file: Optional[str], chapters: Optional[list[dict[str, Any]]]
) -> list[dict[str, Any]]:
    if chapters is not None:
        return chapters
    if novel_file:
        with open(novel_file, encoding="utf-8") as f:
            return json.load(f)
    raise ToonflowError(
        "novel-import stage needs --novel-file (JSON chapter list) or chapters."
    )


def _run_stage(
    sess: Session,
    name: str,
    pid: int,
    *,
    novel_file: Optional[str],
    chapters: Optional[list[dict[str, Any]]],
    script_message: str,
    storyboard_message: str,
    storyboard_ids: Optional[list[int]],
    poll: bool,
    timeout: int,
    think: bool,
    think_level: int,
) -> dict[str, Any]:
    if name == "novel-import":
        return novel_mod.import_chapters(sess, _load_chapters(novel_file, chapters), pid)

    if name == "extract-events":
        ids = _ids(novel_mod.list_chapters(sess, pid, page=1, limit=1000))
        if not ids:
            raise ToonflowError("extract-events: no imported chapters found.")
        res = novel_mod.extract_events(sess, ids, pid)
        if poll:
            res["poll"] = task_mod.wait_for_tasks(sess, pid, timeout=timeout)
        return res

    if name == "script":
        return scriptagent_mod.chat(
            sess, script_message, pid,
            think=think, think_level=think_level, timeout=timeout,
        )

    if name == "storyboard":
        return prod_mod.storyboard_chat(
            sess, storyboard_message, pid,
            think=think, think_level=think_level, timeout=timeout,
        )

    if name == "generate-image":
        ids = storyboard_ids or _ids(prod_mod.storyboard(sess, pid))
        if not ids:
            raise ToonflowError(
                "generate-image: no storyboard panels found; run the storyboard "
                "stage first or pass --storyboard-ids."
            )
        res = prod_mod.generate_image(sess, ids, True, pid)
        if poll:
            res["poll"] = task_mod.wait_for_tasks(sess, pid, timeout=timeout)
        return res

    raise ToonflowError(f"unknown pipeline stage: {name}")
