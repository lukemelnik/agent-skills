#!/usr/bin/env python3
"""
App Store Screenshot Composer

Composites headline text, device frame, and simulator screenshot
into a pixel-perfect App Store Connect image.

Inspired by adamlyttleapps/claude-skill-aso-appstore-screenshots (MIT).

Requirements: pip install Pillow
"""

import argparse
import os
from PIL import Image, ImageDraw, ImageFont

# ── Canvas defaults ─────────────────────────────────────────────────
DEFAULT_W = 1290
DEFAULT_H = 2796

# ── Device frame constants ──────────────────────────────────────────
DEVICE_W = 1030
BEZEL = 15
SCREEN_W = DEVICE_W - 2 * BEZEL  # 1000
SCREEN_CORNER_R = 62

# ── Layout ──────────────────────────────────────────────────────────
DEVICE_Y = 720
TEXT_TOP = 200

# ── Typography ──────────────────────────────────────────────────────
VERB_SIZE_MAX = 256
VERB_SIZE_MIN = 150
DESC_SIZE = 124
VERB_DESC_GAP = 20
DESC_LINE_GAP = 24
MAX_TEXT_W = 0.92  # fraction of canvas width
MAX_VERB_W = 0.92

# Font search paths (first match wins)
FONT_PATHS = [
    "/Library/Fonts/SF-Pro-Display-Black.otf",
    "/Library/Fonts/SF-Pro-Display-Bold.otf",
    "/System/Library/Fonts/Helvetica.ttc",
]

FRAME_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "assets", "device_frame.png")


def find_font():
    for p in FONT_PATHS:
        if os.path.exists(p):
            return p
    raise FileNotFoundError(
        "No suitable font found. Install SF Pro Display from https://developer.apple.com/fonts/\n"
        f"Searched: {FONT_PATHS}"
    )


def hex_to_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4))


def word_wrap(draw, text, font, max_w):
    words = text.split()
    lines, cur = [], ""
    for w in words:
        test = f"{cur} {w}".strip()
        if draw.textlength(test, font=font) <= max_w:
            cur = test
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def fit_font(font_path, text, max_w, size_max, size_min):
    """Return the largest font size where text fits within max_w."""
    dummy = ImageDraw.Draw(Image.new("RGBA", (1, 1)))
    for size in range(size_max, size_min - 1, -4):
        font = ImageFont.truetype(font_path, size)
        bbox = dummy.textbbox((0, 0), text, font=font)
        if (bbox[2] - bbox[0]) <= max_w:
            return font
    return ImageFont.truetype(font_path, size_min)


def draw_centered(draw, y, text, font, canvas_w, max_w=None):
    lines = word_wrap(draw, text, font, max_w) if max_w else [text]
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=font)
        h = bbox[3] - bbox[1]
        draw.text((canvas_w // 2, y - bbox[1]), line, fill="white", font=font, anchor="mt")
        y += h + DESC_LINE_GAP
    return y


def compose(bg_hex, verb, desc, screenshot_path, output_path, canvas_w=DEFAULT_W, canvas_h=DEFAULT_H):
    bg = hex_to_rgb(bg_hex)
    font_path = find_font()

    max_text_w = int(canvas_w * MAX_TEXT_W)
    max_verb_w = int(canvas_w * MAX_VERB_W)

    # Canvas
    canvas = Image.new("RGBA", (canvas_w, canvas_h), (*bg, 255))
    draw = ImageDraw.Draw(canvas)

    # Text
    verb_font = fit_font(font_path, verb.upper(), max_verb_w, VERB_SIZE_MAX, VERB_SIZE_MIN)
    desc_font = ImageFont.truetype(font_path, DESC_SIZE)

    y = TEXT_TOP
    y = draw_centered(draw, y, verb.upper(), verb_font, canvas_w)
    y += VERB_DESC_GAP
    draw_centered(draw, y, desc.upper(), desc_font, canvas_w, max_w=max_text_w)

    # Device positioning
    device_x = (canvas_w - DEVICE_W) // 2
    screen_x = device_x + BEZEL
    screen_y = DEVICE_Y + BEZEL

    # Screenshot into screen area
    shot = Image.open(screenshot_path).convert("RGBA")
    scale = SCREEN_W / shot.width
    sc_w = SCREEN_W
    sc_h = int(shot.height * scale)
    shot = shot.resize((sc_w, sc_h), Image.LANCZOS)

    screen_h = canvas_h - screen_y + 500

    # Screen mask
    scr_mask = Image.new("L", canvas.size, 0)
    ImageDraw.Draw(scr_mask).rounded_rectangle(
        [screen_x, screen_y, screen_x + SCREEN_W, screen_y + screen_h],
        radius=SCREEN_CORNER_R,
        fill=255,
    )

    # Black screen bg + screenshot
    scr_layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    ImageDraw.Draw(scr_layer).rounded_rectangle(
        [screen_x, screen_y, screen_x + SCREEN_W, screen_y + screen_h],
        radius=SCREEN_CORNER_R,
        fill=(0, 0, 0, 255),
    )
    scr_layer.paste(shot, (screen_x, screen_y))
    scr_layer.putalpha(scr_mask)
    canvas = Image.alpha_composite(canvas, scr_layer)

    # Device frame overlay
    if os.path.exists(FRAME_PATH):
        frame = Image.open(FRAME_PATH).convert("RGBA")
        frame_layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
        frame_layer.paste(frame, (device_x, DEVICE_Y))
        canvas = Image.alpha_composite(canvas, frame_layer)
    else:
        print(f"⚠ Device frame not found at {FRAME_PATH} — generating without frame")

    # Save
    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    canvas.convert("RGB").save(output_path, "PNG")
    print(f"✓ {output_path} ({canvas_w}×{canvas_h})")


def main():
    p = argparse.ArgumentParser(description="Compose App Store screenshot scaffold")
    p.add_argument("--bg", required=True, help="Background hex color (#2563EB)")
    p.add_argument("--verb", required=True, help="Action verb (TRACK)")
    p.add_argument("--desc", required=True, help="Benefit descriptor (CARD PRICES)")
    p.add_argument("--screenshot", required=True, help="Simulator screenshot path")
    p.add_argument("--output", required=True, help="Output file path")
    p.add_argument("--width", type=int, default=DEFAULT_W, help=f"Canvas width (default: {DEFAULT_W})")
    p.add_argument("--height", type=int, default=DEFAULT_H, help=f"Canvas height (default: {DEFAULT_H})")
    args = p.parse_args()
    compose(args.bg, args.verb, args.desc, args.screenshot, args.output, args.width, args.height)


if __name__ == "__main__":
    main()
