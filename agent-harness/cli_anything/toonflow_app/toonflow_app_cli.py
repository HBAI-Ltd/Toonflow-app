"""cli-anything-toonflow-app — stateful agent CLI for Toonflow-app.

Drives the REAL Toonflow-app Express REST + Socket.IO backend (server-only,
no Electron). REPL is the default; every command supports --json. Session
state (base URL, token, current project/script) is a JSON file with undo/redo
and auto-save.
"""

from __future__ import annotations

import json
import shlex
import sys
from typing import Any, Optional

import click

from cli_anything.toonflow_app.core import (
    agent as agent_mod,
    auth as auth_mod,
    db as db_mod,
    novel as novel_mod,
    pipeline as pipeline_mod,
    production as prod_mod,
    project as project_mod,
    script as script_mod,
    scriptagent as scriptagent_mod,
    task as task_mod,
    vendor as vendor_mod,
)
from cli_anything.toonflow_app.core.session import get_session
from cli_anything.toonflow_app.utils import toonflow_app_backend as backend
from cli_anything.toonflow_app.utils.repl_skin import ReplSkin

_repl_mode = False
_use_json = False

skin = ReplSkin("toonflow_app", version="1.0.0")


# ── output helpers ────────────────────────────────────────────────────────


def emit(obj: Any, human: Optional[str] = None) -> None:
    """Print a result honoring the global --json flag."""
    if _use_json:
        click.echo(json.dumps(obj, ensure_ascii=False, indent=2, default=str))
    else:
        if human is not None:
            click.echo(human)
        else:
            click.echo(json.dumps(obj, ensure_ascii=False, indent=2, default=str))


def handle_error(exc: Exception) -> None:
    msg = str(exc)
    if _use_json:
        click.echo(json.dumps({"error": msg}, ensure_ascii=False), err=True)
    else:
        skin.error(msg)
    if not _repl_mode:
        sys.exit(1)


def _maybe_load_project(project_path: Optional[str]) -> None:
    sess = get_session()
    if project_path:
        try:
            sess.load(project_path)
        except FileNotFoundError:
            sess.new()
            sess.project_path = project_path


# ── main group ────────────────────────────────────────────────────────────


@click.group(invoke_without_command=True)
@click.option("--json", "use_json", is_flag=True, help="Output as JSON")
@click.option(
    "--project",
    "project_path",
    type=str,
    default=None,
    help="Path to session/state JSON file",
)
@click.option(
    "--dry-run",
    "dry_run",
    is_flag=True,
    default=False,
    help="Run command without saving session changes to disk",
)
@click.pass_context
def cli(ctx: click.Context, use_json: bool, project_path: Optional[str], dry_run: bool):
    """cli-anything-toonflow-app — agent CLI for the Toonflow-app backend."""
    global _use_json
    _use_json = use_json
    ctx.ensure_object(dict)
    ctx.obj["dry_run"] = dry_run
    ctx.obj["project_path"] = project_path
    _maybe_load_project(project_path)
    if ctx.invoked_subcommand is None:
        ctx.invoke(repl, project_path=project_path)


@cli.result_callback()
@click.pass_context
def auto_save_on_exit(ctx, result, use_json, project_path, dry_run):
    """Auto-save the session after one-shot mutations."""
    if _repl_mode or dry_run:
        return
    sess = get_session()
    if sess.has_project() and sess._modified and sess.project_path:
        try:
            sess.save_session()
        except Exception as e:  # noqa: BLE001
            click.echo(f"Warning: Auto-save failed: {e}", err=True)


# ── session group ─────────────────────────────────────────────────────────


@cli.group()
def session():
    """Session/state management (new, info, undo, redo, set)."""


@session.command("new")
@click.option("-o", "--out", "out", type=str, required=True, help="Session file path")
@click.option("--base-url", default="http://localhost:10588", help="Toonflow-app URL")
def session_new(out: str, base_url: str):
    """Create a new session state file."""
    try:
        sess = get_session()
        sess.new(base_url=base_url)
        sess.save(out)
        emit(sess.state, f"Created session: {out}")
    except Exception as e:  # noqa: BLE001
        handle_error(e)


@session.command("info")
def session_info():
    """Show current session state."""
    try:
        emit(get_session().state)
    except Exception as e:  # noqa: BLE001
        handle_error(e)


@session.command("set")
@click.argument("key")
@click.argument("value")
def session_set(key: str, value: str):
    """Set a session field (base_url, isolation_key, project_id, script_id)."""
    try:
        sess = get_session()
        if key in ("project_id", "script_id"):
            sess.set(key, int(value))
        else:
            sess.set(key, value)
        emit(sess.state, f"{key} = {value}")
    except Exception as e:  # noqa: BLE001
        handle_error(e)


@session.command("undo")
def session_undo():
    """Undo the last session mutation."""
    ok = get_session().undo()
    emit({"undone": ok}, "Undone" if ok else "Nothing to undo")


@session.command("redo")
def session_redo():
    """Redo the last undone mutation."""
    ok = get_session().redo()
    emit({"redone": ok}, "Redone" if ok else "Nothing to redo")


# ── server group ──────────────────────────────────────────────────────────


@cli.group()
def server():
    """Server lifecycle (start/stop/status) — server-only mode, no Electron."""


@server.command("start")
@click.option("--mode", type=click.Choice(["dev", "start"]), default="dev")
@click.option("--wait", type=int, default=90, help="Seconds to wait for boot")
def server_start(mode: str, wait: int):
    """Start the Toonflow-app server (yarn dev / yarn start)."""
    try:
        sess = get_session()
        info = backend.server_start(
            mode=mode, base_url=sess.get("base_url"), wait=wait
        )
        emit(info, f"Server {info.get('status')} on {info.get('base_url')}")
    except Exception as e:  # noqa: BLE001
        handle_error(e)


@server.command("stop")
def server_stop():
    """Stop a server previously started by this CLI."""
    try:
        emit(backend.server_stop(get_session().get("base_url")))
    except Exception as e:  # noqa: BLE001
        handle_error(e)


@server.command("status")
def server_status():
    """Probe whether the Toonflow-app server is reachable (zero cost)."""
    try:
        emit(backend.server_status(get_session().get("base_url")))
    except Exception as e:  # noqa: BLE001
        handle_error(e)


# ── auth group ────────────────────────────────────────────────────────────


@cli.group()
def auth():
    """Authentication (login, whoami)."""


@auth.command("login")
@click.option("-u", "--username", default="admin")
@click.option("-p", "--password", default="admin123")
def auth_login(username: str, password: str):
    """POST /api/login/login and store the Bearer token in the session."""
    try:
        res = auth_mod.login(get_session(), username, password)
        emit(res, f"Logged in as {res.get('username')}")
    except Exception as e:  # noqa: BLE001
        handle_error(e)


@auth.command("whoami")
def auth_whoami():
    """Show auth/session context."""
    try:
        emit(auth_mod.whoami(get_session()))
    except Exception as e:  # noqa: BLE001
        handle_error(e)


# ── project group ─────────────────────────────────────────────────────────


@cli.group()
def project():
    """Project management (create, list, get, edit, delete, use)."""


@project.command("create")
@click.option("-n", "--name", required=True)
@click.option("--intro", default="")
@click.option("--project-type", "projectType", default="shortDrama")
@click.option("--type", "type_", default="novel")
@click.option("--art-style", "artStyle", default="")
@click.option("--video-ratio", "videoRatio", default="9:16")
@click.option("--image-model", "imageModel", default="")
@click.option("--video-model", "videoModel", default="")
@click.option("--image-quality", "imageQuality", default="standard")
@click.option("--mode", default="agent")
def project_create(name, intro, projectType, type_, artStyle, videoRatio,
                   imageModel, videoModel, imageQuality, mode):
    """POST /api/project/addProject."""
    try:
        res = project_mod.create(
            get_session(), name, intro=intro, projectType=projectType,
            type=type_, artStyle=artStyle, videoRatio=videoRatio,
            imageModel=imageModel, videoModel=videoModel,
            imageQuality=imageQuality, mode=mode,
        )
        emit(res, f"Created project: {name}")
    except Exception as e:  # noqa: BLE001
        handle_error(e)


@project.command("list")
def project_list():
    """POST /api/project/getProject — list all projects."""
    try:
        data = project_mod.list_projects(get_session())
        emit(data)
    except Exception as e:  # noqa: BLE001
        handle_error(e)


@project.command("get")
@click.option("--id", "pid", type=int, default=None)
def project_get(pid: Optional[int]):
    """Get a single project (uses current project if --id omitted)."""
    try:
        emit(project_mod.get(get_session(), pid))
    except Exception as e:  # noqa: BLE001
        handle_error(e)


@project.command("edit")
@click.option("--id", "pid", type=int, required=True)
@click.option("-n", "--name", default=None)
@click.option("--intro", default=None)
@click.option("--art-style", "artStyle", default=None)
def project_edit(pid, name, intro, artStyle):
    """POST /api/project/editProject (only changed fields need passing)."""
    try:
        fields = {k: v for k, v in
                  {"name": name, "intro": intro, "artStyle": artStyle}.items()
                  if v is not None}
        emit(project_mod.edit(get_session(), pid, **fields))
    except Exception as e:  # noqa: BLE001
        handle_error(e)


@project.command("delete")
@click.option("--id", "pid", type=int, required=True)
@click.option("--confirm", is_flag=True, help="Confirm deletion")
def project_delete(pid: int, confirm: bool):
    """POST /api/project/delProject (cascades; needs --confirm)."""
    try:
        if not confirm:
            raise backend.ToonflowError(
                "Project delete is destructive — pass --confirm."
            )
        emit(project_mod.delete(get_session(), pid))
    except Exception as e:  # noqa: BLE001
        handle_error(e)


@project.command("use")
@click.argument("pid", type=int)
def project_use(pid: int):
    """Set the current project id in the session."""
    try:
        emit(project_mod.use(get_session(), pid), f"Current project: {pid}")
    except Exception as e:  # noqa: BLE001
        handle_error(e)


# ── novel group ───────────────────────────────────────────────────────────


@cli.group()
def novel():
    """Novel import/list/extract-events (/api/novel/*)."""


@novel.command("import")
@click.option("--file", "json_file", type=str, required=True,
              help="JSON file: list of {index,reel,chapter,chapterData}")
@click.option("--project-id", type=int, default=None)
def novel_import(json_file: str, project_id: Optional[int]):
    """POST /api/novel/addNovel — import chapters from a JSON file."""
    try:
        with open(json_file, encoding="utf-8") as f:
            chapters = json.load(f)
        if isinstance(chapters, dict):
            chapters = chapters.get("data", [])
        emit(novel_mod.import_chapters(get_session(), chapters, project_id))
    except Exception as e:  # noqa: BLE001
        handle_error(e)


@novel.command("list")
@click.option("--project-id", type=int, default=None)
@click.option("--page", type=int, default=1)
@click.option("--limit", type=int, default=50)
@click.option("--search", default=None)
def novel_list(project_id, page, limit, search):
    """POST /api/novel/getNovel."""
    try:
        emit(novel_mod.list_chapters(get_session(), project_id, page, limit, search))
    except Exception as e:  # noqa: BLE001
        handle_error(e)


@novel.command("extract-events")
@click.option("--novel-ids", required=True, help="Comma-separated novel ids")
@click.option("--project-id", type=int, default=None)
@click.option("--concurrent", type=int, default=None)
@click.option("--confirm", is_flag=True,
              help="Confirm: triggers the backend novel-cleaning pipeline")
def novel_extract_events(novel_ids, project_id, concurrent, confirm):
    """POST /api/novel/event/generateEvents (LLM-backed — needs --confirm)."""
    try:
        if not confirm:
            raise backend.ToonflowError(
                "extract-events runs the LLM cleaning pipeline — pass --confirm."
            )
        ids = [int(x) for x in str(novel_ids).split(",") if x.strip()]
        emit(novel_mod.extract_events(get_session(), ids, project_id, concurrent))
    except Exception as e:  # noqa: BLE001
        handle_error(e)


# ── script group ──────────────────────────────────────────────────────────


@cli.group()
def script():
    """Script add/list/export + scriptAgent plan data."""


@script.command("add")
@click.option("-n", "--name", required=True)
@click.option("--content", default=None, help="Script content (or use --file)")
@click.option("--file", "content_file", default=None, help="File with content")
@click.option("--assets", default="", help="Comma-separated asset ids")
@click.option("--project-id", type=int, default=None)
def script_add(name, content, content_file, assets, project_id):
    """POST /api/script/addScript."""
    try:
        if content_file:
            with open(content_file, encoding="utf-8") as f:
                content = f.read()
        if content is None:
            raise backend.ToonflowError("Provide --content or --file")
        asset_ids = [int(x) for x in assets.split(",") if x.strip()]
        emit(script_mod.add(get_session(), name, content, asset_ids, project_id))
    except Exception as e:  # noqa: BLE001
        handle_error(e)


@script.command("list")
@click.option("--project-id", type=int, default=None)
@click.option("--name", default=None)
def script_list(project_id, name):
    """POST /api/script/getScrptApi."""
    try:
        emit(script_mod.list_scripts(get_session(), project_id, name))
    except Exception as e:  # noqa: BLE001
        handle_error(e)


@script.command("export")
@click.option("--script-id", type=int, required=True)
@click.option("--project-id", type=int, default=None)
def script_export(script_id, project_id):
    """POST /api/script/exportScript."""
    try:
        emit(script_mod.export_script(get_session(), script_id, project_id))
    except Exception as e:  # noqa: BLE001
        handle_error(e)


@script.command("use")
@click.argument("sid", type=int)
def script_use(sid: int):
    """Set the current script id in the session."""
    try:
        emit(script_mod.use(get_session(), sid), f"Current script: {sid}")
    except Exception as e:  # noqa: BLE001
        handle_error(e)


@script.command("get-plan")
@click.option("--project-id", type=int, default=None)
def script_get_plan(project_id):
    """POST /api/scriptAgent/getPlanData (策划 skeleton + strategy)."""
    try:
        emit(script_mod.get_plan(get_session(), project_id))
    except Exception as e:  # noqa: BLE001
        handle_error(e)


@script.command("set-plan")
@click.option("--story-skeleton", required=True)
@click.option("--adaptation-strategy", required=True)
@click.option("--project-id", type=int, default=None)
def script_set_plan(story_skeleton, adaptation_strategy, project_id):
    """POST /api/scriptAgent/setPlanData."""
    try:
        emit(script_mod.set_plan(
            get_session(), story_skeleton, adaptation_strategy, project_id))
    except Exception as e:  # noqa: BLE001
        handle_error(e)


# ── scriptagent group (Socket.IO) ─────────────────────────────────────────


@cli.group()
def scriptagent():
    """ScriptAgent Socket.IO chat (统筹) — real LLM op, gated by --confirm."""


@scriptagent.command("chat")
@click.option("-m", "--message", required=True)
@click.option("--project-id", type=int, default=None)
@click.option("--script-id", type=int, default=None)
@click.option("--think", is_flag=True)
@click.option("--think-level", type=int, default=0)
@click.option("--timeout", type=int, default=180)
@click.option("--confirm", is_flag=True, help="Confirm: this calls the LLM")
def scriptagent_chat(message, project_id, script_id, think, think_level,
                     timeout, confirm):
    """Send one message to the ScriptAgent and stream the reply (--confirm)."""
    try:
        if not confirm:
            raise backend.ToonflowError(
                "scriptagent chat invokes the configured LLM — pass --confirm."
            )
        emit(scriptagent_mod.chat(
            get_session(), message, project_id, script_id,
            think, think_level, timeout))
    except Exception as e:  # noqa: BLE001
        handle_error(e)


# ── production group ──────────────────────────────────────────────────────


@cli.group()
def production():
    """Production: storyboard (read) + generate-image/video (paid, --confirm)."""


@production.command("storyboard")
@click.option("--project-id", type=int, default=None)
@click.option("--script-id", type=int, default=None)
def production_storyboard(project_id, script_id):
    """POST /api/production/storyboard/getStoryboardData (read-only)."""
    try:
        emit(prod_mod.storyboard(get_session(), project_id, script_id))
    except Exception as e:  # noqa: BLE001
        handle_error(e)


@production.command("storyboard-chat")
@click.option("-m", "--message", required=True)
@click.option("--project-id", type=int, default=None)
@click.option("--script-id", type=int, default=None)
@click.option("--think", is_flag=True)
@click.option("--think-level", type=int, default=0)
@click.option("--timeout", type=int, default=180)
@click.option("--confirm", is_flag=True, help="Confirm: this calls the LLM")
def production_storyboard_chat(message, project_id, script_id, think,
                               think_level, timeout, confirm):
    """Send one message to the ProductionAgent (视频策划/分镜) and stream the reply (--confirm)."""
    try:
        if not confirm:
            raise backend.ToonflowError(
                "production storyboard-chat invokes the configured LLM — pass --confirm."
            )
        emit(prod_mod.storyboard_chat(
            get_session(), message, project_id, script_id,
            think, think_level, timeout))
    except Exception as e:  # noqa: BLE001
        handle_error(e)


@production.command("generate-image")
@click.option("--storyboard-ids", required=True, help="Comma-separated ids")
@click.option("--project-id", type=int, default=None)
@click.option("--script-id", type=int, default=None)
@click.option("--concurrent", type=int, default=None)
@click.option("--compulsory", is_flag=True)
@click.option("--confirm", is_flag=True, help="Confirm PAID image generation")
def production_generate_image(storyboard_ids, project_id, script_id,
                              concurrent, compulsory, confirm):
    """POST /api/production/storyboard/batchGenerateImage (PAID, --confirm)."""
    try:
        ids = [int(x) for x in str(storyboard_ids).split(",") if x.strip()]
        emit(prod_mod.generate_image(
            get_session(), ids, confirm, project_id, script_id,
            concurrent, compulsory))
    except Exception as e:  # noqa: BLE001
        handle_error(e)


@production.command("generate-video")
@click.option("--upload-data", required=True,
              help='JSON list: [{"id":1,"sources":"assets"}]')
@click.option("--prompt", required=True)
@click.option("--model", required=True)
@click.option("--mode", required=True)
@click.option("--resolution", required=True)
@click.option("--duration", type=int, required=True)
@click.option("--track-id", type=int, required=True)
@click.option("--audio", type=bool, default=None)
@click.option("--project-id", type=int, default=None)
@click.option("--script-id", type=int, default=None)
@click.option("--confirm", is_flag=True, help="Confirm PAID video generation")
def production_generate_video(upload_data, prompt, model, mode, resolution,
                              duration, track_id, audio, project_id,
                              script_id, confirm):
    """POST /api/production/workbench/generateVideo (PAID, --confirm)."""
    try:
        ud = json.loads(upload_data)
        emit(prod_mod.generate_video(
            get_session(), ud, prompt, model, mode, resolution, duration,
            track_id, confirm, project_id, script_id, audio))
    except Exception as e:  # noqa: BLE001
        handle_error(e)


# ── pipeline group (end-to-end orchestration) ──────────────────────────────


@cli.group()
def pipeline():
    """End-to-end short-drama chain: novel→events→script→storyboard→[image].

    Resumable (state in session); paid stages need --confirm; --dry-run previews.
    """


@pipeline.command("plan")
@click.option("--with-image", is_flag=True, help="Include batch image generation")
def pipeline_plan(with_image):
    """Show the ordered stage plan (pure, no network)."""
    try:
        emit({"plan": pipeline_mod.build_plan(with_image=with_image)})
    except Exception as e:  # noqa: BLE001
        handle_error(e)


@pipeline.command("run")
@click.option("--novel-file", type=str, default=None,
              help="JSON chapter list for the novel-import stage")
@click.option("--script-message", default=None, help="Prompt for the ScriptAgent stage")
@click.option("--storyboard-message", default=None,
              help="Prompt for the ProductionAgent storyboard stage")
@click.option("--with-image", is_flag=True, help="Include batch image generation")
@click.option("--storyboard-ids", default=None,
              help="Comma-separated panel ids for generate-image (else auto-discovered)")
@click.option("--restart", is_flag=True, help="Ignore saved progress; redo all stages")
@click.option("--no-poll", is_flag=True, help="Do not poll backend tasks between stages")
@click.option("--timeout", type=int, default=600)
@click.option("--think", is_flag=True)
@click.option("--think-level", type=int, default=0)
@click.option("--confirm", is_flag=True, help="Confirm: runs PAID stages (LLM/image)")
@click.pass_context
def pipeline_run(ctx, novel_file, script_message, storyboard_message, with_image,
                 storyboard_ids, restart, no_poll, timeout, think, think_level, confirm):
    """Run the resumable end-to-end pipeline (--dry-run to preview, --confirm to execute)."""
    try:
        ids = ([int(x) for x in str(storyboard_ids).split(",") if x.strip()]
               if storyboard_ids else None)
        kwargs: dict = {
            "with_image": with_image,
            "storyboard_ids": ids,
            "confirm": confirm,
            "dry_run": bool(ctx.obj.get("dry_run")),
            "restart": restart,
            "poll": not no_poll,
            "timeout": timeout,
            "think": think,
            "think_level": think_level,
        }
        if novel_file is not None:
            kwargs["novel_file"] = novel_file
        if script_message is not None:
            kwargs["script_message"] = script_message
        if storyboard_message is not None:
            kwargs["storyboard_message"] = storyboard_message
        emit(pipeline_mod.run(get_session(), **kwargs))
    except Exception as e:  # noqa: BLE001
        handle_error(e)


# ── vendor group ──────────────────────────────────────────────────────────


@cli.group()
def vendor():
    """Vendor config (add from .ts file, set-inputs, list, enable)."""


@vendor.command("add")
@click.option("--file", "ts_file", required=True, help="Vendor .ts file path")
def vendor_add(ts_file: str):
    """POST /api/setting/vendorConfig/addVendor (compiles + validates the TS)."""
    try:
        emit(vendor_mod.add_from_file(get_session(), ts_file))
    except Exception as e:  # noqa: BLE001
        handle_error(e)


@vendor.command("list")
def vendor_list():
    """POST /api/setting/vendorConfig/getVendorList."""
    try:
        emit(vendor_mod.list_vendors(get_session()))
    except Exception as e:  # noqa: BLE001
        handle_error(e)


@vendor.command("set-inputs")
@click.option("--id", "vendor_id", required=True)
@click.option("--inputs", required=True, help='JSON map of input key->value')
def vendor_set_inputs(vendor_id: str, inputs: str):
    """POST /api/setting/vendorConfig/updateVendorInputs (e.g. API keys)."""
    try:
        values = json.loads(inputs)
        emit(vendor_mod.set_inputs(get_session(), vendor_id, values))
    except Exception as e:  # noqa: BLE001
        handle_error(e)


@vendor.command("enable")
@click.option("--id", "vendor_id", required=True)
@click.option("--disable", is_flag=True, help="Disable instead of enable")
def vendor_enable(vendor_id: str, disable: bool):
    """POST /api/setting/vendorConfig/enableVendor."""
    try:
        emit(vendor_mod.enable(get_session(), vendor_id, not disable))
    except Exception as e:  # noqa: BLE001
        handle_error(e)


# ── agent group ───────────────────────────────────────────────────────────


@cli.group()
def agent():
    """Agent deploy (/api/setting/agentDeploy/*)."""


@agent.command("list")
def agent_list():
    """POST /api/setting/agentDeploy/getAgentDeploy."""
    try:
        emit(agent_mod.list_deploy(get_session()))
    except Exception as e:  # noqa: BLE001
        handle_error(e)


@agent.command("deploy")
@click.option("--id", "deploy_id", type=int, required=True)
@click.option("--name", required=True)
@click.option("--model", required=True)
@click.option("--model-name", required=True)
@click.option("--desc", default="")
@click.option("--vendor-id", default=None)
@click.option("--temperature", type=float, default=None)
@click.option("--max-output-tokens", type=int, default=None)
def agent_deploy(deploy_id, name, model, model_name, desc, vendor_id,
                 temperature, max_output_tokens):
    """POST /api/setting/agentDeploy/deployAgentModel."""
    try:
        emit(agent_mod.deploy(
            get_session(), deploy_id, name, model, model_name, desc,
            vendor_id, temperature, max_output_tokens))
    except Exception as e:  # noqa: BLE001
        handle_error(e)


# ── task group ────────────────────────────────────────────────────────────


@cli.group()
def task():
    """Task list/details (/api/task/* — read-only, zero cost)."""


@task.command("list")
@click.option("--page", type=int, default=1)
@click.option("--limit", type=int, default=10)
@click.option("--state", default=None)
@click.option("--task-class", default=None)
@click.option("--project-id", type=int, default=None)
def task_list(page, limit, state, task_class, project_id):
    """POST /api/task/getTaskApi."""
    try:
        emit(task_mod.list_tasks(
            get_session(), page, limit, state, task_class, project_id))
    except Exception as e:  # noqa: BLE001
        handle_error(e)


@task.command("details")
@click.option("--task-id", type=int, required=True)
def task_details(task_id: int):
    """POST /api/task/taskDetails."""
    try:
        emit(task_mod.details(get_session(), task_id))
    except Exception as e:  # noqa: BLE001
        handle_error(e)


@task.command("categories")
def task_categories():
    """POST /api/task/getTaskCategories."""
    try:
        emit(task_mod.categories(get_session()))
    except Exception as e:  # noqa: BLE001
        handle_error(e)


# ── db group ──────────────────────────────────────────────────────────────


@cli.group()
def db():
    """Database export/import (/api/setting/dbConfig/*)."""


@db.command("export")
@click.option("-o", "--out", required=True, help="Output backup .json path")
def db_export(out: str):
    """GET /api/setting/dbConfig/exportData — write a full JSON backup."""
    try:
        res = db_mod.export_db(get_session(), out)
        emit(res, f"Exported {res['bytes']} bytes -> {res['output']}")
    except Exception as e:  # noqa: BLE001
        handle_error(e)


@db.command("import")
@click.option("--file", "in_file", required=True, help="Backup .json path")
@click.option("--confirm", is_flag=True, help="Confirm DESTRUCTIVE import")
def db_import(in_file: str, confirm: bool):
    """POST /api/setting/dbConfig/importData (DESTRUCTIVE — needs --confirm)."""
    try:
        emit(db_mod.import_db(get_session(), in_file, confirm))
    except Exception as e:  # noqa: BLE001
        handle_error(e)


@db.command("info")
def db_info():
    """POST /api/setting/dbConfig/dbInfo (read-only)."""
    try:
        emit(db_mod.info(get_session()))
    except Exception as e:  # noqa: BLE001
        handle_error(e)


# ── REPL ──────────────────────────────────────────────────────────────────

_HELP = {
    "server start|stop|status": "Toonflow-app server lifecycle",
    "auth login|whoami": "Authenticate, store Bearer token",
    "project create|list|get|edit|delete|use": "Project management",
    "novel import|list|extract-events": "Novel chapters + event extraction",
    "script add|list|export|use|get-plan|set-plan": "Scripts + plan data",
    "scriptagent chat": "Socket.IO ScriptAgent chat (--confirm)",
    "production storyboard|generate-image|generate-video": "Production (paid gated)",
    "vendor add|list|set-inputs|enable": "Vendor config",
    "agent list|deploy": "Agent model deployment",
    "task list|details|categories": "Tasks (read-only)",
    "db export|import|info": "Database backup/restore",
    "session new|info|set|undo|redo": "Session state",
    "help / quit": "Show this help / exit",
}


@cli.command()
@click.option("--project", "project_path", type=str, default=None)
@click.pass_context
def repl(ctx: click.Context, project_path: Optional[str]):
    """Start the interactive REPL (default when no subcommand given)."""
    global _repl_mode
    _repl_mode = True
    skin.print_banner()
    if skin.skill_path:
        skin.info(f"Skill: {skin.skill_path}")
    sess = get_session()
    pt = skin.create_prompt_session()
    while True:
        try:
            ctx_name = sess.get("username") or sess.get("base_url", "")
            line = skin.get_input(
                pt, project_name=ctx_name, modified=sess._modified
            )
        except (EOFError, KeyboardInterrupt):
            skin.print_goodbye()
            break
        if not line:
            continue
        if line in ("quit", "exit", "q"):
            skin.print_goodbye()
            break
        if line in ("help", "?"):
            skin.help(_HELP)
            continue
        try:
            args = shlex.split(line)
        except ValueError as e:
            skin.error(str(e))
            continue
        try:
            cli.main(args=args, standalone_mode=False, prog_name="")
        except SystemExit:
            pass
        except click.ClickException as e:
            skin.error(e.format_message())
        except Exception as e:  # noqa: BLE001
            skin.error(str(e))
    _repl_mode = False


def main() -> None:
    cli(obj={})


if __name__ == "__main__":
    main()
