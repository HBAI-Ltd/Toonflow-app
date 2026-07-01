from __future__ import annotations

import traceback
from pathlib import Path
from typing import Any

from .audio_extract import preprocess_video
from .frame_sample import sample_frames
from .json_io import write_json
from .media_probe import probe_media
from .shot_detect import detect_shots
from .transcribe import transcribe_audio


def _status(workdir: Path, stage: str, state: str, extra: dict[str, Any] | None = None) -> None:
    write_json(workdir / "status.json", {"stage": stage, "state": state, **(extra or {})})


def run_all(input_path: str | Path, workdir: str | Path, whisper_model: str = "turbo", skip_transcribe: bool = False) -> dict[str, Any]:
    work = Path(workdir)
    work.mkdir(parents=True, exist_ok=True)
    try:
        _status(work, "probe", "running")
        probe_media(input_path, work / "media.json")

        _status(work, "preprocess", "running")
        preprocess = preprocess_video(input_path, work)

        _status(work, "transcribe", "running")
        audio_path = preprocess.get("audioPath")
        if skip_transcribe:
            write_json(work / "transcript.json", {"engine": "whisper", "model": whisper_model, "segments": [], "warnings": ["skipped"]})
        else:
            transcribe_audio(audio_path or work / "audio.wav", work / "transcript.json", whisper_model)

        _status(work, "detect-shots", "running")
        detect_shots(work / "normalized.mp4", work / "shots.json")

        _status(work, "sample-frames", "running")
        sample_frames(work / "normalized.mp4", work / "shots.json", work / "frames")

        artifacts = {
            "media": str(work / "media.json"),
            "normalized": str(work / "normalized.mp4"),
            "audio": audio_path,
            "cover": str(work / "cover.jpg"),
            "transcript": str(work / "transcript.json"),
            "shots": str(work / "shots.json"),
            "frames": str(work / "frames.json"),
        }
        result = {"ok": True, "artifacts": artifacts}
        write_json(work / "artifacts.json", result)
        _status(work, "done", "success", {"artifacts": artifacts})
        return result
    except Exception as exc:
        error = {
            "ok": False,
            "message": str(exc),
            "type": exc.__class__.__name__,
            "traceback": traceback.format_exc(),
        }
        write_json(work / "error.json", error)
        _status(work, "failed", "error", {"message": str(exc)})
        raise
