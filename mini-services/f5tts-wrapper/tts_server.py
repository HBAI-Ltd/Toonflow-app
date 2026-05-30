"""
F5-TTS Wrapper Service
FastAPI server on port 5052
Uses gradio_client to call F5-TTS Gradio with proper file upload

Usage:
  python tts_server.py --port 5052 --gradio-url http://127.0.0.1:5050

Windows (with venv):
  call C:\AI\F5-TTS\venv\Scripts\activate.bat
  pip install -r requirements.txt
  python tts_server.py
"""

import os
import sys
import base64
import argparse
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

# ============================================================
# App setup
# ============================================================

app = FastAPI(title="F5-TTS Wrapper", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# Config
# ============================================================

GRADIO_URL = "http://127.0.0.1:5050"
_gradio_client = None

# ============================================================
# Request / Response models
# ============================================================

class TTSRequest(BaseModel):
    refAudioPath: str
    refText: str = ""
    genText: str
    removeSilence: bool = False
    randomizeSeed: bool = True
    seed: int = 0
    crossFade: float = 0.15
    nfeStep: int = 32
    speed: float = 1.0

# ============================================================
# Gradio client
# ============================================================

def get_gradio_client():
    """Lazily initialize and cache gradio_client connection."""
    global _gradio_client
    if _gradio_client is None:
        try:
            from gradio_client import Client, handle_file
            print(f"[f5tts-wrapper] Connecting to F5-TTS Gradio at {GRADIO_URL} ...")
            _gradio_client = Client(GRADIO_URL, verbose=False)
            print("[f5tts-wrapper] Connected to F5-TTS Gradio!")
        except Exception as e:
            print(f"[f5tts-wrapper] Failed to connect to Gradio: {e}")
            raise
    return _gradio_client

def reset_client():
    """Reset client (e.g. after connection error)."""
    global _gradio_client
    _gradio_client = None

# ============================================================
# MIME helper
# ============================================================

MIME_MAP = {
    ".wav": "audio/wav",
    ".mp3": "audio/mpeg",
    ".m4a": "audio/mp4",
    ".flac": "audio/flac",
    ".ogg": "audio/ogg",
    ".aac": "audio/aac",
}

def get_mime_type(file_path: str) -> str:
    ext = Path(file_path).suffix.lower()
    return MIME_MAP.get(ext, "audio/wav")

# ============================================================
# Endpoints
# ============================================================

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "gradio_url": GRADIO_URL,
        "client_ready": _gradio_client is not None,
    }


@app.post("/tts")
async def tts(req: TTSRequest):
    """
    Synthesize speech via F5-TTS.

    Input: JSON with refAudioPath, genText, and optional parameters.
    Output: JSON with audioBase64 (data:audio/wav;base64,...).
    """
    # Validate inputs
    if not req.refAudioPath:
        raise HTTPException(status_code=400, detail="refAudioPath is required")
    if not os.path.isfile(req.refAudioPath):
        raise HTTPException(
            status_code=400,
            detail=f"refAudioPath file not found: {req.refAudioPath}",
        )
    if not req.genText or not req.genText.strip():
        raise HTTPException(status_code=400, detail="genText is required")

    try:
        client = get_gradio_client()
    except Exception as e:
        reset_client()
        raise HTTPException(
            status_code=502,
            detail=f"Cannot connect to F5-TTS Gradio at {GRADIO_URL}: {e}",
        )

    try:
        print(
            f"[f5tts-wrapper] Synthesizing: "
            f'genText="{req.genText[:60]}{"..." if len(req.genText) > 60 else ""}", '
            f'refAudio="{req.refAudioPath}", speed={req.speed}, nfeStep={req.nfeStep}'
        )

        result = client.predict(
            ref_audio_input=handle_file(req.refAudioPath),
            ref_text_input=req.refText,
            gen_text_input=req.genText,
            remove_silence=req.removeSilence,
            randomize_seed=req.randomizeSeed,
            seed_input=req.seed,
            cross_fade_duration_slider=req.crossFade,
            nfe_slider=req.nfeStep,
            speed_slider=req.speed,
            api_name="/basic_tts",
        )

        # result[0] = audio file path on Gradio server
        # result[1] = spectrogram (ignored)
        # result[2] = ref text (ignored)
        # result[3] = seed (ignored)
        audio_path = result[0]

        if not audio_path:
            raise HTTPException(
                status_code=500,
                detail="F5-TTS returned empty audio path",
            )

        # gradio_client may return a local path or a URL
        if isinstance(audio_path, str) and audio_path.startswith("http"):
            # URL — download it
            import requests as req_lib
            print(f"[f5tts-wrapper] Downloading audio from URL: {audio_path[:100]}")
            resp = req_lib.get(audio_path, timeout=60)
            audio_bytes = resp.content
            mime = resp.headers.get("content-type", "audio/wav")
            if not mime.startswith("audio/"):
                mime = "audio/wav"
        elif isinstance(audio_path, str) and os.path.isfile(audio_path):
            # Local file path
            print(f"[f5tts-wrapper] Reading audio from path: {audio_path}")
            with open(audio_path, "rb") as f:
                audio_bytes = f.read()
            mime = get_mime_type(audio_path)
        else:
            raise HTTPException(
                status_code=500,
                detail=f"F5-TTS returned invalid audio path: {audio_path}",
            )

        # Encode to base64 data URI
        audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")
        data_uri = f"data:{mime};base64,{audio_b64}"

        print(
            f"[f5tts-wrapper] Success! Audio: {len(audio_bytes)} bytes, "
            f"base64: {len(audio_b64)} chars"
        )

        return {"success": True, "audioBase64": data_uri}

    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        print(f"[f5tts-wrapper] Error: {error_msg}")

        # Reset client on connection errors
        if any(
            kw in error_msg.lower()
            for kw in ["connection", "timeout", "refused", "reset"]
        ):
            reset_client()

        raise HTTPException(status_code=500, detail=error_msg)


# ============================================================
# Main
# ============================================================

if __name__ == "__main__":
    import uvicorn

    parser = argparse.ArgumentParser(description="F5-TTS Wrapper Service")
    parser.add_argument(
        "--port", type=int, default=5052, help="Port to listen on (default: 5052)"
    )
    parser.add_argument(
        "--gradio-url",
        type=str,
        default="http://127.0.0.1:5050",
        help="F5-TTS Gradio URL (default: http://127.0.0.1:5050)",
    )
    parser.add_argument(
        "--host",
        type=str,
        default="0.0.0.0",
        help="Host to bind (default: 0.0.0.0)",
    )
    args = parser.parse_args()

    GRADIO_URL = args.gradio_url
    print(f"[f5tts-wrapper] Starting on port {args.port}")
    print(f"[f5tts-wrapper] F5-TTS Gradio URL: {GRADIO_URL}")
    print(f"[f5tts-wrapper] Health check: http://127.0.0.1:{args.port}/health")

    uvicorn.run(app, host=args.host, port=args.port)
