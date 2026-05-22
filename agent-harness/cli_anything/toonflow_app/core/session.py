"""Stateful session for cli-anything-toonflow-app.

The "project" here is a small JSON session that holds the connection +
workflow context the agent needs across commands:

- ``base_url``       — Toonflow-app server URL (default http://localhost:10588)
- ``token``          — Bearer token from ``auth login`` ("Bearer ..." form)
- ``username``       — last logged-in user (informational)
- ``project_id``     — current Toonflow project id (server-side)
- ``script_id``      — current Toonflow script id (server-side)
- ``isolation_key``  — Socket.IO isolation key for scriptAgent chat

It supports undo/redo and atomic, lock-protected saves. This is NOT a copy of
Toonflow's SQLite data — the real state lives in the Node backend; this only
tracks *which* server / project / script the agent is operating on.
"""

from __future__ import annotations

import copy
import json
import os
import tempfile
import time
from pathlib import Path
from typing import Any, Optional

try:  # Windows lacks fcntl; degrade to best-effort atomic replace.
    import fcntl  # type: ignore

    _HAVE_FCNTL = True
except ImportError:  # pragma: no cover - Windows path
    _HAVE_FCNTL = False

MAX_HISTORY = 50

_DEFAULT_STATE: dict[str, Any] = {
    "base_url": "http://localhost:10588",
    "token": None,
    "username": None,
    "project_id": None,
    "script_id": None,
    "isolation_key": "agent-cli",
    "created": None,
    "updated": None,
}


def _locked_save_json(path: str, data: dict) -> None:
    """Atomically write ``data`` to ``path`` with a write lock.

    Pattern: write to a temp file in the same dir, fsync, then ``os.replace``
    (atomic on POSIX and Windows). On POSIX an advisory lock is taken on the
    destination to serialize concurrent writers.
    """
    dest = Path(path)
    dest.parent.mkdir(parents=True, exist_ok=True)
    lock_handle = None
    if _HAVE_FCNTL and dest.exists():
        lock_handle = open(dest, "r+")
        fcntl.flock(lock_handle.fileno(), fcntl.LOCK_EX)
    try:
        fd, tmp = tempfile.mkstemp(
            dir=str(dest.parent), prefix=".tf-sess-", suffix=".tmp"
        )
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
                f.flush()
                os.fsync(f.fileno())
            os.replace(tmp, dest)
        finally:
            if os.path.exists(tmp):
                os.unlink(tmp)
    finally:
        if lock_handle is not None:
            fcntl.flock(lock_handle.fileno(), fcntl.LOCK_UN)
            lock_handle.close()


class Session:
    """In-memory session with undo/redo and file persistence."""

    def __init__(self) -> None:
        self._state: dict[str, Any] = copy.deepcopy(_DEFAULT_STATE)
        self.project_path: Optional[str] = None
        self._modified: bool = False
        self._undo: list[dict[str, Any]] = []
        self._redo: list[dict[str, Any]] = []

    # -- lifecycle -------------------------------------------------------

    def new(self, base_url: Optional[str] = None) -> dict[str, Any]:
        self._state = copy.deepcopy(_DEFAULT_STATE)
        if base_url:
            self._state["base_url"] = base_url
        now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        self._state["created"] = now
        self._state["updated"] = now
        self._undo.clear()
        self._redo.clear()
        self._modified = True
        return self.state

    def load(self, path: str) -> dict[str, Any]:
        p = Path(path)
        if not p.is_file():
            raise FileNotFoundError(f"Session file not found: {path}")
        loaded = json.loads(p.read_text(encoding="utf-8"))
        merged = copy.deepcopy(_DEFAULT_STATE)
        merged.update(loaded)
        self._state = merged
        self.project_path = str(p.resolve())
        self._modified = False
        self._undo.clear()
        self._redo.clear()
        return self.state

    def has_project(self) -> bool:
        return self.project_path is not None

    # -- mutation tracking ----------------------------------------------

    def snapshot(self) -> None:
        """Record a snapshot for undo before a mutation."""
        self._undo.append(copy.deepcopy(self._state))
        if len(self._undo) > MAX_HISTORY:
            self._undo.pop(0)
        self._redo.clear()

    def _touch(self) -> None:
        self._state["updated"] = time.strftime(
            "%Y-%m-%dT%H:%M:%SZ", time.gmtime()
        )
        self._modified = True

    def set(self, key: str, value: Any) -> None:
        self.snapshot()
        self._state[key] = value
        self._touch()

    def update(self, **kwargs: Any) -> None:
        self.snapshot()
        for k, v in kwargs.items():
            if v is not None:
                self._state[k] = v
        self._touch()

    def get(self, key: str, default: Any = None) -> Any:
        return self._state.get(key, default)

    @property
    def state(self) -> dict[str, Any]:
        return copy.deepcopy(self._state)

    # -- undo / redo -----------------------------------------------------

    def undo(self) -> bool:
        if not self._undo:
            return False
        self._redo.append(copy.deepcopy(self._state))
        self._state = self._undo.pop()
        self._modified = True
        return True

    def redo(self) -> bool:
        if not self._redo:
            return False
        self._undo.append(copy.deepcopy(self._state))
        self._state = self._redo.pop()
        self._modified = True
        return True

    # -- persistence -----------------------------------------------------

    def save(self, path: Optional[str] = None) -> str:
        target = path or self.project_path
        if not target:
            raise ValueError("No session path set. Provide a path to save().")
        if not self._state.get("created"):
            now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            self._state["created"] = now
        self._state["updated"] = time.strftime(
            "%Y-%m-%dT%H:%M:%SZ", time.gmtime()
        )
        _locked_save_json(target, self._state)
        self.project_path = str(Path(target).resolve())
        self._modified = False
        return self.project_path

    # Alias used by the auto-save result_callback in the CLI.
    def save_session(self) -> str:
        return self.save()


# -- module-level singleton (used by the CLI) ---------------------------

_SESSION: Optional[Session] = None


def get_session() -> Session:
    global _SESSION
    if _SESSION is None:
        _SESSION = Session()
    return _SESSION


def reset_session() -> None:
    global _SESSION
    _SESSION = None
