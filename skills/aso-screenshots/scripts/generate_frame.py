#!/usr/bin/env python3
"""
Generate iPhone device frame template (transparent PNG).
Creates a simple rounded rectangle bezel with dynamic island cutout.

Run once to create assets/device_frame.png.
"""

import os
from PIL import Image, ImageDraw

# Match compose.py constants
DEVICE_W = 1030
DEVICE_H = 2240  # tall enough to bleed off canvas
BEZEL = 15
CORNER_R = 75
SCREEN_CORNER_R = 62

# Dynamic island
DI_W = 200
DI_H = 50
DI_Y = 25
DI_R = 25


def generate():
    img = Image.new("RGBA", (DEVICE_W, DEVICE_H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Outer bezel (dark grey)
    draw.rounded_rectangle(
        [0, 0, DEVICE_W - 1, DEVICE_H - 1],
        radius=CORNER_R,
        fill=(30, 30, 30, 255),
    )

    # Inner screen cutout (transparent)
    screen_x = BEZEL
    screen_y = BEZEL
    screen_w = DEVICE_W - 2 * BEZEL
    screen_h = DEVICE_H - 2 * BEZEL

    # Create screen mask
    mask = Image.new("L", img.size, 255)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle(
        [screen_x, screen_y, screen_x + screen_w, screen_y + screen_h],
        radius=SCREEN_CORNER_R,
        fill=0,
    )

    # Re-add dynamic island
    di_x = (DEVICE_W - DI_W) // 2
    mask_draw.rounded_rectangle(
        [di_x, screen_y + DI_Y, di_x + DI_W, screen_y + DI_Y + DI_H],
        radius=DI_R,
        fill=255,
    )

    # Apply mask — screen area becomes transparent, bezel stays
    r, g, b, a = img.split()
    a = Image.composite(a, Image.new("L", img.size, 0), mask)
    img = Image.merge("RGBA", (r, g, b, a))

    # Draw dynamic island on top
    draw2 = ImageDraw.Draw(img)
    di_x = (DEVICE_W - DI_W) // 2
    draw2.rounded_rectangle(
        [di_x, screen_y + DI_Y, di_x + DI_W, screen_y + DI_Y + DI_H],
        radius=DI_R,
        fill=(15, 15, 15, 255),
    )

    out = os.path.join(os.path.dirname(os.path.dirname(__file__)), "assets", "device_frame.png")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    img.save(out, "PNG")
    print(f"✓ {out} ({DEVICE_W}×{DEVICE_H})")


if __name__ == "__main__":
    generate()
