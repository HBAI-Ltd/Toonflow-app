from __future__ import annotations

import shutil
import subprocess
from dataclasses import dataclass
from typing import Sequence


@dataclass
class CommandResult:
    args: list[str]
    stdout: str
    stderr: str


class AnalyzerCommandError(RuntimeError):
    def __init__(self, message: str, args: Sequence[str] | None = None, stderr: str = ""):
        super().__init__(message)
        self.args_list = list(args or [])
        self.stderr = stderr

    def to_json(self) -> dict[str, object]:
        return {
            "message": str(self),
            "args": self.args_list,
            "stderr": self.stderr[-4000:],
        }


def ensure_binary(name: str) -> str:
    resolved = shutil.which(name)
    if not resolved:
        raise AnalyzerCommandError(f"Binary not found: {name}", [name])
    return resolved


def run_command(args: Sequence[str], timeout_sec: int = 300) -> CommandResult:
    try:
        completed = subprocess.run(
            list(args),
            check=True,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=timeout_sec,
        )
    except subprocess.TimeoutExpired as exc:
        stderr = (exc.stderr or "") if isinstance(exc.stderr, str) else ""
        raise AnalyzerCommandError(f"Command timed out after {timeout_sec}s", args, stderr) from exc
    except subprocess.CalledProcessError as exc:
        raise AnalyzerCommandError(f"Command failed with exit code {exc.returncode}", args, exc.stderr or "") from exc

    return CommandResult(args=list(args), stdout=completed.stdout, stderr=completed.stderr)
