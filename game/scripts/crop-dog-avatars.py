"""Crop dog portraits from club-dogs-poker.png for seat avatars."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "public" / "club-dogs-poker.png"
OUT = ROOT / "public" / "avatars"
OUT.mkdir(parents=True, exist_ok=True)

# (left, upper, right, lower) on 1024×792 source — tuned to each dog's head
CROPS = {
    "dog-pipe.png": (355, 95, 655, 430),       # center, pipe & spectacles — "You"
    "dog-pince-nez.png": (25, 85, 295, 430),   # far left
    "dog-peering.png": (175, 35, 415, 310),    # back left, over shoulder
    "dog-cigar.png": (655, 120, 990, 520),     # right profile
    "dog-scholar.png": (115, 130, 355, 400),   # left variant for 5th seat
}

def main():
    im = Image.open(SRC).convert("RGBA")
    for name, box in CROPS.items():
        crop = im.crop(box)
        w, h = crop.size
        side = max(w, h)
        square = Image.new("RGBA", (side, side), (0, 0, 0, 0))
        square.paste(crop, ((side - w) // 2, (side - h) // 2))
        size = 256
        square = square.resize((size, size), Image.Resampling.LANCZOS)
        square.save(OUT / name, optimize=True)
        print(f"wrote {name} from {box}")

if __name__ == "__main__":
    main()
