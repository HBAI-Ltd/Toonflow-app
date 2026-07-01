from __future__ import annotations

from pathlib import Path
from typing import Any

from .json_io import write_json
from .media_probe import probe_media

MIN_SHOT_SEC = 0.6
MAX_SHOT_SEC = 6.0
FALLBACK_SHOT_SEC = 3.0


def _make_shot(index: int, start: float, end: float) -> dict[str, Any]:
    return {
        "shotId": f"shot_{index + 1:03d}",
        "startSec": round(start, 3),
        "endSec": round(end, 3),
        "durationSec": round(max(end - start, 0), 3),
    }


def _fixed_shots(duration: float, step: float = FALLBACK_SHOT_SEC) -> list[dict[str, Any]]:
    if duration <= 0:
        return [_make_shot(0, 0, step)]
    shots = []
    start = 0.0
    while start < duration:
        end = min(start + step, duration)
        shots.append(_make_shot(len(shots), start, end))
        start = end
    return shots


def _merge_short(shots: list[dict[str, Any]]) -> list[dict[str, Any]]:
    merged: list[dict[str, Any]] = []
    for shot in shots:
        if merged and shot["durationSec"] < MIN_SHOT_SEC:
            prev = merged[-1]
            prev["endSec"] = shot["endSec"]
            prev["durationSec"] = round(prev["endSec"] - prev["startSec"], 3)
        else:
            merged.append(dict(shot))
    return [_make_shot(i, s["startSec"], s["endSec"]) for i, s in enumerate(merged)]


def _split_long(shots: list[dict[str, Any]]) -> list[dict[str, Any]]:
    result: list[dict[str, Any]] = []
    for shot in shots:
        start = float(shot["startSec"])
        end = float(shot["endSec"])
        while end - start > MAX_SHOT_SEC:
            next_end = min(start + FALLBACK_SHOT_SEC, end)
            result.append(_make_shot(len(result), start, next_end))
            start = next_end
        result.append(_make_shot(len(result), start, end))
    return result


def _scenedetect_shots(video_path: str | Path, duration: float) -> tuple[list[dict[str, Any]], list[str]]:
    warnings: list[str] = []
    try:
        from scenedetect import AdaptiveDetector, ContentDetector, detect  # type: ignore
    except Exception:
        return [], ["scenedetect_unavailable"]

    def detect_with(detector: Any) -> list[Any]:
        try:
            return detect(str(video_path), detector)
        except Exception as exc:
            warnings.append(f"scenedetect_failed:{exc.__class__.__name__}")
            return []

    scene_list = detect_with(AdaptiveDetector())
    if len(scene_list) <= 1:
        scene_list = detect_with(ContentDetector())

    shots: list[dict[str, Any]] = []
    for start_tc, end_tc in scene_list:
        start = max(start_tc.get_seconds(), 0)
        end = min(end_tc.get_seconds(), duration) if duration > 0 else end_tc.get_seconds()
        if end > start:
            shots.append(_make_shot(len(shots), start, end))
    return shots, warnings


def detect_shots(video_path: str | Path, output_path: str | Path) -> dict[str, Any]:
    media = probe_media(video_path)
    duration = float(media.get("durationSec") or 0)
    shots, warnings = _scenedetect_shots(video_path, duration)
    if not shots:
        shots = _fixed_shots(duration)
        warnings.append("fixed_interval_fallback")
    shots = _split_long(_merge_short(shots))
    return write_json(
        output_path,
        {
            "engine": "scenedetect",
            "shots": shots,
            "warnings": warnings,
        },
    )
