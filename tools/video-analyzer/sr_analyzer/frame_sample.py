from __future__ import annotations

from pathlib import Path
from typing import Any

from .ffmpeg_tools import ensure_binary, run_command
from .json_io import read_json, write_json


def _sample_time(start: float, end: float, frame_type: str) -> float:
    duration = max(end - start, 0)
    if frame_type == "start":
        return start + min(0.1, duration / 3 if duration else 0)
    if frame_type == "end":
        return max(start, end - min(0.1, duration / 3 if duration else 0))
    return start + duration / 2


def sample_frames(video_path: str | Path, shots_path: str | Path, output_dir: str | Path) -> dict[str, Any]:
    ffmpeg = ensure_binary("ffmpeg")
    shots_data = read_json(shots_path)
    frames_dir = Path(output_dir)
    frames_dir.mkdir(parents=True, exist_ok=True)

    samples: list[dict[str, Any]] = []
    for shot in shots_data.get("shots", []):
        shot_id = shot["shotId"]
        start = float(shot["startSec"])
        end = float(shot["endSec"])
        for frame_type in ("start", "middle", "end"):
            time_sec = _sample_time(start, end, frame_type)
            file_path = frames_dir / f"{shot_id}_{frame_type}.jpg"
            run_command(
                [
                    ffmpeg,
                    "-y",
                    "-ss",
                    f"{time_sec:.3f}",
                    "-i",
                    str(video_path),
                    "-frames:v",
                    "1",
                    "-q:v",
                    "2",
                    str(file_path),
                ],
                timeout_sec=120,
            )
            samples.append(
                {
                    "shotId": shot_id,
                    "frameType": frame_type,
                    "timeSec": round(time_sec, 3),
                    "filePath": str(file_path),
                }
            )

    return write_json(frames_dir.parent / "frames.json", {"samples": samples})
