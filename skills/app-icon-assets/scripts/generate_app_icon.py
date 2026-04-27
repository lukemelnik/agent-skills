#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter


MAC_ICON_SPECS = [
    ("16x16", "1x", 16),
    ("16x16", "2x", 32),
    ("32x32", "1x", 32),
    ("32x32", "2x", 64),
    ("128x128", "1x", 128),
    ("128x128", "2x", 256),
    ("256x256", "1x", 256),
    ("256x256", "2x", 512),
    ("512x512", "1x", 512),
    ("512x512", "2x", 1024),
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate a macOS AppIcon.appiconset from a raster image."
    )
    parser.add_argument("--source", required=True, type=Path, help="Source PNG/JPEG/WebP image.")
    parser.add_argument(
        "--output",
        required=True,
        type=Path,
        help="Target AppIcon.appiconset directory.",
    )
    parser.add_argument(
        "--prefix",
        default="app-icon",
        help="Filename prefix for emitted PNG files.",
    )
    parser.add_argument(
        "--source-size",
        default=1024,
        type=int,
        help="Master icon canvas size. Keep 1024 for Apple app icons.",
    )
    parser.add_argument(
        "--artwork-scale",
        default=0.88,
        type=float,
        help="Scale of cleaned artwork inside the source-size canvas.",
    )
    parser.add_argument(
        "--brightness-threshold",
        default=145,
        type=float,
        help="Minimum brightness for edge-connected background candidates.",
    )
    parser.add_argument(
        "--contrast-threshold",
        default=58,
        type=float,
        help="Maximum RGB channel spread for edge-connected background candidates.",
    )
    parser.add_argument(
        "--edge-blur",
        default=1.2,
        type=float,
        help="Alpha blur radius for softened cutout edges.",
    )
    return parser.parse_args()


def connected_to_edges(candidate: np.ndarray) -> np.ndarray:
    try:
        from scipy import ndimage

        seeds = np.zeros(candidate.shape, dtype=bool)
        seeds[0, :] = candidate[0, :]
        seeds[-1, :] = candidate[-1, :]
        seeds[:, 0] = candidate[:, 0]
        seeds[:, -1] = candidate[:, -1]
        return ndimage.binary_propagation(seeds, mask=candidate)
    except Exception:
        return flood_fill_edges(candidate)


def flood_fill_edges(candidate: np.ndarray) -> np.ndarray:
    height, width = candidate.shape
    visited = np.zeros(candidate.shape, dtype=bool)
    queue: deque[tuple[int, int]] = deque()

    for x in range(width):
        if candidate[0, x]:
            queue.append((0, x))
        if candidate[height - 1, x]:
            queue.append((height - 1, x))
    for y in range(height):
        if candidate[y, 0]:
            queue.append((y, 0))
        if candidate[y, width - 1]:
            queue.append((y, width - 1))

    while queue:
        y, x = queue.popleft()
        if visited[y, x] or not candidate[y, x]:
            continue
        visited[y, x] = True
        if y > 0:
            queue.append((y - 1, x))
        if y + 1 < height:
            queue.append((y + 1, x))
        if x > 0:
            queue.append((y, x - 1))
        if x + 1 < width:
            queue.append((y, x + 1))

    return visited


def remove_edge_background(
    image: Image.Image,
    brightness_threshold: float,
    contrast_threshold: float,
    edge_blur: float,
) -> Image.Image:
    rgb = image.convert("RGB")
    pixels = np.asarray(rgb)
    red = pixels[:, :, 0].astype(np.int16)
    green = pixels[:, :, 1].astype(np.int16)
    blue = pixels[:, :, 2].astype(np.int16)

    brightness = (red + green + blue) / 3
    contrast = np.maximum.reduce([red, green, blue]) - np.minimum.reduce([red, green, blue])
    cool_or_neutral = (blue >= red - 18) & (green >= red - 30)
    candidate_background = (
        (brightness > brightness_threshold)
        & (contrast < contrast_threshold)
        & cool_or_neutral
    )

    edge_background = connected_to_edges(candidate_background)
    alpha = np.where(edge_background, 0, 255).astype(np.uint8)
    alpha_image = Image.fromarray(alpha, mode="L")
    if edge_blur > 0:
        alpha_image = alpha_image.filter(ImageFilter.GaussianBlur(edge_blur))

    rgba = rgb.convert("RGBA")
    rgba.putalpha(alpha_image)
    return rgba


def crop_to_artwork(image: Image.Image) -> Image.Image:
    alpha = np.asarray(image.getchannel("A"))
    ys, xs = np.where(alpha > 16)
    if xs.size == 0 or ys.size == 0:
        raise RuntimeError("Could not find foreground artwork after background removal.")

    left, right = int(xs.min()), int(xs.max()) + 1
    top, bottom = int(ys.min()), int(ys.max()) + 1
    side = max(right - left, bottom - top)
    center_x = (left + right) / 2
    center_y = (top + bottom) / 2
    crop_left = round(center_x - side / 2)
    crop_top = round(center_y - side / 2)

    square = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    square.alpha_composite(image, dest=(-crop_left, -crop_top))
    return square


def inset_on_canvas(image: Image.Image, source_size: int, artwork_scale: float) -> Image.Image:
    if not 0 < artwork_scale <= 1:
        raise ValueError("--artwork-scale must be greater than 0 and less than or equal to 1.")

    artwork_size = round(source_size * artwork_scale)
    resized = image.resize((artwork_size, artwork_size), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (source_size, source_size), (0, 0, 0, 0))
    offset = ((source_size - artwork_size) // 2, (source_size - artwork_size) // 2)
    canvas.alpha_composite(resized, dest=offset)
    return canvas


def write_contents_json(output: Path, prefix: str) -> None:
    images = []
    for point_size, scale, pixels in MAC_ICON_SPECS:
        images.append(
            {
                "filename": f"{prefix}-{pixels}.png",
                "idiom": "mac",
                "scale": scale,
                "size": point_size,
            }
        )

    contents = {
        "images": images,
        "info": {
            "author": "xcode",
            "version": 1,
        },
    }
    (output / "Contents.json").write_text(json.dumps(contents, indent=2) + "\n")


def main() -> None:
    args = parse_args()
    if not args.source.exists():
        raise FileNotFoundError(f"Missing source image: {args.source}")

    args.output.mkdir(parents=True, exist_ok=True)
    source = Image.open(args.source)
    cleaned = remove_edge_background(
        source,
        brightness_threshold=args.brightness_threshold,
        contrast_threshold=args.contrast_threshold,
        edge_blur=args.edge_blur,
    )
    master = inset_on_canvas(crop_to_artwork(cleaned), args.source_size, args.artwork_scale)

    for _, _, pixels in MAC_ICON_SPECS:
        master.resize((pixels, pixels), Image.Resampling.LANCZOS).save(
            args.output / f"{args.prefix}-{pixels}.png"
        )
    write_contents_json(args.output, args.prefix)


if __name__ == "__main__":
    main()
