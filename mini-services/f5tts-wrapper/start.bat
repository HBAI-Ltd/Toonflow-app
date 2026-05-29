@echo off
echo ============================================================
echo  F5-TTS Wrapper Service (port 5052)
echo  Proxies TTS requests to F5-TTS Gradio via gradio_client
echo ============================================================
echo.

:: --- Config ---
set GRADIO_URL=http://127.0.0.1:5050
set WRAPPER_PORT=5052

:: --- Activate Python venv ---
:: Edit this path to match your F5-TTS venv location
set VENV_PATH=C:\AI\F5-TTS\venv

if not exist "%VENV_PATH%\Scripts\activate.bat" (
    echo [ERROR] Python venv not found at: %VENV_PATH%
    echo Please edit start.bat and set VENV_PATH to your venv location.
    pause
    exit /b 1
)

call "%VENV_PATH%\Scripts\activate.bat"

:: --- Install dependencies ---
echo [f5tts-wrapper] Installing dependencies...
pip install -r "%~dp0requirements.txt" -q

:: --- Start server ---
echo [f5tts-wrapper] Starting on port %WRAPPER_PORT% ...
echo [f5tts-wrapper] F5-TTS Gradio URL: %GRADIO_URL%
echo [f5tts-wrapper] Health check: http://127.0.0.1:%WRAPPER_PORT%/health
echo.

python "%~dp0tts_server.py" --port %WRAPPER_PORT% --gradio-url %GRADIO_URL%

pause
