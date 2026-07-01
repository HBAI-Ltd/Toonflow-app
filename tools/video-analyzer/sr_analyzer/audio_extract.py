from __future__ import annotations

from pathlib import Path
from typing import Any

from .ffmpeg_tools import ensure_binary, run_command
from .json_io import write_json
from .media_probe import probe_media


def preprocess_video(input_path: str | Path, workdir: str | Path) -> dict[str, Any]:
    ffmpeg = ensure_binary("ffmpeg")
    work = Path(workdir)
    work.mkdir(parents=True, exist_ok=True)

    normalized = work / "normalized.mp4"
    audio = work / "audio.wav"
    cover = work / "cover.jpg"
    media_json = work / "media.json"

    media = probe_media(input_path, media_json)

    run_command(
        [
            ffmpeg,
            "-y",
            "-i",
            str(input_path),
            "-map",
            "0:v:0",
            "-an",
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            "-movflags",
            "+faststart",
            str(normalized),
        ],
        timeout_sec=900,
    )

    if media.get("hasAudio"):
        run_command(
            [
                ffmpeg,
                "-y",
                "-i",
                str(input_path),
                "-vn",
                "-ac",
                "1",
                "-ar",
                "16000",
                "-acodec",
                "pcm_s16le",
                str(audio),
            ],
            timeout_sec=900,
        )

    run_command(
        [
            ffmpeg,
            "-y",
            "-ss",
            "0",
            "-i",
            str(input_path),
            "-frames:v",
            "1",
            "-q:v",
            "2",
            str(cover),
        ],
        timeout_sec=120,
    )

    result = {
        "normalizedPath": str(normalized),
        "audioPath": str(audio) if audio.exists() else None,
        "coverPath": str(cover),
        "mediaPath": str(media_json),
        "media": media,
    }
    write_json(work / "preprocess.json", result)
    return result
