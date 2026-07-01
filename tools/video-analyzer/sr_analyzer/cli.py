from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

from .audio_extract import preprocess_video
from .ffmpeg_tools import AnalyzerCommandError, ensure_binary
from .frame_sample import sample_frames
from .media_probe import probe_media
from .pipeline import run_all
from .shot_detect import detect_shots
from .transcribe import transcribe_audio


def _print_json(data: dict[str, Any]) -> None:
    print(json.dumps(data, ensure_ascii=False, indent=2))


def check_env(_: argparse.Namespace) -> dict[str, Any]:
    return {
        "ffmpeg": ensure_binary("ffmpeg"),
        "ffprobe": ensure_binary("ffprobe"),
    }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="sr_analyzer", description="Structural replica video analyzer")
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("check-env", help="Check ffmpeg and ffprobe availability").set_defaults(func=check_env)

    probe = sub.add_parser("probe", help="Read media metadata")
    probe.add_argument("--input", required=True)
    probe.add_argument("--output", required=True)
    probe.set_defaults(func=lambda args: probe_media(args.input, args.output))

    preprocess = sub.add_parser("preprocess", help="Normalize video and extract audio/cover")
    preprocess.add_argument("--input", required=True)
    preprocess.add_argument("--workdir", required=True)
    preprocess.set_defaults(func=lambda args: preprocess_video(args.input, args.workdir))

    transcribe = sub.add_parser("transcribe", help="Transcribe audio with Whisper")
    transcribe.add_argument("--audio", required=True)
    transcribe.add_argument("--output", required=True)
    transcribe.add_argument("--model", default="turbo")
    transcribe.set_defaults(func=lambda args: transcribe_audio(args.audio, args.output, args.model))

    shots = sub.add_parser("detect-shots", help="Detect video shots")
    shots.add_argument("--video", required=True)
    shots.add_argument("--output", required=True)
    shots.set_defaults(func=lambda args: detect_shots(args.video, args.output))

    frames = sub.add_parser("sample-frames", help="Sample frames for each shot")
    frames.add_argument("--video", required=True)
    frames.add_argument("--shots", required=True)
    frames.add_argument("--output-dir", required=True)
    frames.set_defaults(func=lambda args: sample_frames(args.video, args.shots, args.output_dir))

    all_cmd = sub.add_parser("run-all", help="Run the full analyzer pipeline")
    all_cmd.add_argument("--input", required=True)
    all_cmd.add_argument("--workdir", required=True)
    all_cmd.add_argument("--model", default="turbo")
    all_cmd.add_argument("--skip-transcribe", action="store_true")
    all_cmd.set_defaults(func=lambda args: run_all(args.input, args.workdir, args.model, args.skip_transcribe))

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        result = args.func(args)
        _print_json(result)
        return 0
    except AnalyzerCommandError as exc:
        _print_json({"ok": False, "error": exc.to_json()})
        return 1
    except Exception as exc:
        _print_json({"ok": False, "error": {"message": str(exc), "type": exc.__class__.__name__}})
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
