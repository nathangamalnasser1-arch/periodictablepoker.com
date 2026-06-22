"""Shared QR code card rendering for printable deck PDFs."""
from __future__ import annotations

from typing import Callable

import qrcode
from PIL import Image, ImageDraw

QR_ERROR = qrcode.constants.ERROR_CORRECT_M


def make_qr_image(url: str, size_px: int) -> Image.Image:
    qr = qrcode.QRCode(
        version=None,
        error_correction=QR_ERROR,
        box_size=10,
        border=1,
    )
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white").convert("RGB")
    return img.resize((size_px, size_px), Image.Resampling.NEAREST)


def render_qr_card(
    layout: dict,
    *,
    url: str,
    title: str,
    label: str,
    load_font: Callable[..., Image.Image],
    pt_to_px: Callable[[float], int],
    rounded_rect: Callable[..., None],
    bg: tuple[int, int, int],
    border: tuple[int, int, int],
    title_color: tuple[int, int, int],
    label_color: tuple[int, int, int],
) -> Image.Image:
    w_px = pt_to_px(layout["card_w"])
    h_px = pt_to_px(layout["card_h"])
    img = Image.new("RGB", (w_px, h_px), bg)
    draw = ImageDraw.Draw(img)

    border_w = max(2, pt_to_px(1.5))
    radius = max(6, pt_to_px(6))
    rounded_rect(
        draw,
        (border_w // 2, border_w // 2, w_px - border_w // 2 - 1, h_px - border_w // 2 - 1),
        radius,
        fill=bg,
        outline=border,
        width=border_w,
    )

    pad = int(w_px * 0.08)
    title_font = load_font(max(9, int(h_px * 0.075)), bold=True)
    label_font = load_font(max(6, int(h_px * 0.048)), bold=False)

    title_bbox = draw.textbbox((0, 0), title, font=title_font)
    title_w = title_bbox[2] - title_bbox[0]
    draw.text(((w_px - title_w) / 2, pad), title, fill=title_color, font=title_font)

    qr_size = int(min(w_px, h_px) * 0.52)
    qr = make_qr_image(url, qr_size)
    qr_x = (w_px - qr_size) // 2
    qr_y = int(h_px * 0.22)
    img.paste(qr, (qr_x, qr_y))

    label_bbox = draw.textbbox((0, 0), label, font=label_font)
    label_w = label_bbox[2] - label_bbox[0]
    draw.text(
        ((w_px - label_w) / 2, h_px - pad - (label_bbox[3] - label_bbox[1])),
        label,
        fill=label_color,
        font=label_font,
    )
    return img


def render_ptp_qr_card(layout: dict, load_font, pt_to_px, rounded_rect) -> Image.Image:
    return render_qr_card(
        layout,
        url="https://periodictablepoker.com",
        title="Periodic Table Poker",
        label="periodictablepoker.com",
        load_font=load_font,
        pt_to_px=pt_to_px,
        rounded_rect=rounded_rect,
        bg=(244, 234, 213),
        border=(139, 105, 20),
        title_color=(44, 24, 16),
        label_color=(74, 44, 26),
    )


def render_yko_qr_card(layout: dict, load_font, pt_to_px, rounded_rect) -> Image.Image:
    return render_qr_card(
        layout,
        url="https://youknobtainium.web.app",
        title="youknObtainium",
        label="youknobtainium.web.app",
        load_font=load_font,
        pt_to_px=pt_to_px,
        rounded_rect=rounded_rect,
        bg=(36, 40, 59),
        border=(122, 162, 247),
        title_color=(122, 162, 247),
        label_color=(86, 95, 137),
    )
