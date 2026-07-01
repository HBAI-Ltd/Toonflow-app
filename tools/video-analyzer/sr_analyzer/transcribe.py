from __future__ import annotations

from pathlib import Path
from typing import Any

from .json_io import write_json


def _segment_to_json(segment: dict[str, Any]) -> dict[str, Any]:
    start = float(segment.get("start") or 0)
    end = float(segment.get("end") or start)
    text = str(segment.get("text") or "").strip()
    duration = max(end - start, 0)
    speech_rate = (len(text) / duration) if duration > 0 and text else None
    return {
        "startSec": start,
        "endSec": end,
        "text": text,
        "speechRateCps": speech_rate,
    }


def transcribe_audio(audio_path: str | Path, output_path: str | Path, model_name: str = "turbo") -> dict[str, Any]:
    audio = Path(audio_path)
    if not audio.exists():
        return write_json(
            output_path,
            {
                "engine": "whisper",
                "model": model_name,
                "segments": [],
                "warnings": ["no_audio"],
            },
        )

    try:
        import whisper  # type: ignore
    except Exception as exc:
        return write_json(
            output_path,
            {
                "engine": "whisper",
                "model": model_name,
                "segments": [],
                "warnings": [
                    "openai-whisper is not installed; transcript was skipped. Run `python -m pip install -e tools/video-analyzer` to enable ASR.",
                    f"import_error: {exc}",
                ],
            },
        )

    model = whisper.load_model(model_name)
    result = model.transcribe(str(audio))
    segments = [_segment_to_json(segment) for segment in result.get("segments", [])]
    return write_json(
        output_path,
        {
            "engine": "whisper",
            "model": model_name,
            "segments": segments,
        },
    )
