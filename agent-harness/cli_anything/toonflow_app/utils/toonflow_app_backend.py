"""Backend integration for Toonflow-app.

This module is the bridge to the REAL Toonflow-app software. It does two things:

1. ``ToonflowClient`` — a thin HTTP client over Toonflow-app's Express REST API
   (167 routes, all POST except ``GET /api/setting/dbConfig/exportData``). Auth is
   ``POST /api/login/login`` -> ``Bearer <token>`` used on every other route.

2. ``server_*`` helpers — start / stop / probe the Toonflow-app server in
   server-only mode (no Electron). It locates the Toonflow-app repo (the parent
   of ``agent-harness/``) and runs ``yarn dev`` / ``yarn start`` / ``npm`` there.

The CLI is a structured command-line interface TO Toonflow-app — it never
reimplements the 策划->编剧->分镜->出片 pipeline. The pipeline runs inside the
real Node/Express backend.
"""

from __future__ import annotations

import json
import os
import shutil
import signal
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any, Optional

DEFAULT_BASE_URL = "http://localhost:10588"
DEFAULT_PORT = 10588


class ToonflowError(RuntimeError):
    """Raised for backend / API failures with an agent-readable message."""


# ── Repo location ─────────────────────────────────────────────────────────


def find_toonflow_repo() -> Path:
    """Locate the Toonflow-app repo root.

    The harness lives at ``<repo>/agent-harness/cli_anything/toonflow_app``.
    Resolution order: ``$TOONFLOW_APP_DIR`` env, then walk up from this file
    looking for a directory containing ``package.json`` with name ``toonflow``.
    """
    env = os.environ.get("TOONFLOW_APP_DIR")
    if env:
        p = Path(env).expanduser().resolve()
        if (p / "package.json").is_file():
            return p
        raise ToonflowError(
            f"TOONFLOW_APP_DIR={env} does not contain package.json"
        )

    here = Path(__file__).resolve()
    for parent in here.parents:
        pkg = parent / "package.json"
        if pkg.is_file():
            try:
                data = json.loads(pkg.read_text(encoding="utf-8"))
            except Exception:
                continue
            if data.get("name") == "toonflow":
                return parent
    raise ToonflowError(
        "Could not locate the Toonflow-app repo. Set TOONFLOW_APP_DIR to its path."
    )


def _local_bin(repo: Path, name: str) -> Optional[str]:
    """Return the path to a locally installed node_modules/.bin executable."""
    base = repo / "node_modules" / ".bin"
    for cand in (base / f"{name}.cmd", base / f"{name}.CMD", base / name):
        if cand.is_file():
            return str(cand)
    return None


def _server_command(repo: Path, mode: str) -> list[str]:
    """Resolve the command to launch the Toonflow-app server.

    Order of preference:
      1. Local ``node_modules/.bin/tsx src/app.ts`` (mode=dev) — most reliable,
         no package-manager shim needed (server-only, no Electron).
      2. ``node data/serve/app.js`` (mode=start) — the prebuilt bundle.
      3. ``yarn <mode>`` / ``npm run <mode>`` via a resolved absolute path
         (handles Windows ``.cmd`` shims).
    """
    if mode == "dev":
        tsx = _local_bin(repo, "tsx")
        node = shutil.which("node")
        if tsx and node:
            return [tsx, "src/app.ts"]
    if mode == "start":
        serve = repo / "data" / "serve" / "app.js"
        node = shutil.which("node")
        if node and serve.is_file():
            return [node, str(serve)]

    yarn = shutil.which("yarn")
    if yarn:
        return [yarn, mode]
    npm = shutil.which("npm")
    if npm:
        return [npm, "run", mode]
    raise ToonflowError(
        "Cannot resolve a way to start the server: need node + "
        "node_modules/.bin/tsx (run 'npm install --legacy-peer-deps' in the "
        "Toonflow-app repo) or yarn/npm on PATH."
    )


# ── Server lifecycle (server-only mode, no Electron) ──────────────────────


def _pidfile(repo: Path) -> Path:
    return repo / "agent-harness" / ".toonflow-server.pid"


def is_port_open(host: str, port: int, timeout: float = 1.0) -> bool:
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except OSError:
        return False


def server_status(base_url: str = DEFAULT_BASE_URL) -> dict[str, Any]:
    """Probe whether the Toonflow-app server is reachable.

    Uses the login endpoint with no body (expects a 4xx, which still proves the
    HTTP server + auth middleware are up) — a zero-cost reachability check.
    """
    host, port = _host_port(base_url)
    reachable = is_port_open(host, port)
    info: dict[str, Any] = {"base_url": base_url, "port": port, "reachable": reachable}
    if reachable:
        try:
            req = urllib.request.Request(
                base_url + "/api/login/login",
                data=b"{}",
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=5) as resp:
                info["http_status"] = resp.status
        except urllib.error.HTTPError as e:
            info["http_status"] = e.code
            info["api_up"] = True
        except Exception as e:  # noqa: BLE001
            info["error"] = str(e)
        else:
            info["api_up"] = True
    return info


def _host_port(base_url: str) -> tuple[str, int]:
    from urllib.parse import urlparse

    u = urlparse(base_url)
    return (u.hostname or "localhost", u.port or DEFAULT_PORT)


def server_start(
    mode: str = "dev",
    base_url: str = DEFAULT_BASE_URL,
    wait: int = 90,
    extra_env: Optional[dict[str, str]] = None,
) -> dict[str, Any]:
    """Start the Toonflow-app server in server-only mode (no Electron).

    mode='dev'   -> ``yarn dev`` (tsx src/app.ts)
    mode='start' -> ``yarn start`` (node data/serve/app.js, requires ``yarn build``)
    """
    repo = find_toonflow_repo()
    host, port = _host_port(base_url)

    if is_port_open(host, port):
        return {"status": "already-running", "base_url": base_url, "port": port}

    if mode not in ("dev", "start"):
        raise ToonflowError(f"Unknown server mode '{mode}' (use 'dev' or 'start')")
    cmd = _server_command(repo, mode)

    env = dict(os.environ)
    env.setdefault("PORT", str(port))
    if mode == "dev":
        env.setdefault("NODE_ENV", "dev")
    if extra_env:
        env.update(extra_env)

    log_path = repo / "agent-harness" / ".toonflow-server.log"
    log_f = open(log_path, "wb")
    creationflags = 0
    use_shell = False
    if sys.platform == "win32":
        creationflags = subprocess.CREATE_NEW_PROCESS_GROUP  # type: ignore[attr-defined]
        # .cmd / .bat shims must be launched via the shell on Windows.
        if cmd and str(cmd[0]).lower().endswith((".cmd", ".bat")):
            use_shell = True

    proc = subprocess.Popen(
        subprocess.list2cmdline(cmd) if use_shell else cmd,
        cwd=str(repo),
        stdout=log_f,
        stderr=subprocess.STDOUT,
        env=env,
        creationflags=creationflags,
        shell=use_shell,
    )
    _pidfile(repo).write_text(str(proc.pid), encoding="utf-8")

    deadline = time.time() + wait
    while time.time() < deadline:
        if proc.poll() is not None:
            tail = ""
            try:
                tail = log_path.read_text(encoding="utf-8", errors="replace")[-2000:]
            except Exception:  # noqa: BLE001
                pass
            raise ToonflowError(
                f"Toonflow-app server exited early (code {proc.returncode}).\n"
                f"--- log tail ---\n{tail}"
            )
        if is_port_open(host, port):
            return {
                "status": "started",
                "pid": proc.pid,
                "base_url": base_url,
                "port": port,
                "mode": mode,
                "log": str(log_path),
            }
        time.sleep(1.0)

    raise ToonflowError(
        f"Server did not open port {port} within {wait}s. See log: {log_path}"
    )


def server_stop(base_url: str = DEFAULT_BASE_URL) -> dict[str, Any]:
    """Stop a server previously started via ``server_start`` (by pidfile)."""
    repo = find_toonflow_repo()
    pf = _pidfile(repo)
    if not pf.is_file():
        return {"status": "no-pidfile", "note": "no tracked server process"}
    try:
        pid = int(pf.read_text(encoding="utf-8").strip())
    except Exception:  # noqa: BLE001
        pf.unlink(missing_ok=True)
        return {"status": "bad-pidfile"}

    try:
        if sys.platform == "win32":
            subprocess.run(
                ["taskkill", "/PID", str(pid), "/T", "/F"],
                capture_output=True,
                check=False,
            )
        else:
            os.kill(pid, signal.SIGTERM)
    except ProcessLookupError:
        pass
    except Exception as e:  # noqa: BLE001
        return {"status": "error", "error": str(e), "pid": pid}
    pf.unlink(missing_ok=True)
    return {"status": "stopped", "pid": pid}


# ── REST client ───────────────────────────────────────────────────────────


class ToonflowClient:
    """Thin HTTP client over Toonflow-app's Express REST API.

    Almost every route is ``POST`` with a JSON body and returns
    ``{code, data, message}``. The only exception used here is
    ``GET /api/setting/dbConfig/exportData`` which streams a JSON file.
    """

    def __init__(self, base_url: str = DEFAULT_BASE_URL, token: Optional[str] = None):
        self.base_url = base_url.rstrip("/")
        # Toonflow login returns a token already prefixed with "Bearer ".
        self.token = token

    # -- low level -------------------------------------------------------

    def _request(
        self,
        method: str,
        path: str,
        body: Optional[dict] = None,
        raw_response: bool = False,
        timeout: int = 120,
    ) -> Any:
        url = self.base_url + path
        data = None
        headers = {"Accept": "application/json"}
        if body is not None:
            data = json.dumps(body).encode("utf-8")
            headers["Content-Type"] = "application/json"
        if self.token:
            # token is stored already containing the "Bearer " prefix
            headers["Authorization"] = self.token

        req = urllib.request.Request(url, data=data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                payload = resp.read()
                if raw_response:
                    return payload
                return self._parse(payload, resp.status)
        except urllib.error.HTTPError as e:
            payload = e.read()
            msg = self._extract_message(payload) or e.reason
            raise ToonflowError(
                f"HTTP {e.code} {method} {path}: {msg}"
            ) from None
        except urllib.error.URLError as e:
            raise ToonflowError(
                f"Cannot reach Toonflow-app at {self.base_url} ({e.reason}). "
                f"Start the server: cli-anything-toonflow-app server start"
            ) from None

    @staticmethod
    def _extract_message(payload: bytes) -> Optional[str]:
        try:
            obj = json.loads(payload.decode("utf-8"))
            if isinstance(obj, dict):
                return obj.get("message") or json.dumps(obj)[:300]
        except Exception:  # noqa: BLE001
            return payload.decode("utf-8", errors="replace")[:300]
        return None

    @staticmethod
    def _parse(payload: bytes, status: int) -> Any:
        text = payload.decode("utf-8", errors="replace")
        try:
            obj = json.loads(text)
        except json.JSONDecodeError:
            return {"raw": text, "_http_status": status}
        # Toonflow envelope: {code, data, message}
        if isinstance(obj, dict) and "code" in obj:
            if obj["code"] != 200:
                raise ToonflowError(
                    f"API error (code {obj['code']}): {obj.get('message', '')}"
                )
            return obj.get("data")
        return obj

    def post(self, path: str, body: Optional[dict] = None, timeout: int = 120) -> Any:
        return self._request("POST", path, body or {}, timeout=timeout)

    def get(self, path: str, raw_response: bool = False, timeout: int = 120) -> Any:
        return self._request("GET", path, None, raw_response=raw_response, timeout=timeout)

    # -- auth ------------------------------------------------------------

    def login(self, username: str, password: str) -> dict[str, Any]:
        data = self.post(
            "/api/login/login", {"username": username, "password": password}
        )
        # data = {token: "Bearer ...", name, id}
        self.token = data.get("token")
        return data
