from __future__ import annotations

import json
from fractions import Fraction
from pathlib import Path
from typing import Any

from .ffmpeg_tools import ensure_binary, run_command
from .json_io import write_json


def _parse_float(value: Any) -> float | None:
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        return None
    return parsed if parsed >= 0 else None


def _parse_fps(value: Any) -> float | None:
    if not value or value == "0/0":
        return None
    try:
        parsed = float(Fraction(str(value)))
    except (ValueError, ZeroDivisionError):
        return None
    return parsed if parsed > 0 else None


def probe_media(input_path: str | Path, output_path: str | Path | None = None) -> dict[str, Any]:
    ffprobe = ensure_binary("ffprobe")
    result = run_command(
        [
            ffprobe,
            "-v",
            "error",
            "-print_format",
            "json",
            "-show_format",
            "-show_streams",
            str(input_path),
        ],
        timeout_sec=120,
    )
    raw = json.loads(result.stdout or "{}")
    streams = raw.get("streams") or []
    video_stream = next((s for s in streams if s.get("codec_type") == "video"), {})
    audio_stream = next((s for s in streams if s.get("codec_type") == "audio"), {})
    duration = _parse_float(raw.get("format", {}).get("duration")) or _parse_float(video_stream.get("duration"))
    media = {
        "durationSec": duration or 0,
        "width": video_stream.get("width"),
        "height": video_stream.get("height"),
        "fps": _parse_fps(video_stream.get("avg_frame_rate")) or _parse_fps(video_stream.get("r_frame_rate")) or 0,
        "hasAudio": bool(audio_stream),
        "videoCodec": video_stream.get("codec_name"),
        "audioCodec": audio_stream.get("codec_name") if audio_stream else None,
        "raw": raw,
    }
    if output_path:
        write_json(output_path, media)
    return media
