#!/usr/bin/env python3
"""Fetch and clean YouTube-generated auto captions for a video.

This intentionally uses yt-dlp auto captions only. It does not request or download
creator/user-provided subtitle tracks.
"""

from __future__ import annotations

import argparse
import html
import json
import re
import shutil
import subprocess
import sys
import tempfile
import textwrap
from pathlib import Path
from typing import Any

HEADER_LINES = {
    "WEBVTT",
    "Kind: captions",
    "Language: en",
}
TIMED_TAG_RE = re.compile(r"<\d{2}:\d{2}:\d{2}\.\d{3}>")
TAG_RE = re.compile(r"<[^>]+>")
SPACE_RE = re.compile(r"\s+")


def run(command: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(command, capture_output=True, text=True, timeout=180)


def require_yt_dlp() -> None:
    if shutil.which("yt-dlp") is None:
        raise SystemExit("yt-dlp is not installed or not on PATH")


def load_video_info(url: str) -> dict[str, Any]:
    proc = run(["yt-dlp", "--skip-download", "--dump-single-json", url])
    if proc.returncode != 0:
        raise SystemExit(proc.stderr.strip() or "yt-dlp failed to read video metadata")
    try:
        return json.loads(proc.stdout)
    except json.JSONDecodeError as exc:
        raise SystemExit(f"yt-dlp returned invalid JSON: {exc}") from exc


def choose_language(auto_captions: dict[str, Any], requested: str | None) -> str:
    if requested:
        if requested in auto_captions:
            return requested
        available = ", ".join(sorted(auto_captions.keys())) or "none"
        raise SystemExit(f"Requested auto-caption language '{requested}' is unavailable. Available: {available}")

    for lang in ("en-orig", "en"):
        if lang in auto_captions:
            return lang

    englishish = [lang for lang in sorted(auto_captions.keys()) if lang.startswith("en")]
    if englishish:
        return englishish[0]

    available = ", ".join(sorted(auto_captions.keys())) or "none"
    raise SystemExit(f"No English auto captions found. Available auto-caption languages: {available}")


def clean_vtt_line(line: str) -> str:
    line = line.strip()
    line = TIMED_TAG_RE.sub("", line)
    line = TAG_RE.sub("", line)
    line = html.unescape(line)
    return SPACE_RE.sub(" ", line).strip()


def vtt_to_text(vtt_path: Path) -> str:
    fragments: list[str] = []

    for raw in vtt_path.read_text(encoding="utf-8", errors="replace").splitlines():
        line = raw.strip()
        if not line:
            continue
        if line in HEADER_LINES or line.startswith(("NOTE", "STYLE", "REGION")):
            continue
        if "-->" in line:
            continue
        if re.fullmatch(r"\d+", line):
            continue

        cleaned = clean_vtt_line(line)
        if not cleaned:
            continue

        if fragments:
            previous = fragments[-1]
            if cleaned == previous:
                continue
            if cleaned.startswith(previous + " "):
                fragments[-1] = cleaned
                continue
            if previous.startswith(cleaned + " "):
                continue

        fragments.append(cleaned)

    text = " ".join(fragments)
    text = SPACE_RE.sub(" ", text).strip()
    text = re.sub(r"\s+([,.;:!?])", r"\1", text)
    return text


def download_auto_vtt(url: str, lang: str, output_dir: Path) -> Path:
    template = str(output_dir / "%(id)s.%(ext)s")
    proc = run([
        "yt-dlp",
        "--skip-download",
        "--write-auto-subs",
        "--sub-langs",
        lang,
        "--sub-format",
        "vtt",
        "-o",
        template,
        url,
    ])
    if proc.returncode != 0:
        raise SystemExit(proc.stderr.strip() or "yt-dlp failed to download auto captions")

    matches = sorted(output_dir.glob(f"*.{lang}.vtt"))
    if not matches:
        all_vtt = sorted(output_dir.glob("*.vtt"))
        if all_vtt:
            return all_vtt[0]
        raise SystemExit("yt-dlp completed but no VTT auto-caption file was found")
    return matches[0]


def main() -> int:
    parser = argparse.ArgumentParser(description="Fetch YouTube auto captions only and create a cleaned transcript.")
    parser.add_argument("url", help="YouTube video URL")
    parser.add_argument("--lang", help="Auto-caption language code. Defaults to en-orig, then en.")
    parser.add_argument("--output-dir", help="Directory for raw VTT and cleaned TXT. Defaults to a new temp directory.")
    parser.add_argument("--preview-chars", type=int, default=1200, help="Preview characters to print. Use 0 for none.")
    args = parser.parse_args()

    require_yt_dlp()

    output_dir = Path(args.output_dir).expanduser().resolve() if args.output_dir else Path(tempfile.mkdtemp(prefix="youtube-auto-transcript-"))
    output_dir.mkdir(parents=True, exist_ok=True)

    info = load_video_info(args.url)
    auto_captions = info.get("automatic_captions") or {}
    lang = choose_language(auto_captions, args.lang)

    vtt_path = download_auto_vtt(args.url, lang, output_dir)
    text = vtt_to_text(vtt_path)
    if not text:
        raise SystemExit("Downloaded auto captions, but the cleaned transcript is empty")

    video_id = info.get("id") or vtt_path.name.split(".")[0]
    txt_path = output_dir / f"{video_id}.{lang}.txt"
    txt_path.write_text("\n".join(textwrap.wrap(text, width=100)) + "\n", encoding="utf-8")

    words = len(text.split())
    print(f"title: {info.get('title') or '(unknown)'}")
    print(f"video_id: {video_id}")
    print(f"language: {lang} (auto captions)")
    print(f"output_dir: {output_dir}")
    print(f"raw_vtt: {vtt_path}")
    print(f"clean_txt: {txt_path}")
    print(f"words: {words}")

    if args.preview_chars:
        print("\npreview:")
        print(text[: args.preview_chars].strip())

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
