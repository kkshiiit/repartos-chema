---
name: video-analyzer
description: Analyze uploaded or local video files through timestamped frames and visible text, and optionally a verified local transcript. Use when asked to watch a video, review a screen recording, explain a tutorial, inspect UI motion, or relate a clip to an existing project. Distinguish observed visuals, OCR, audio evidence, and inference.
---

# Video Analyzer for Codex

Adapted from guimatheus92/mcp-video-analyzer's video skill. Preserve LICENSE and UPSTREAM.json. The original skill is retained as references/upstream-video.md for compatibility, not as permission to activate its optional services.

## Local files first

Use local files directly when the user supplied a workspace path. Do not upload their video or request it from Library again.

1. Probe and extract representative frames with the bundled helper:
   ```bash
   python3 <skill-base-dir>/scripts/inspect_video.py "/absolute/video.mp4" --out "/absolute/new-output-folder" --count 16 --width 720
   ```
   Requirements: Python 3, ffmpeg and ffprobe. There are no Python packages, network calls, API keys, or model downloads in this helper.
2. Read manifest.json and open the resulting PNG files with view_image or the host's supported image viewer. These are video frames, not app tests.
3. Inspect denser frames around changes or unreadable sections:
   ```bash
   python3 <skill-base-dir>/scripts/inspect_video.py "/absolute/video.mp4" --out "/absolute/new-range-folder" --start 40 --end 42 --count 8 --width 1080
   ```
   With count 1 the helper seeks to start. Frame times are requested seek targets, explicitly marked seek-target; do not present them as measured presentation timestamps or frame-accurate events.
4. Use visible subtitles as on-screen evidence. OCR is optional if a local OCR tool exists; verify consequential names and numbers visually.
5. If audio matters and a verified local speech-to-text tool is available, transcribe locally and inspect its output. Audio-track presence alone is not a transcript. State when audio was not independently transcribed. Do not infer speech, music, sounds, exact animation timing, or gesture behavior from still images.

Choose enough frames to cover the whole requested range, then densify important intervals. Uniform sampling can miss fast events. Use several independent ranges rather than claiming exhaustive inspection of every frame. Inspect source-resolution frames when small text matters. Never substitute generated images for the uploaded video.

## Optional upstream MCP / CLI

The upstream supports a video-analyzer MCP server and CLI. Neither is installed or connected by installing this skill alone.

- Prefer the bundled local helper when it answers a local-video request.
- If an appropriate MCP is actually available, inspect its capabilities and cost/data handling before using it. Do not invent tool availability.
- CLI package version reviewed for this adaptation: mcp-video-analyzer@0.11.0; do not silently replace it with @latest.
- The upstream can fall back to a PAID Whisper API when OPENAI_API_KEY is present. A key in the environment is not user permission to spend money. For a no-cost request, use local extraction or an explicitly local transcription backend; never invoke the API fallback.
- Install optional runtimes outside the user's application dependencies. Do not modify an APK project to analyze a reference video.
- Preserve upstream warnings about missing transcripts or partial results. A missing transcript is not proof of silent audio.

## Report evidence, then advice

Give a short timeline with approximate M:SS marks, the significant visible elements, and the practical implication for the user's project. Separate:
- observed frames / text;
- verified audio transcript, if any;
- recommendations or inferences.

For an existing app, check its actual stack and implemented features before recommending a new service. A video's example stack does not authorize migration, paid hosting, deployment, data uploads or new accounts. Distinguish planning from implementation and web evidence from Android testing.

Keep raw video and intermediate frames unchanged. Use a task-scoped output folder, retain evidence while working, and do not recursively delete arbitrary paths. Save user-facing reports through the host's normal artifact workflow; personal skills are saved through the skill store.
