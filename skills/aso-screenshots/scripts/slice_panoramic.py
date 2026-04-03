#!/usr/bin/env python3
"""
Create centered-spread App Store screenshots from a panoramic source.

Default workflow:
  python3 slice_panoramic.py --version-dir ./screenshots/v3

Expected files inside the version directory:
  config.md
  enhanced/panoramic.png
  final/

The script:
- reads style/copy/settings from config.md
- slices the panoramic into portrait App Store panels
- overlays crisp text onto each panel
- writes finished numbered screenshots to final/
"""

from __future__ import annotations

import argparse
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageDraw, ImageFont

DISPLAY_SIZES = {
    "6.5": (1242, 2688),
    "6.7": (1290, 2796),
    "6.9": (1320, 2868),
}

DEFAULT_FONT_BIG_CANDIDATES = [
    os.path.expanduser("~/Library/Fonts/FontBase/BebasNeue-Regular.ttf"),
    "/Library/Fonts/Impact.ttf",
    "/System/Library/Fonts/Supplemental/Impact.ttf",
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
]

DEFAULT_FONT_SMALL_CANDIDATES = [
    os.path.expanduser("~/Library/Fonts/FontBase/Oswald-Bold.ttf"),
    os.path.expanduser("~/Library/Fonts/FontBase/Montserrat-ExtraBold.ttf"),
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
]

TEXT_COLOR = (255, 255, 255)
SHADOW_COLOR = (0, 0, 0, 120)
SHADOW_OFFSET = 5
DEFAULT_STYLE = "centered-spread"
DEFAULT_GAP_SRC = 37
DEFAULT_BIG_SIZE_SCALE = 0.217
DEFAULT_SMALL_SIZE_SCALE = 0.097
DEFAULT_TEXT_TOP_FRAC = 0.06
DEFAULT_TEXT_GAP = 18
DEFAULT_TEXT_SIDE_MARGIN_FRAC = 0.04


@dataclass
class PanelConfig:
    panel: int
    big: str
    small: str
    screenshot: str | None = None


@dataclass
class Config:
    style: str
    font_big: str | None
    font_small: str | None
    big_size_scale: float
    small_size_scale: float
    text_top_frac: float
    text_gap: int
    text_side_margin_frac: float
    gap_src: int


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Create centered-spread App Store screenshots")
    parser.add_argument("--version-dir", required=True, help="Path like screenshots/v3")
    parser.add_argument("--input", help="Optional panoramic override. Defaults to <version-dir>/enhanced/panoramic.png")
    parser.add_argument("--config", help="Optional config override. Defaults to <version-dir>/config.md")
    parser.add_argument("--output-dir", help="Optional output override. Defaults to <version-dir>/final")
    parser.add_argument("--display", default="6.7", choices=DISPLAY_SIZES.keys(), help="iPhone display size")
    return parser.parse_args()


def parse_config(path: Path) -> tuple[Config, list[PanelConfig]]:
    if not path.exists():
        raise FileNotFoundError(f"Config file not found: {path}")

    lines = path.read_text().splitlines()
    metadata: dict[str, str] = {}
    sections: list[tuple[str, list[str]]] = []
    current_title: str | None = None
    current_lines: list[str] = []

    for raw_line in lines:
        stripped = raw_line.strip()
        if not stripped or stripped.startswith("# "):
            continue
        if stripped.startswith("## "):
            if current_title is not None:
                sections.append((current_title, current_lines))
            current_title = stripped[3:].strip()
            current_lines = []
            continue
        if current_title is None:
            if ":" in stripped:
                key, value = stripped.split(":", 1)
                metadata[key.strip().lower()] = value.strip()
            continue
        current_lines.append(stripped)

    if current_title is not None:
        sections.append((current_title, current_lines))

    config = Config(
        style=metadata.get("style", DEFAULT_STYLE).strip().lower(),
        font_big=resolve_font_setting(metadata.get("font_big") or metadata.get("font"), DEFAULT_FONT_BIG_CANDIDATES),
        font_small=resolve_font_setting(metadata.get("font_small"), DEFAULT_FONT_SMALL_CANDIDATES),
        big_size_scale=float(metadata.get("big_size_scale", DEFAULT_BIG_SIZE_SCALE)),
        small_size_scale=float(metadata.get("small_size_scale", DEFAULT_SMALL_SIZE_SCALE)),
        text_top_frac=float(metadata.get("text_top_frac", DEFAULT_TEXT_TOP_FRAC)),
        text_gap=int(metadata.get("text_gap", DEFAULT_TEXT_GAP)),
        text_side_margin_frac=float(metadata.get("text_side_margin_frac", DEFAULT_TEXT_SIDE_MARGIN_FRAC)),
        gap_src=int(metadata.get("gap_src", DEFAULT_GAP_SRC)),
    )

    panels: list[PanelConfig] = []
    for title, body_lines in sections:
        body = parse_section_kv(body_lines)
        panel = int(body.get("panel", title))
        big = body.get("big")
        small = body.get("small")
        screenshot = body.get("raw") or body.get("screenshot")
        if not big or not small:
            raise ValueError(f"Section ## {title} must include 'big:' and 'small:' lines")
        panels.append(PanelConfig(panel=panel, big=big, small=small, screenshot=screenshot))

    if not panels:
        raise ValueError(f"No panel sections found in {path}")

    panels.sort(key=lambda item: item.panel)
    validate_panels(panels)
    return config, panels


def parse_section_kv(lines: Iterable[str]) -> dict[str, str]:
    values: dict[str, str] = {}
    for line in lines:
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        values[key.strip().lower()] = value.strip()
    return values


def validate_panels(panels: list[PanelConfig]) -> None:
    panel_numbers = [item.panel for item in panels]
    if len(set(panel_numbers)) != len(panel_numbers):
        raise ValueError("Duplicate panel numbers found in config.md")
    expected = list(range(1, len(panels) + 1))
    if panel_numbers != expected:
        raise ValueError(f"Panels must be numbered consecutively starting at 1. Found {panel_numbers}")


def resolve_font_setting(setting: str | None, candidates: list[str]) -> str | None:
    if setting:
        candidate_path = Path(setting).expanduser()
        if candidate_path.exists():
            return str(candidate_path)
        for base_dir in [Path.home() / "Library/Fonts", Path("/Library/Fonts"), Path("/System/Library/Fonts"), Path("/System/Library/Fonts/Supplemental")]:
            match = base_dir / setting
            if match.exists():
                return str(match)
    for candidate in candidates:
        if Path(candidate).exists():
            return candidate
    return None


def load_font(path: str | None, size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    if path:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            pass
    return ImageFont.load_default()


def slice_panoramic(img: Image.Image, panel_count: int, target_w: int, target_h: int, gap_src: int) -> list[Image.Image]:
    target_ratio = target_w / target_h
    w, h = img.size
    crop_w = int(h * target_ratio)
    max_crop_w = (w - (panel_count - 1) * gap_src) // panel_count

    if crop_w > max_crop_w:
        h = int(max_crop_w / target_ratio)
        top = (img.height - h) // 2
        img = img.crop((0, top, w, top + h))
        crop_w = int(h * target_ratio)
        print(f"  Trimmed height to {h}px to avoid black bars")

    total_content = panel_count * crop_w + (panel_count - 1) * gap_src
    start = (w - total_content) // 2

    panels: list[Image.Image] = []
    for index in range(panel_count):
        left = start + index * (crop_w + gap_src)
        panel = img.crop((left, 0, left + crop_w, h))
        panel = panel.resize((target_w, target_h), Image.LANCZOS)
        panels.append(panel)
    return panels


def fit_font(draw: ImageDraw.ImageDraw, text: str, font_path: str | None, initial_size: int, max_width: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    size = max(initial_size, 1)
    while size > 1:
        font = load_font(font_path, size)
        bbox = draw.textbbox((0, 0), text, font=font, anchor="lt")
        width = bbox[2] - bbox[0]
        if width <= max_width:
            return font
        size -= 2
    return load_font(font_path, 1)


def overlay_text(panel: Image.Image, panel_config: PanelConfig, config: Config, target_w: int, target_h: int) -> Image.Image:
    result = panel.copy()
    draw = ImageDraw.Draw(result)

    center_x = target_w // 2
    big_y = int(target_h * config.text_top_frac)
    max_text_width = int(target_w * (1 - 2 * config.text_side_margin_frac))

    big_size = round(target_h * config.big_size_scale)
    small_size = round(target_h * config.small_size_scale)
    font_big = fit_font(draw, panel_config.big, config.font_big, big_size, max_text_width)
    font_small = fit_font(draw, panel_config.small, config.font_small, small_size, max_text_width)

    big_bbox = draw.textbbox((0, 0), panel_config.big, font=font_big, anchor="lt")
    big_h = big_bbox[3] - big_bbox[1]
    small_y = big_y + big_h + config.text_gap

    draw.text((center_x + SHADOW_OFFSET, big_y + SHADOW_OFFSET), panel_config.big,
              font=font_big, fill=SHADOW_COLOR, anchor="mt")
    draw.text((center_x, big_y), panel_config.big,
              font=font_big, fill=TEXT_COLOR, anchor="mt")

    draw.text((center_x + SHADOW_OFFSET, small_y + SHADOW_OFFSET), panel_config.small,
              font=font_small, fill=SHADOW_COLOR, anchor="mt")
    draw.text((center_x, small_y), panel_config.small,
              font=font_small, fill=TEXT_COLOR, anchor="mt")
    return result


def main() -> None:
    args = parse_args()
    version_dir = Path(args.version_dir)
    input_path = Path(args.input) if args.input else version_dir / "enhanced" / "panoramic.png"
    config_path = Path(args.config) if args.config else version_dir / "config.md"
    output_dir = Path(args.output_dir) if args.output_dir else version_dir / "final"
    if not input_path.exists():
        print(f"Error: panoramic image not found: {input_path}")
        sys.exit(1)

    target_w, target_h = DISPLAY_SIZES[args.display]
    config, panels = parse_config(config_path)
    if config.style != "centered-spread":
        print(f"Error: config style must be 'centered-spread' for this script, found '{config.style}'")
        sys.exit(1)

    output_dir.mkdir(parents=True, exist_ok=True)
    print(f"Loading {input_path} ...")
    img = Image.open(input_path)
    print(f"  Source: {img.size[0]}×{img.size[1]}")
    print(f"  Style: {config.style}")
    print(f"  Panels: {len(panels)}")
    print(f"  Gap compensation: {config.gap_src}px (source space)")
    print(f"  Output dir: {output_dir}")

    sliced_panels = slice_panoramic(img, len(panels), target_w, target_h, config.gap_src)

    for panel_image, panel_config in zip(sliced_panels, panels):
        final_panel = overlay_text(panel_image, panel_config, config, target_w, target_h)
        output_path = output_dir / f"{panel_config.panel:02d}.png"
        final_panel.save(output_path, "PNG")
        print(f"  Saved final screenshot: {output_path}")
    print("Done!")


if __name__ == "__main__":
    main()
