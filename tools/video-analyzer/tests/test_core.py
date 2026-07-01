from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from sr_analyzer import audio_extract, frame_sample, media_probe, transcribe  # noqa: E402
from sr_analyzer.ffmpeg_tools import CommandResult  # noqa: E402
from sr_analyzer.shot_detect import _fixed_shots, _merge_short, _split_long  # noqa: E402


class AnalyzerCoreTests(unittest.TestCase):
    def test_probe_media_parses_ffprobe_json(self) -> None:
        raw = {
            "format": {"duration": "7.5"},
            "streams": [
                {"codec_type": "video", "width": 1080, "height": 1920, "avg_frame_rate": "30000/1001", "codec_name": "h264"},
                {"codec_type": "audio", "codec_name": "aac"},
            ],
        }
        with patch.object(media_probe, "ensure_binary", return_value="ffprobe"), patch.object(
            media_probe,
            "run_command",
            return_value=CommandResult(args=[], stdout=json.dumps(raw), stderr=""),
        ):
            media = media_probe.probe_media("source.mp4")

        self.assertEqual(media["durationSec"], 7.5)
        self.assertEqual(media["width"], 1080)
        self.assertEqual(media["height"], 1920)
        self.assertAlmostEqual(media["fps"], 29.970, places=2)
        self.assertTrue(media["hasAudio"])

    def test_preprocess_no_audio_does_not_report_audio_path(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            with patch.object(audio_extract, "ensure_binary", return_value="ffmpeg"), patch.object(
                audio_extract,
                "probe_media",
                return_value={"durationSec": 1, "hasAudio": False},
            ), patch.object(audio_extract, "run_command", return_value=CommandResult(args=[], stdout="", stderr="")):
                result = audio_extract.preprocess_video("source.mp4", tmp)

            self.assertIsNone(result["audioPath"])
            self.assertEqual(result["media"]["hasAudio"], False)
            self.assertTrue((Path(tmp) / "preprocess.json").exists())

    def test_shot_merge_split_and_fixed_fallback_rules(self) -> None:
        merged = _merge_short(
            [
                {"shotId": "a", "startSec": 0.0, "endSec": 1.0, "durationSec": 1.0},
                {"shotId": "b", "startSec": 1.0, "endSec": 1.3, "durationSec": 0.3},
            ]
        )
        self.assertEqual(len(merged), 1)
        self.assertEqual(merged[0]["endSec"], 1.3)

        split = _split_long([{"shotId": "a", "startSec": 0.0, "endSec": 7.2, "durationSec": 7.2}])
        self.assertEqual([s["durationSec"] for s in split], [3.0, 4.2])

        fallback = _fixed_shots(7.0)
        self.assertEqual(len(fallback), 3)
        self.assertEqual(fallback[-1]["endSec"], 7.0)

    def test_frame_sample_outputs_three_frames_per_shot(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            work = Path(tmp)
            shots = work / "shots.json"
            shots.write_text(json.dumps({"shots": [{"shotId": "shot_001", "startSec": 0, "endSec": 3}]}), encoding="utf-8")
            with patch.object(frame_sample, "ensure_binary", return_value="ffmpeg"), patch.object(
                frame_sample,
                "run_command",
                return_value=CommandResult(args=[], stdout="", stderr=""),
            ):
                result = frame_sample.sample_frames("normalized.mp4", shots, work / "frames")

            self.assertEqual(len(result["samples"]), 3)
            self.assertEqual({item["frameType"] for item in result["samples"]}, {"start", "middle", "end"})
            self.assertTrue((work / "frames.json").exists())

    def test_transcribe_skips_when_whisper_missing(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            work = Path(tmp)
            audio = work / "audio.wav"
            audio.write_bytes(b"fake")
            with patch.dict(sys.modules, {"whisper": None}):
                result = transcribe.transcribe_audio(audio, work / "transcript.json")

            self.assertEqual(result["segments"], [])
            self.assertTrue(any("openai-whisper is not installed" in item for item in result["warnings"]))
            self.assertTrue((work / "transcript.json").exists())


if __name__ == "__main__":
    unittest.main()
