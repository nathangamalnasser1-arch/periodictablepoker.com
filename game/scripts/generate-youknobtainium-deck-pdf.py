"""Generate a duplex-ready youknObtainium deck PDF (element/action fronts + space backs)."""
from __future__ import annotations

import argparse
import json
import math
import sys
from io import BytesIO
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

from deck_pdf_qr import render_yko_qr_card

ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = ROOT.parent
CARDS_JSON = ROOT / "scripts" / "youknobtainium-cards.json"
SPACE_BACK = ROOT / "public" / "card-back-space.png"
SPACE_BACK_WEBP = ROOT / "public" / "card-back-space.webp"
DEFAULT_OUTPUT = REPO_ROOT / "youknObtainium Deck.pdf"
QR_CARD = {"kind": "qr"}

MM = 72.0 / 25.4
CARD_W_MM = 63.5
CARD_H_MM = 88.9
CARD_ASPECT = CARD_W_MM / CARD_H_MM

COLS = 3
ROWS = 5
CARDS_PER_PAGE = COLS * ROWS

GAP_MM = 2.5
MARGIN_MM = 6.0
FOOTER_PT = 14
RENDER_DPI = 300

PAPER_SIZES = {
    "letter": (612.0, 792.0),
    "a4": (595.27, 841.89),
}

BG_CARD = (36, 40, 59)
TEXT = (192, 202, 245)
TEXT_MUTED = (86, 95, 137)
ACCENT = (122, 162, 247)
FAMILY_COLORS = [
    (122, 162, 247),
    (158, 206, 106),
    (224, 175, 104),
    (187, 154, 247),
]
FAMILY_ICONS = ["●", "▲", "■", "◆"]

SPECIAL_GRADIENTS = {
    "fission": ((247, 118, 142), (196, 92, 110)),
    "fusion": ((125, 207, 255), (90, 159, 212)),
    "temperature": ((224, 175, 104), (184, 146, 80)),
    "eventHorizon": ((42, 195, 222), (30, 155, 181)),
}


def load_cards(path: Path) -> dict:
    data = json.loads(path.read_text(encoding="utf-8"))
    deck = data.get("deck") or (
        data["elements"] + data["actionCards"] + data["rulesCards"]
    )
    if not deck:
        raise ValueError(f"no cards found in {path}")
    return {**data, "deck": deck}


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = []
    if sys.platform == "win32":
        candidates.extend([
            Path(r"C:\Windows\Fonts\arialbd.ttf") if bold else Path(r"C:\Windows\Fonts\arial.ttf"),
            Path(r"C:\Windows\Fonts\segoeuib.ttf") if bold else Path(r"C:\Windows\Fonts\segoeui.ttf"),
        ])
    candidates.extend([
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf") if bold else Path(
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
        ),
        Path("/System/Library/Fonts/Supplemental/Arial Bold.ttf") if bold else Path(
            "/System/Library/Fonts/Supplemental/Arial.ttf"
        ),
    ])
    for path in candidates:
        if path.exists():
            return ImageFont.truetype(str(path), size)
    return ImageFont.load_default()


def compute_layout(paper_w: float, paper_h: float) -> dict:
    gap = GAP_MM * MM
    margin = MARGIN_MM * MM
    usable_w = paper_w - 2 * margin
    usable_h = paper_h - 2 * margin - FOOTER_PT

    max_cw = (usable_w - (COLS - 1) * gap) / COLS
    max_ch = (usable_h - (ROWS - 1) * gap) / ROWS

    ch_from_w = max_cw / CARD_ASPECT
    cw_from_h = max_ch * CARD_ASPECT
    if ch_from_w <= max_ch:
        card_w, card_h = max_cw, ch_from_w
    else:
        card_w, card_h = cw_from_h, max_ch

    grid_w = COLS * card_w + (COLS - 1) * gap
    grid_h = ROWS * card_h + (ROWS - 1) * gap
    origin_x = margin + (usable_w - grid_w) / 2
    origin_y = paper_h - margin - grid_h

    return {
        "card_w": card_w,
        "card_h": card_h,
        "gap": gap,
        "origin_x": origin_x,
        "origin_y": origin_y,
        "grid_w": grid_w,
        "grid_h": grid_h,
        "paper_w": paper_w,
        "paper_h": paper_h,
    }


def card_slot_xy(layout: dict, row: int, col: int) -> tuple[float, float]:
    x = layout["origin_x"] + col * (layout["card_w"] + layout["gap"])
    y = layout["origin_y"] + (ROWS - 1 - row) * (layout["card_h"] + layout["gap"])
    return x, y


def pt_to_px(pt: float, dpi: int = RENDER_DPI) -> int:
    return max(1, int(round(pt / 72.0 * dpi)))


def rounded_rect(draw: ImageDraw.ImageDraw, box: tuple, radius: int, fill, outline=None, width: int = 1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def vertical_gradient(size: tuple[int, int], top: tuple[int, int, int], bottom: tuple[int, int, int]) -> Image.Image:
    w, h = size
    img = Image.new("RGB", (w, h))
    draw = ImageDraw.Draw(img)
    for y in range(h):
        t = y / max(h - 1, 1)
        color = tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3))
        draw.line((0, y, w, y), fill=color)
    return img


def wrap_text(text: str, font: ImageFont.ImageFont, max_width: int) -> list[str]:
    words = text.replace("\n\n", "\n").split()
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        bbox = font.getbbox(candidate)
        if bbox[2] - bbox[0] <= max_width or not current:
            current = candidate
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)

    merged: list[str] = []
    for chunk in "\n".join(lines).split("\n"):
        chunk = chunk.strip()
        if not chunk:
            merged.append("")
            continue
        words = chunk.split()
        current = ""
        for word in words:
            candidate = f"{current} {word}".strip()
            bbox = font.getbbox(candidate)
            if bbox[2] - bbox[0] <= max_width or not current:
                current = candidate
            else:
                merged.append(current)
                current = word
        if current:
            merged.append(current)
    return merged


def draw_card_frame(w_px: int, h_px: int, *, outline=ACCENT, width: int | None = None) -> Image.Image:
    img = Image.new("RGB", (w_px, h_px), BG_CARD)
    draw = ImageDraw.Draw(img)
    border = width if width is not None else max(2, pt_to_px(1.5))
    radius = max(6, pt_to_px(6))
    rounded_rect(
        draw,
        (border // 2, border // 2, w_px - border // 2 - 1, h_px - border // 2 - 1),
        radius,
        fill=BG_CARD,
        outline=outline,
        width=border,
    )
    return img


def render_element(card: dict, data: dict, layout: dict) -> Image.Image:
    w_px = pt_to_px(layout["card_w"])
    h_px = pt_to_px(layout["card_h"])
    img = draw_card_frame(w_px, h_px, outline=(60, 66, 92), width=max(1, pt_to_px(1)))
    draw = ImageDraw.Draw(img)

    family = card["family"]
    family_color = FAMILY_COLORS[family]
    family_name = data["familyNames"][family]
    melt_k = data["meltingK"].get(card["sym"])
    melt_str = f"{melt_k} K" if melt_k is not None else "—"

    pad = int(w_px * 0.08)
    sym_font = load_font(max(16, int(h_px * 0.22)), bold=True)
    name_font = load_font(max(8, int(h_px * 0.075)), bold=False)
    family_font = load_font(max(7, int(h_px * 0.055)), bold=False)
    melt_font = load_font(max(7, int(h_px * 0.06)), bold=True)

    draw.text((pad, pad), card["sym"], fill=family_color, font=sym_font)

    name = card["name"]
    name_bbox = draw.textbbox((pad, pad + h_px * 0.22), name, font=name_font)
    if name_bbox[2] - name_bbox[0] > w_px - pad * 2:
        while len(name) > 3 and draw.textbbox((0, 0), name + "…", font=name_font)[2] > w_px - pad * 2:
            name = name[:-1]
        name += "…"
    draw.text((pad, pad + h_px * 0.22), name, fill=TEXT_MUTED, font=name_font)

    fam_lines = wrap_text(family_name, family_font, w_px - pad * 2)
    y = pad + h_px * 0.34
    for line in fam_lines[:2]:
        draw.text((pad, y), line, fill=TEXT_MUTED, font=family_font)
        y += int(h_px * 0.07)

    melt_bbox = draw.textbbox((0, 0), melt_str, font=melt_font)
    melt_w = melt_bbox[2] - melt_bbox[0]
    melt_h = melt_bbox[3] - melt_bbox[1]
    draw.text((w_px - pad - melt_w, h_px - pad - melt_h), melt_str, fill=ACCENT, font=melt_font)

    icon = FAMILY_ICONS[family]
    icon_font = load_font(max(10, int(h_px * 0.08)), bold=False)
    icon_bbox = draw.textbbox((0, 0), icon, font=icon_font)
    draw.text(
        ((w_px - icon_bbox[2] + icon_bbox[0]) / 2, h_px * 0.78),
        icon,
        fill=family_color,
        font=icon_font,
    )
    return img


def render_action(card: dict, layout: dict, space_art: Image.Image | None = None) -> Image.Image:
    w_px = pt_to_px(layout["card_w"])
    h_px = pt_to_px(layout["card_h"])
    card_type = card["type"]
    top, bottom = SPECIAL_GRADIENTS.get(card_type, (BG_CARD, BG_CARD))

    if card_type == "eventHorizon" and space_art is not None:
        img = cover_crop(space_art, w_px, h_px)
        overlay = Image.new("RGBA", (w_px, h_px), (0, 0, 0, 90))
        img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
    else:
        img = vertical_gradient((w_px, h_px), top, bottom)

    draw = ImageDraw.Draw(img)
    border = max(2, pt_to_px(1.5))
    radius = max(6, pt_to_px(6))
    rounded_rect(
        draw,
        (border // 2, border // 2, w_px - border // 2 - 1, h_px - border // 2 - 1),
        radius,
        fill=None,
        outline=ACCENT,
        width=border,
    )

    label = card["label"]
    label_font = load_font(max(12, int(h_px * 0.12)), bold=True)
    bbox = draw.textbbox((0, 0), label, font=label_font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    text_color = (255, 255, 255) if card_type == "eventHorizon" else ACCENT
    if card_type != "eventHorizon":
        text_color = TEXT
    draw.text(
        ((w_px - text_w) / 2, (h_px - text_h) / 2 - h_px * 0.05),
        label,
        fill=text_color,
        font=label_font,
    )

    icons = {"fission": "⚛", "fusion": "☢", "temperature": "🌡", "eventHorizon": "◉"}
    icon = icons.get(card_type, "")
    if icon:
        icon_font = load_font(max(10, int(h_px * 0.1)), bold=False)
        ib = draw.textbbox((0, 0), icon, font=icon_font)
        draw.text(
            ((w_px - ib[2] + ib[0]) / 2, h_px * 0.62),
            icon,
            fill=(255, 255, 255),
            font=icon_font,
        )
    return img


def render_rules(card: dict, layout: dict) -> Image.Image:
    w_px = pt_to_px(layout["card_w"])
    h_px = pt_to_px(layout["card_h"])
    img = draw_card_frame(w_px, h_px)
    draw = ImageDraw.Draw(img)

    pad = int(w_px * 0.07)
    title_font = load_font(max(9, int(h_px * 0.075)), bold=True)
    body_font = load_font(max(6, int(h_px * 0.048)), bold=False)

    draw.text((pad, pad), card["title"], fill=ACCENT, font=title_font)
    lines = wrap_text(card["text"], body_font, w_px - pad * 2)
    y = pad + int(h_px * 0.11)
    line_h = max(8, int(h_px * 0.052))
    for line in lines:
        if y + line_h > h_px - pad:
            break
        if line:
            draw.text((pad, y), line, fill=TEXT, font=body_font)
        y += line_h
    return img


def render_front(card: dict | None, data: dict, layout: dict, space_art: Image.Image | None) -> Image.Image | None:
    if card is None:
        return None
    kind = card.get("kind")
    if kind == "qr":
        return render_yko_qr_card(layout, load_font, pt_to_px, rounded_rect)
    if kind == "element":
        return render_element(card, data, layout)
    if kind == "action":
        return render_action(card, layout, space_art)
    if kind == "rules":
        return render_rules(card, layout)
    return None


def cover_crop(source: Image.Image, target_w: int, target_h: int) -> Image.Image:
    src_w, src_h = source.size
    scale = max(target_w / src_w, target_h / src_h)
    resized = source.resize((int(src_w * scale), int(src_h * scale)), Image.Resampling.LANCZOS)
    rw, rh = resized.size
    left = (rw - target_w) // 2
    top = (rh - target_h) // 2
    return resized.crop((left, top, left + target_w, top + target_h))


def render_back(layout: dict, space: Image.Image) -> Image.Image:
    w_px = pt_to_px(layout["card_w"])
    h_px = pt_to_px(layout["card_h"])
    img = cover_crop(space.convert("RGB"), w_px, h_px)
    draw = ImageDraw.Draw(img)
    border = max(2, pt_to_px(1.5))
    radius = max(6, pt_to_px(6))
    rounded_rect(
        draw,
        (border // 2, border // 2, w_px - border // 2 - 1, h_px - border // 2 - 1),
        radius,
        fill=None,
        outline=(30, 35, 55),
        width=border,
    )
    return img


def pil_to_reader(img: Image.Image) -> ImageReader:
    buf = BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return ImageReader(buf)


def draw_cut_guides(c: canvas.Canvas, layout: dict):
    c.saveState()
    c.setStrokeColorRGB(0.72, 0.72, 0.72)
    c.setDash(2, 4)
    c.setLineWidth(0.4)

    gap = layout["gap"]
    card_w = layout["card_w"]
    card_h = layout["card_h"]
    ox = layout["origin_x"]
    oy = layout["origin_y"]
    grid_w = layout["grid_w"]
    grid_h = layout["grid_h"]

    for col in range(1, COLS):
        x = ox + col * card_w + (col - 0.5) * gap
        c.line(x, oy, x, oy + grid_h)

    for row in range(1, ROWS):
        y = oy + row * card_h + (row - 0.5) * gap
        c.line(ox, y, ox + grid_w, y)

    c.restoreState()


def draw_footer(c: canvas.Canvas, layout: dict):
    c.saveState()
    c.setFillColorRGB(0.45, 0.45, 0.45)
    c.setFont("Helvetica", 8)
    c.drawCentredString(layout["paper_w"] / 2, 8, "youknObtainium")
    c.restoreState()


def draw_sheet(
    c: canvas.Canvas,
    layout: dict,
    slots: list,
    front_images: dict[int, Image.Image],
    back_image: Image.Image,
    *,
    is_back: bool,
):
    for idx, card in enumerate(slots):
        row = idx // COLS
        col = idx % COLS
        draw_col = (COLS - 1 - col) if is_back else col
        x, y = card_slot_xy(layout, row, draw_col)

        if is_back:
            if card is None:
                continue
            img = ImageOps.mirror(back_image)
        else:
            img = front_images.get(idx)
            if img is None:
                continue

        c.drawImage(
            pil_to_reader(img),
            x,
            y,
            width=layout["card_w"],
            height=layout["card_h"],
            preserveAspectRatio=True,
            anchor="sw",
        )

    draw_cut_guides(c, layout)
    draw_footer(c, layout)


def load_space_image() -> Image.Image:
    for path in (SPACE_BACK, SPACE_BACK_WEBP):
        if path.exists():
            return Image.open(path)
    raise FileNotFoundError(f"space back image not found at {SPACE_BACK} or {SPACE_BACK_WEBP}")


def build_pdf(
    output: Path,
    paper: str,
    *,
    cards_path: Path = CARDS_JSON,
    dry_run: bool = False,
    report_json: bool = False,
) -> dict:
    data = load_cards(cards_path)
    deck = data["deck"] + [QR_CARD]
    space = load_space_image()

    paper_w, paper_h = PAPER_SIZES[paper]
    layout = compute_layout(paper_w, paper_h)

    sheet_count = math.ceil(len(deck) / CARDS_PER_PAGE)
    if dry_run:
        sheet_count = 1
    total_slots = sheet_count * CARDS_PER_PAGE
    padded = deck + [None] * (total_slots - len(deck))

    back_master = render_back(layout, space)
    space_rgb = space.convert("RGB")
    front_cache: dict[tuple[int, int], Image.Image] = {}

    for sheet in range(sheet_count):
        chunk = padded[sheet * CARDS_PER_PAGE : (sheet + 1) * CARDS_PER_PAGE]
        for idx, card in enumerate(chunk):
            if card is not None:
                front_cache[(sheet, idx)] = render_front(card, data, layout, space_rgb)

    output.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(output), pagesize=(paper_w, paper_h))
    c.setTitle("youknObtainium — Printable Deck")
    c.setAuthor("youknObtainium")

    for sheet in range(sheet_count):
        chunk = padded[sheet * CARDS_PER_PAGE : (sheet + 1) * CARDS_PER_PAGE]
        sheet_fronts = {
            idx: front_cache[(sheet, idx)]
            for idx in range(len(chunk))
            if (sheet, idx) in front_cache
        }

        c.setPageSize((paper_w, paper_h))
        draw_sheet(c, layout, chunk, sheet_fronts, back_master, is_back=False)
        c.showPage()

        c.setPageSize((paper_w, paper_h))
        draw_sheet(c, layout, chunk, sheet_fronts, back_master, is_back=True)
        c.showPage()

    c.save()

    action_count = sum(1 for c in deck if c.get("kind") == "action")
    rules_count = sum(1 for c in deck if c.get("kind") == "rules")
    element_count = sum(1 for c in deck if c.get("kind") == "element")
    qr_count = sum(1 for c in deck if c.get("kind") == "qr")
    page_count = sheet_count * 2

    report = {
        "pages": page_count,
        "sheets": sheet_count,
        "faces": len(deck),
        "elements": element_count,
        "actionCards": action_count,
        "rulesCards": rules_count,
        "qrCards": qr_count,
        "output": str(output.resolve()),
        "paper": paper,
        "card_width_mm": round(layout["card_w"] / MM, 2),
        "card_height_mm": round(layout["card_h"] / MM, 2),
        "first_symbols": [c["sym"] for c in deck[:3] if c.get("kind") == "element"],
    }

    if report_json:
        print(json.dumps(report))
    else:
        print(f"wrote {output} ({page_count} pages, {len(deck)} card faces incl. QR)")
        print("Print: duplex ON, flip on long edge, scale 100%, minimum margins")
        print(f"Card size on sheet: {report['card_width_mm']} x {report['card_height_mm']} mm")

    return report


def main():
    parser = argparse.ArgumentParser(description="Generate youknObtainium deck PDF")
    parser.add_argument("--paper", choices=("letter", "a4"), default="letter")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--cards", type=Path, default=CARDS_JSON)
    parser.add_argument("--dry-run", action="store_true", help="Generate only the first sheet pair (2 pages)")
    parser.add_argument("--report-json", action="store_true", help="Print JSON summary to stdout")
    args = parser.parse_args()

    build_pdf(
        args.output,
        args.paper,
        cards_path=args.cards,
        dry_run=args.dry_run,
        report_json=args.report_json,
    )


if __name__ == "__main__":
    main()
