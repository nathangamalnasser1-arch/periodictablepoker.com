"""Generate a duplex-ready Periodic Table Poker deck PDF (element fronts + dog backs)."""
from __future__ import annotations

import argparse
import json
import math
import re
import sys
from io import BytesIO
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

from deck_pdf_qr import render_ptp_qr_card

ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = ROOT.parent
ELEMENTS_JS = ROOT / "src" / "data" / "elements.js"
DOGS_SRC = ROOT / "public" / "club-dogs-poker.png"
DEFAULT_OUTPUT = REPO_ROOT / "Periodic Table Poker.pdf"
DEFAULT_LARGE_OUTPUT = REPO_ROOT / "Periodic Table Poker (Large Cards).pdf"

MM = 72.0 / 25.4
CARD_W_MM = 63.5
CARD_H_MM = 88.9
CARD_ASPECT = CARD_W_MM / CARD_H_MM

LAYOUT_PRESETS = {
    "standard": {"cols": 3, "rows": 5, "label": "3×5 grid"},
    "large": {"cols": 1, "rows": 2, "label": "2 cards per page (half page each)"},
}

PTP_POKER_RULES = [
    "Texas Hold'em: 2 hole cards + 5 community cards.",
    "Deck: 118 element cards (one of each symbol).",
    "Best hand: choose 5 cards from your 7 available.",
    "Showdown: highest total atomic mass (u) wins the pot.",
    "Life-first: H, C, N, O, P (DNA) rank highest — argue with science.",
    "Molecules (H₂O, CO₂, …): one card per element, not subscripts.",
    "Bet, call, raise, or fold; all-in stays in until showdown.",
    "Win all atomcoins; reach 0 chips after a hand and you bust.",
]

RULES_CARD = {"kind": "rules", "title": "House Rules", "rules": PTP_POKER_RULES}
QR_CARD = {"kind": "qr"}

GAP_MM = 2.5
MARGIN_MM = 6.0
FOOTER_PT = 14
RENDER_DPI = 300

PAPER_SIZES = {
    "letter": (612.0, 792.0),
    "a4": (595.27, 841.89),
}

BRASS = (139, 105, 20)
BRASS_LIGHT = (201, 162, 39)
BURGUNDY = (107, 26, 26)
BURGUNDY_DARK = (74, 16, 16)
PARCHMENT = (244, 234, 213)
TEXT_DARK = (44, 24, 16)
TEXT_MUTED = (92, 72, 52)
TEXT_DARK_ELEM = (26, 18, 8)
TEXT_LIGHT = (255, 255, 255)

ELEMENT_PATTERN = re.compile(
    r"\{\s*symbol:\s*'([^']+)',\s*name:\s*'([^']+)',\s*number:\s*(\d+),\s*color:\s*'([^']+)'\s*\}"
)
MASS_PATTERN = re.compile(r"const ATOMIC_MASSES = \[([^\]]+)\]", re.DOTALL)


def load_atomic_masses(text: str) -> list[float]:
    match = MASS_PATTERN.search(text)
    if not match:
        raise ValueError("ATOMIC_MASSES not found in elements.js")
    return [float(value.strip()) for value in match.group(1).split(",") if value.strip()]


def format_mass(mass: float) -> str:
    if float(mass).is_integer():
        return f"{int(mass)} u"
    text = f"{mass:.3f}".rstrip("0").rstrip(".")
    return f"{text} u"


def load_elements(path: Path) -> list[dict]:
    text = path.read_text(encoding="utf-8")
    masses = load_atomic_masses(text)
    elements = [
        {
            "symbol": m.group(1),
            "name": m.group(2),
            "number": int(m.group(3)),
            "color": m.group(4),
        }
        for m in ELEMENT_PATTERN.finditer(text)
    ]
    if len(elements) != 118:
        raise ValueError(f"expected 118 elements, found {len(elements)} in {path}")
    if len(masses) != 118:
        raise ValueError(f"expected 118 atomic masses, found {len(masses)} in {path}")
    for index, element in enumerate(elements):
        element["mass"] = masses[index]
    return elements


def build_deck(elements: list[dict]) -> list[dict]:
    return elements + [RULES_CARD, QR_CARD]


def is_light_color(hex_color: str) -> bool:
    h = hex_color.lstrip("#")
    if len(h) == 3:
        h = "".join(ch * 2 for ch in h)
    if len(h) != 6:
        return False
    r = int(h[0:2], 16) / 255
    g = int(h[2:4], 16) / 255
    b = int(h[4:6], 16) / 255
    luminance = 0.299 * r + 0.587 * g + 0.114 * b
    return luminance > 0.5


def hex_to_rgb(hex_color: str) -> tuple[int, int, int]:
    h = hex_color.lstrip("#")
    if len(h) == 3:
        h = "".join(ch * 2 for ch in h)
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


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


def compute_layout(paper_w: float, paper_h: float, cols: int, rows: int) -> dict:
    gap = GAP_MM * MM
    margin = MARGIN_MM * MM
    usable_w = paper_w - 2 * margin
    usable_h = paper_h - 2 * margin - FOOTER_PT

    max_cw = (usable_w - (cols - 1) * gap) / cols
    max_ch = (usable_h - (rows - 1) * gap) / rows

    ch_from_w = max_cw / CARD_ASPECT
    cw_from_h = max_ch * CARD_ASPECT
    if ch_from_w <= max_ch:
        card_w, card_h = max_cw, ch_from_w
    else:
        card_w, card_h = cw_from_h, max_ch

    grid_w = cols * card_w + (cols - 1) * gap
    grid_h = rows * card_h + (rows - 1) * gap
    origin_x = margin + (usable_w - grid_w) / 2
    origin_y = paper_h - margin - grid_h

    return {
        "cols": cols,
        "rows": rows,
        "cards_per_page": cols * rows,
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
    cols = layout["cols"]
    rows = layout["rows"]
    x = layout["origin_x"] + col * (layout["card_w"] + layout["gap"])
    y = layout["origin_y"] + (rows - 1 - row) * (layout["card_h"] + layout["gap"])
    return x, y


def pt_to_px(pt: float, dpi: int = RENDER_DPI) -> int:
    return max(1, int(round(pt / 72.0 * dpi)))


def rounded_rect(draw: ImageDraw.ImageDraw, box: tuple, radius: int, fill, outline=None, width: int = 1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def wrap_text(text: str, font: ImageFont.ImageFont, max_width: int) -> list[str]:
    lines: list[str] = []
    for paragraph in text.split("\n"):
        words = paragraph.split()
        current = ""
        for word in words:
            candidate = f"{current} {word}".strip()
            if font.getbbox(candidate)[2] <= max_width or not current:
                current = candidate
            else:
                lines.append(current)
                current = word
        if current:
            lines.append(current)
    return lines


def render_rules(card: dict, layout: dict) -> Image.Image:
    w_px = pt_to_px(layout["card_w"])
    h_px = pt_to_px(layout["card_h"])
    img = Image.new("RGB", (w_px, h_px), PARCHMENT)
    draw = ImageDraw.Draw(img)

    border = max(2, pt_to_px(1.5))
    radius = max(6, pt_to_px(6))
    rounded_rect(
        draw,
        (border // 2, border // 2, w_px - border // 2 - 1, h_px - border // 2 - 1),
        radius,
        fill=PARCHMENT,
        outline=BRASS,
        width=border,
    )

    pad = int(w_px * 0.07)
    title_font = load_font(max(9, int(h_px * 0.08)), bold=True)
    rule_font = load_font(max(6, int(h_px * 0.052)), bold=False)

    draw.text((pad, pad), card["title"], fill=TEXT_DARK, font=title_font)

    y = pad + int(h_px * 0.12)
    line_h = max(8, int(h_px * 0.055))
    max_w = w_px - pad * 2

    for index, rule in enumerate(card["rules"], start=1):
        prefix = f"{index}. "
        lines = wrap_text(prefix + rule, rule_font, max_w)
        for line in lines:
            if y + line_h > h_px - pad:
                return img
            draw.text((pad, y), line, fill=TEXT_MUTED, font=rule_font)
            y += line_h
        y += int(line_h * 0.15)

    return img


def render_front(card: dict | None, layout: dict) -> Image.Image | None:
    if card is None:
        return None
    if card.get("kind") == "qr":
        return render_ptp_qr_card(layout, load_font, pt_to_px, rounded_rect)
    if card.get("kind") == "rules":
        return render_rules(card, layout)

    element = card
    w_px = pt_to_px(layout["card_w"])
    h_px = pt_to_px(layout["card_h"])
    img = Image.new("RGB", (w_px, h_px), hex_to_rgb(element["color"]))
    draw = ImageDraw.Draw(img)

    border = max(2, pt_to_px(2))
    radius = max(6, pt_to_px(6))
    rounded_rect(
        draw,
        (border // 2, border // 2, w_px - border // 2 - 1, h_px - border // 2 - 1),
        radius,
        fill=hex_to_rgb(element["color"]),
        outline=BRASS,
        width=border,
    )

    text_color = TEXT_DARK_ELEM if is_light_color(element["color"]) else TEXT_LIGHT
    mass_color = BRASS if is_light_color(element["color"]) else BRASS_LIGHT
    symbol_size = max(16, int(h_px * 0.24))
    number_size = max(9, int(h_px * 0.09))
    name_size = max(7, int(h_px * 0.07))
    mass_size = max(7, int(h_px * 0.08))

    symbol_font = load_font(symbol_size, bold=True)
    number_font = load_font(number_size, bold=True)
    name_font = load_font(name_size, bold=False)
    mass_font = load_font(mass_size, bold=True)

    symbol = element["symbol"]
    number = str(element["number"])
    name = element["name"]
    mass_label = format_mass(element["mass"])

    sym_bbox = draw.textbbox((0, 0), symbol, font=symbol_font)
    num_bbox = draw.textbbox((0, 0), number, font=number_font)
    name_bbox = draw.textbbox((0, 0), name, font=name_font)
    mass_bbox = draw.textbbox((0, 0), mass_label, font=mass_font)

    sym_w = sym_bbox[2] - sym_bbox[0]
    num_w = num_bbox[2] - num_bbox[0]
    name_w = name_bbox[2] - name_bbox[0]
    mass_w = mass_bbox[2] - mass_bbox[0]
    block_h = (
        (sym_bbox[3] - sym_bbox[1])
        + (num_bbox[3] - num_bbox[1])
        + (name_bbox[3] - name_bbox[1])
        + (mass_bbox[3] - mass_bbox[1])
        + h_px * 0.05
    )
    start_y = (h_px - block_h) / 2

    draw.text(((w_px - sym_w) / 2, start_y), symbol, fill=text_color, font=symbol_font)
    draw.text(((w_px - num_w) / 2, start_y + h_px * 0.22), number, fill=text_color, font=number_font)

    if name_w > w_px * 0.9:
        name = name[: max(4, int(len(name) * 0.85))].rstrip() + "…"
        name_bbox = draw.textbbox((0, 0), name, font=name_font)
        name_w = name_bbox[2] - name_bbox[0]

    draw.text(((w_px - name_w) / 2, start_y + h_px * 0.34), name, fill=text_color, font=name_font)
    draw.text(((w_px - mass_w) / 2, start_y + h_px * 0.46), mass_label, fill=mass_color, font=mass_font)
    return img


def cover_crop(source: Image.Image, target_w: int, target_h: int) -> Image.Image:
    src_w, src_h = source.size
    scale = max(target_w / src_w, target_h / src_h)
    resized = source.resize((int(src_w * scale), int(src_h * scale)), Image.Resampling.LANCZOS)
    rw, rh = resized.size
    left = (rw - target_w) // 2
    top = (rh - target_h) // 2
    return resized.crop((left, top, left + target_w, top + target_h))


def render_back(layout: dict, dogs: Image.Image) -> Image.Image:
    w_px = pt_to_px(layout["card_w"])
    h_px = pt_to_px(layout["card_h"])
    img = Image.new("RGB", (w_px, h_px), BURGUNDY_DARK)
    draw = ImageDraw.Draw(img)

    border = max(3, pt_to_px(2.5))
    inset = border * 2
    radius = max(6, pt_to_px(6))

    for i, color in enumerate([BURGUNDY_DARK, BURGUNDY, BURGUNDY_DARK]):
        offset = i
        rounded_rect(
            draw,
            (offset, offset, w_px - offset - 1, h_px - offset - 1),
            radius,
            fill=color,
            outline=BRASS if i == 2 else BRASS_LIGHT,
            width=border,
        )

    art_w = w_px - inset * 2 - border * 2
    art_h = h_px - inset * 2 - border * 2
    art = cover_crop(dogs, art_w, art_h)
    img.paste(art, (inset + border, inset + border))
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

    cols = layout["cols"]
    rows = layout["rows"]
    gap = layout["gap"]
    card_w = layout["card_w"]
    card_h = layout["card_h"]
    ox = layout["origin_x"]
    oy = layout["origin_y"]
    grid_w = layout["grid_w"]
    grid_h = layout["grid_h"]

    for col in range(1, cols):
        x = ox + col * card_w + (col - 0.5) * gap
        c.line(x, oy, x, oy + grid_h)

    for row in range(1, rows):
        y = oy + row * card_h + (row - 0.5) * gap
        c.line(ox, y, ox + grid_w, y)

    c.restoreState()


def draw_footer(c: canvas.Canvas, layout: dict):
    c.saveState()
    c.setFillColorRGB(0.45, 0.45, 0.45)
    c.setFont("Helvetica", 8)
    c.drawCentredString(layout["paper_w"] / 2, 8, "Periodic Table Poker")
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
    cols = layout["cols"]
    for idx, card in enumerate(slots):
        row = idx // cols
        col = idx % cols
        draw_col = (cols - 1 - col) if is_back else col
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


def build_pdf(
    output: Path,
    paper: str,
    *,
    layout_name: str = "standard",
    dry_run: bool = False,
    report_json: bool = False,
) -> dict:
    if layout_name not in LAYOUT_PRESETS:
        raise ValueError(f"unknown layout {layout_name!r}")

    preset = LAYOUT_PRESETS[layout_name]
    elements = load_elements(ELEMENTS_JS)
    dogs = Image.open(DOGS_SRC).convert("RGB")
    deck = build_deck(elements)

    paper_w, paper_h = PAPER_SIZES[paper]
    layout = compute_layout(paper_w, paper_h, preset["cols"], preset["rows"])
    cards_per_page = layout["cards_per_page"]

    sheet_count = math.ceil(len(deck) / cards_per_page)
    if dry_run:
        sheet_count = 1
    total_slots = sheet_count * cards_per_page
    padded = deck + [None] * (total_slots - len(deck))

    back_master = render_back(layout, dogs)
    front_cache: dict[tuple[int, int], Image.Image] = {}

    for sheet in range(sheet_count):
        chunk = padded[sheet * cards_per_page : (sheet + 1) * cards_per_page]
        for idx, card in enumerate(chunk):
            if card is not None:
                front_cache[(sheet, idx)] = render_front(card, layout)

    output.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(output), pagesize=(paper_w, paper_h))
    title_suffix = " — Large Cards" if layout_name == "large" else ""
    c.setTitle(f"Periodic Table Poker — Printable Deck{title_suffix}")
    c.setAuthor("Periodic Table Poker")

    for sheet in range(sheet_count):
        chunk = padded[sheet * cards_per_page : (sheet + 1) * cards_per_page]
        sheet_fronts = {idx: front_cache[(sheet, idx)] for idx in range(len(chunk)) if (sheet, idx) in front_cache}

        c.setPageSize((paper_w, paper_h))
        draw_sheet(c, layout, chunk, sheet_fronts, back_master, is_back=False)
        c.showPage()

        c.setPageSize((paper_w, paper_h))
        draw_sheet(c, layout, chunk, sheet_fronts, back_master, is_back=True)
        c.showPage()

    c.save()

    page_count = sheet_count * 2
    report = {
        "pages": page_count,
        "elements": len(elements),
        "faces": len(deck),
        "rulesCards": 1,
        "qrCards": 1,
        "sheets": sheet_count,
        "layout": layout_name,
        "layoutLabel": preset["label"],
        "output": str(output.resolve()),
        "paper": paper,
        "card_width_mm": round(layout["card_w"] / MM, 2),
        "card_height_mm": round(layout["card_h"] / MM, 2),
        "first_symbols": [el["symbol"] for el in elements[:3]],
        "first_mass": format_mass(elements[0]["mass"]),
        "iron_mass": format_mass(elements[25]["mass"]),
    }

    if report_json:
        print(json.dumps(report))
    else:
        print(f"wrote {output} ({page_count} pages, {len(deck)} card faces, {preset['label']})")
        print("Print: duplex ON, flip on long edge, scale 100%, minimum margins")
        print(f"Card size on sheet: {report['card_width_mm']} x {report['card_height_mm']} mm")

    return report


def main():
    parser = argparse.ArgumentParser(description="Generate Periodic Table Poker deck PDF")
    parser.add_argument("--paper", choices=("letter", "a4"), default="letter")
    parser.add_argument(
        "--layout",
        choices=tuple(LAYOUT_PRESETS),
        default="standard",
        help="standard = 3×5 grid; large = 2 cards per page (half page each)",
    )
    parser.add_argument("--output", type=Path, default=None)
    parser.add_argument("--dry-run", action="store_true", help="Generate only the first sheet pair (2 pages)")
    parser.add_argument("--report-json", action="store_true", help="Print JSON summary to stdout")
    args = parser.parse_args()

    output = args.output
    if output is None:
        output = DEFAULT_LARGE_OUTPUT if args.layout == "large" else DEFAULT_OUTPUT

    build_pdf(
        output,
        args.paper,
        layout_name=args.layout,
        dry_run=args.dry_run,
        report_json=args.report_json,
    )


if __name__ == "__main__":
    main()
