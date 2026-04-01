#!/usr/bin/env python3
"""
Slice a panoramic image into equal App Store screenshot panels.

Usage:
  python3 slice_panoramic.py --input panoramic.png --output-dir ./final --panels 3
  python3 slice_panoramic.py --input panoramic.png --output-dir ./final --panels 3 --display 6.9
"""

import argparse
import os
from PIL import Image

DISPLAY_SIZES = {
    "6.5": (1242, 2688),
    "6.7": (1290, 2796),
    "6.9": (1320, 2868),
}


def slice_panoramic(input_path, output_dir, panels=3, display="6.7"):
    target_w, target_h = DISPLAY_SIZES[display]
    target_ratio = target_w / target_h

    img = Image.open(input_path)
    w, h = img.size
    print(f"Source: {w}×{h} → {panels} panels at {target_w}×{target_h} (iPhone {display}\")")

    panel_w = w // panels
    crop_w = int(h * target_ratio)
    offset = (panel_w - crop_w) // 2

    if offset < 0:
        print(f"⚠ Panel width ({panel_w}) too narrow for target ratio. Cropping height instead.")
        crop_h = int(panel_w / target_ratio)
        y_offset = (h - crop_h) // 2
        offset = 0
        h = crop_h
    else:
        y_offset = 0

    os.makedirs(output_dir, exist_ok=True)

    for i in range(panels):
        left = i * panel_w + offset
        panel = img.crop((left, y_offset, left + crop_w, y_offset + h))
        panel = panel.resize((target_w, target_h), Image.LANCZOS)
        path = os.path.join(output_dir, f"{i + 1:02d}.png")
        panel.save(path, "PNG")
        print(f"✓ {path} ({target_w}×{target_h})")


def main():
    p = argparse.ArgumentParser(description="Slice panoramic into App Store screenshots")
    p.add_argument("--input", required=True, help="Panoramic image path")
    p.add_argument("--output-dir", required=True, help="Output directory for panels")
    p.add_argument("--panels", type=int, default=3, help="Number of panels (default: 3)")
    p.add_argument("--display", default="6.7", choices=DISPLAY_SIZES.keys(),
                   help="iPhone display size (default: 6.7)")
    args = p.parse_args()
    slice_panoramic(args.input, args.output_dir, args.panels, args.display)


if __name__ == "__main__":
    main()
