"""E2E tests for cli-anything-toonflow-app against the REAL Toonflow-app server.

These tests boot (or reuse) the real Express/Socket.IO backend in server-only
mode and exercise ONLY zero-cost paths: login, project CRUD, novel import,
script add, task list, db export/info, server status. No paid LLM / image /
video generation is ever triggered (those require --confirm, asserted refused).

If the server cannot be reached and cannot be started in-env, the real-server
tests are xfail'd with the exact human step to run, while unit-level subprocess
tests still validate the installed binary.
"""

from __future__ import annotations

import json
import os
import socket
import subprocess
import sys
import time

import pytest

# ── shared helpers ─────────────────────────────────────────────────────────

BASE_URL = os.environ.get("TOONFLOW_BASE_URL", "http://localhost:10588")
HOST, PORT = "localhost", 10588

HUMAN_STEP = (
    "Start Toonflow-app server-only mode manually:\n"
    "  cd .external-engines/Toonflow-app\n"
    "  npm install --legacy-peer-deps   # peer-dep: sqlite3 v5 vs v6\n"
    "  node node_modules/.bin/tsx src/app.ts   # -> http://localhost:10588\n"
    "Then re-run: pytest cli_anything/toonflow_app/tests/test_full_e2e.py"
)


def _port_open(host: str = HOST, port: int = PORT, timeout: float = 1.0) -> bool:
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except OSError:
        return False


def _resolve_cli(name):
    """Resolve installed CLI command; falls back to python -m for dev.

    Set env CLI_ANYTHING_FORCE_INSTALLED=1 to require the installed command.
    """
    import shutil

    force = os.environ.get("CLI_ANYTHING_FORCE_INSTALLED", "").strip() == "1"
    path = shutil.which(name)
    if path:
        print(f"[_resolve_cli] Using installed command: {path}")
        return [path]
    if force:
        raise RuntimeError(
            f"{name} not found in PATH. Install with: pip install -e ."
        )
    module = "cli_anything.toonflow_app.toonflow_app_cli"
    print(f"[_resolve_cli] Falling back to: {sys.executable} -m {module}")
    return [sys.executable, "-m", module]


@pytest.fixture(scope="session")
def server_up():
    """Ensure the real Toonflow-app server is reachable.

    Reuses an already-running server. If down, tries to boot it via the
    backend module (server-only mode). If that fails, xfail with the human
    step — unit tests still cover the binary.
    """
    if _port_open():
        return True
    from cli_anything.toonflow_app.utils import toonflow_app_backend as be

    try:
        be.server_start(mode="dev", base_url=BASE_URL, wait=120)
    except Exception as e:  # noqa: BLE001
        pytest.xfail(
            f"Toonflow-app server not reachable and auto-start failed: {e}\n"
            f"{HUMAN_STEP}"
        )
    deadline = time.time() + 30
    while time.time() < deadline:
        if _port_open():
            return True
        time.sleep(1)
    pytest.xfail(
        "Toonflow-app server did not open port 10588 in time.\n" + HUMAN_STEP
    )


@pytest.fixture
def session_file(tmp_path):
    return str(tmp_path / "tf-e2e.json")


# ── real-server E2E (zero cost) ────────────────────────────────────────────


class TestRealServerWorkflow:
    """Headless short-drama project bootstrap against the real backend."""

    CLI = _resolve_cli("cli-anything-toonflow-app")

    def _run(self, args, check=True):
        result = subprocess.run(
            self.CLI + args,
            capture_output=True,
            text=True,
            check=check,
        )
        return result

    def _json(self, args):
        r = self._run(["--json"] + args)
        return json.loads(r.stdout)

    def test_server_status_reachable(self, server_up, session_file):
        self._run(["session", "new", "-o", session_file])
        out = self._json(["--project", session_file, "server", "status"])
        assert out["reachable"] is True
        assert out.get("api_up") is True
        print(f"\n  Server: {out['base_url']} (reachable, api_up)")

    def test_auth_login_round_trip(self, server_up, session_file):
        self._run(["session", "new", "-o", session_file])
        out = self._json(
            ["--project", session_file, "auth", "login",
             "-u", "admin", "-p", "admin123"]
        )
        assert out["username"] == "admin"
        assert out["token_present"] is True
        who = self._json(["--project", session_file, "auth", "whoami"])
        assert who["authenticated"] is True

    def test_project_crud(self, server_up, session_file):
        self._run(["session", "new", "-o", session_file])
        self._run(["--project", session_file, "auth", "login",
                   "-u", "admin", "-p", "admin123"])
        name = f"E2E-{int(time.time())}"
        created = self._json(
            ["--project", session_file, "project", "create",
             "-n", name, "--intro", "pytest"]
        )
        assert created["created"] is True
        projects = self._json(["--project", session_file, "project", "list"])
        match = [p for p in projects if p["name"] == name]
        assert match, f"created project {name} not in list"
        pid = match[0]["id"]
        # edit
        self._run(["--project", session_file, "project", "use", str(pid)])
        edited = self._json(
            ["--project", session_file, "project", "edit",
             "--id", str(pid), "--intro", "edited"]
        )
        assert edited["edited"] is True
        # delete (confirmed — destructive but zero monetary cost)
        deleted = self._json(
            ["--project", session_file, "project", "delete",
             "--id", str(pid), "--confirm"]
        )
        assert deleted["deleted"] is True
        after = self._json(["--project", session_file, "project", "list"])
        assert not [p for p in after if p["id"] == pid]
        print(f"\n  Project CRUD ok (id={pid})")

    def test_novel_import_and_list(self, server_up, session_file, tmp_path):
        self._run(["session", "new", "-o", session_file])
        self._run(["--project", session_file, "auth", "login",
                   "-u", "admin", "-p", "admin123"])
        created = self._json(
            ["--project", session_file, "project", "create",
             "-n", f"Novel-{int(time.time())}"]
        )
        projects = self._json(["--project", session_file, "project", "list"])
        pid = max(p["id"] for p in projects)
        self._run(["--project", session_file, "project", "use", str(pid)])
        chap = tmp_path / "chapters.json"
        chap.write_text(json.dumps([
            {"index": 1, "reel": "R1", "chapter": "Ch1",
             "chapterData": "Once upon a time."},
            {"index": 2, "reel": "R1", "chapter": "Ch2",
             "chapterData": "The end."},
        ]), encoding="utf-8")
        imp = self._json(
            ["--project", session_file, "novel", "import",
             "--file", str(chap)]
        )
        assert imp["imported"] == 2
        listed = self._json(["--project", session_file, "novel", "list"])
        rows = listed.get("data", listed) if isinstance(listed, dict) else listed
        assert len(rows) >= 2
        # cleanup
        self._run(["--project", session_file, "project", "delete",
                   "--id", str(pid), "--confirm"])

    def test_task_and_db_read(self, server_up, session_file, tmp_path):
        self._run(["session", "new", "-o", session_file])
        self._run(["--project", session_file, "auth", "login",
                   "-u", "admin", "-p", "admin123"])
        tasks = self._json(["--project", session_file, "task", "list"])
        assert "data" in tasks or isinstance(tasks, (list, dict))
        info = self._json(["--project", session_file, "db", "info"])
        names = {row["name"] for row in info if isinstance(row, dict)}
        assert "o_project" in names
        backup = tmp_path / "backup.json"
        exp = self._json(
            ["--project", session_file, "db", "export",
             "-o", str(backup)]
        )
        assert backup.is_file()
        assert exp["bytes"] > 0
        parsed = json.loads(backup.read_text(encoding="utf-8"))
        assert "tables" in parsed and "o_project" in parsed["tables"]
        print(f"\n  DB backup: {backup} ({exp['bytes']:,} bytes)")

    def test_paid_ops_refused_without_confirm(self, server_up, session_file):
        """Cost-safety: paid/destructive ops MUST refuse without --confirm."""
        self._run(["session", "new", "-o", session_file])
        self._run(["--project", session_file, "auth", "login",
                   "-u", "admin", "-p", "admin123"])
        self._run(["--project", session_file, "project", "create",
                   "-n", f"Gate-{int(time.time())}"])
        projects = self._json(["--project", session_file, "project", "list"])
        pid = max(p["id"] for p in projects)
        self._run(["--project", session_file, "project", "use", str(pid)])
        self._run(["--project", session_file, "script", "use", "1"])

        for args in (
            ["scriptagent", "chat", "-m", "hi"],
            ["production", "generate-image", "--storyboard-ids", "1"],
            ["production", "generate-video", "--upload-data", "[]",
             "--prompt", "p", "--model", "m", "--mode", "x",
             "--resolution", "1080p", "--duration", "5", "--track-id", "1"],
        ):
            r = self._run(["--project", session_file] + args, check=False)
            assert r.returncode != 0, f"{args} should refuse without --confirm"
            assert "confirm" in (r.stdout + r.stderr).lower()
        self._run(["--project", session_file, "project", "delete",
                   "--id", str(pid), "--confirm"])
        print("\n  Cost-safety: scriptagent/generate-image/generate-video "
              "all refused without --confirm")


# ── installed-binary subprocess tests ──────────────────────────────────────


class TestCLISubprocess:
    CLI_BASE = _resolve_cli("cli-anything-toonflow-app")

    def _run(self, args, check=True):
        return subprocess.run(
            self.CLI_BASE + args,
            capture_output=True,
            text=True,
            check=check,
        )

    def test_help(self):
        r = self._run(["--help"])
        assert r.returncode == 0
        assert "Toonflow-app" in r.stdout

    def test_all_groups_listed(self):
        r = self._run(["--help"])
        for grp in ("server", "auth", "project", "novel", "script",
                    "scriptagent", "production", "vendor", "agent",
                    "task", "db", "session"):
            assert grp in r.stdout

    def test_session_new_json(self, tmp_path):
        out = str(tmp_path / "s.json")
        r = self._run(["--json", "session", "new", "-o", out])
        assert r.returncode == 0
        data = json.loads(r.stdout)
        assert data["base_url"] == "http://localhost:10588"
        assert os.path.isfile(out)

    def test_session_undo_redo_and_dry_run(self, tmp_path):
        out = str(tmp_path / "s.json")
        self._run(["session", "new", "-o", out])
        # dry-run should NOT persist project_id
        self._run(["--dry-run", "--project", out, "project", "use", "5"])
        data = json.loads(open(out, encoding="utf-8").read())
        assert data["project_id"] is None  # dry-run suppressed save
        # without dry-run it persists (auto-save)
        self._run(["--project", out, "project", "use", "7"])
        data = json.loads(open(out, encoding="utf-8").read())
        assert data["project_id"] == 7

    def test_unreachable_server_actionable_error(self, tmp_path):
        out = str(tmp_path / "s.json")
        self._run(["session", "new", "-o", out, "--base-url",
                   "http://127.0.0.1:1"])
        # Inject a token so the auth gate passes and we reach the HTTP layer,
        # which must then produce the actionable "cannot reach" error.
        self._run(["--project", out, "session", "set", "token",
                   "Bearer dummy"])
        r = self._run(["--json", "--project", out, "project", "list"],
                       check=False)
        assert r.returncode != 0
        # handle_error writes the JSON error payload to stderr.
        combined = (r.stdout + r.stderr).strip()
        assert "server start" in combined or "Cannot reach" in combined
        # the stderr line is itself valid JSON
        err_line = next(
            l for l in (r.stdout + r.stderr).splitlines() if l.strip()
        )
        assert json.loads(err_line)["error"]


# ── pipeline orchestration (A1) — zero cost, no server ──────────────────────


class TestPipelineCLI:
    """End-to-end pipeline command: plan/dry-run/cost-gate (no network)."""

    CLI = _resolve_cli("cli-anything-toonflow-app")

    def _run(self, args, check=False):
        return subprocess.run(self.CLI + args, capture_output=True,
                              text=True, check=check)

    def _json(self, args):
        return json.loads(self._run(["--json"] + args, check=True).stdout)

    def test_pipeline_listed_in_help(self):
        r = self._run(["--help"], check=True)
        assert "pipeline" in r.stdout

    def test_plan_ordering(self):
        out = self._json(["pipeline", "plan"])
        names = [s["name"] for s in out["plan"]]
        assert names == ["novel-import", "extract-events", "script", "storyboard"]
        assert out["plan"][0]["paid"] is False
        assert all(s["paid"] for s in out["plan"][1:])

    def test_plan_with_image(self):
        out = self._json(["pipeline", "plan", "--with-image"])
        assert [s["name"] for s in out["plan"]][-1] == "generate-image"

    def test_dry_run_no_network(self, tmp_path):
        out = str(tmp_path / "s.json")
        self._run(["session", "new", "-o", out], check=True)
        res = self._json(["--dry-run", "--project", out, "pipeline", "run"])
        assert res["dry_run"] is True
        assert [s["name"] for s in res["plan"]][0] == "novel-import"

    def test_run_refuses_without_confirm(self, tmp_path):
        out = str(tmp_path / "s.json")
        self._run(["session", "new", "-o", out], check=True)
        r = self._run(["--project", out, "pipeline", "run"], check=False)
        assert r.returncode != 0
        assert "confirm" in (r.stdout + r.stderr).lower()


class TestPipelineUnit:
    """In-process state-machine checks for pipeline.run (no network)."""

    def _sess(self, pid=7):
        from cli_anything.toonflow_app.core.session import Session
        s = Session()
        s.new()
        s.set("project_id", pid)
        return s

    def test_build_plan(self):
        from cli_anything.toonflow_app.core import pipeline as p
        assert len(p.build_plan()) == 4
        assert len(p.build_plan(with_image=True)) == 5

    def test_dry_run_marks_completed_stages(self):
        from cli_anything.toonflow_app.core import pipeline as p
        sess = self._sess()
        sess.set("pipeline", {"project_id": 7,
                              "completed": ["novel-import", "extract-events"]})
        res = p.run(sess, dry_run=True)
        skipped = {s["name"] for s in res["plan"] if s["skip_completed"]}
        assert skipped == {"novel-import", "extract-events"}

    def test_run_refuses_without_confirm(self):
        from cli_anything.toonflow_app.core import pipeline as p
        from cli_anything.toonflow_app.utils.toonflow_app_backend import ToonflowError
        with pytest.raises(ToonflowError):
            p.run(self._sess(), confirm=False, dry_run=False)

    def test_restart_clears_resume(self):
        from cli_anything.toonflow_app.core import pipeline as p
        sess = self._sess()
        sess.set("pipeline", {"project_id": 7, "completed": ["novel-import"]})
        res = p.run(sess, dry_run=True, restart=True)
        assert all(not s["skip_completed"] for s in res["plan"])
