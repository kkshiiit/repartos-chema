#!/usr/bin/env python3
"""Extract local video evidence; timestamps are seek targets, not measured PTS."""
import argparse
import hashlib
import json
import math
from pathlib import Path
import shutil
import subprocess
import sys


def run(args, timeout=45):
    result = subprocess.run(args, capture_output=True, text=True, timeout=timeout)
    if result.returncode:
        raise ValueError(result.stderr.strip()[-1200:] or 'Media command failed.')
    return result.stdout


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('video')
    parser.add_argument('--out', required=True)
    parser.add_argument('--start', type=float, default=0)
    parser.add_argument('--end', type=float)
    parser.add_argument('--count', type=int, default=16)
    parser.add_argument('--width', type=int, default=720)
    args = parser.parse_args()
    if not shutil.which('ffmpeg') or not shutil.which('ffprobe'):
        raise ValueError('Install ffmpeg and ffprobe in the analysis environment first.')
    source = Path(args.video).expanduser().resolve()
    if not source.is_file():
        raise ValueError('The local video file does not exist.')
    if not 1 <= args.count <= 60 or not 160 <= args.width <= 4096:
        raise ValueError('Use count 1–60 and width 160–4096.')
    metadata = json.loads(run(['ffprobe', '-v', 'error', '-protocol_whitelist', 'file,pipe', '-show_format', '-show_streams', '-of', 'json', str(source)]))
    streams = metadata.get('streams', [])
    video = next((s for s in streams if s.get('codec_type') == 'video'), None)
    if not video:
        raise ValueError('No video stream found; an audio-only file needs transcription.')
    duration = float(metadata.get('format', {}).get('duration', video.get('duration', 0)))
    if not math.isfinite(duration) or duration <= 0:
        raise ValueError('Cannot determine a finite positive video duration.')
    stream_duration = float(video.get('duration', duration))
    video_duration = min(duration, stream_duration) if math.isfinite(stream_duration) and stream_duration > 0 else duration
    # Audio can outlast the video track; leave a small default tail margin for the final seek.
    end = args.end if args.end is not None else max(0, video_duration - min(0.25, video_duration / 2))
    if not all(math.isfinite(v) for v in [args.start, end]) or not 0 <= args.start <= end < video_duration:
        raise ValueError('Use 0 <= start <= end < video stream duration.')
    if args.count > 1 and args.start == end:
        raise ValueError('Use count 1 for a single timestamp.')
    out = Path(args.out).expanduser().resolve()
    if out.exists() and any(out.iterdir()):
        raise ValueError('Choose a new or empty output directory; existing evidence is not overwritten.')
    out.mkdir(parents=True, exist_ok=True)
    frames = []
    times = [args.start] if args.count == 1 else [args.start + (end - args.start) * i / (args.count - 1) for i in range(args.count)]
    for index, seconds in enumerate(times):
        target = out / f'frame-{index:03d}-{seconds:08.3f}s.png'
        run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-threads', '2', '-ss', f'{seconds:.6f}', '-protocol_whitelist', 'file,pipe', '-i', str(source), '-map', '0:v:0', '-frames:v', '1', '-vf', f'scale=min({args.width}\\,iw):-2', '-n', str(target)])
        if not target.is_file() or not target.stat().st_size:
            raise ValueError(f'No frame returned around {seconds:.3f}s; no exact-frame claim can be made.')
        frames.append({'time_seconds': round(seconds, 3), 'timing_origin': 'seek-target', 'file_path': str(target), 'mime_type': 'image/png'})
    with source.open('rb') as input_file:
        digest = hashlib.file_digest(input_file, 'sha256').hexdigest()
    report = {
        'source_file': str(source), 'sha256': digest,
        'duration_seconds': duration, 'video_duration_seconds': video_duration, 'width': video.get('width'), 'height': video.get('height'),
        'frame_rate': video.get('r_frame_rate'), 'audio_present': any(s.get('codec_type') == 'audio' for s in streams),
        'audio_transcription_verified': False, 'frames': frames,
        'limitations': ['Sampled frames can miss fast events.', 'Seek targets are not measured source-frame timestamps.', 'This helper performs no semantic analysis or transcription.'],
    }
    (out / 'manifest.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(report, ensure_ascii=False))


if __name__ == '__main__':
    try:
        main()
    except (ValueError, OSError, subprocess.TimeoutExpired, json.JSONDecodeError) as error:
        print(json.dumps({'error': str(error)}, ensure_ascii=False), file=sys.stderr)
        sys.exit(2)
