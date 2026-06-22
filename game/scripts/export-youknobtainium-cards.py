"""Export youknObtainium card definitions from game.js into JSON."""
from __future__ import annotations

import argparse
import json
import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_JS = ROOT / "scripts" / "youknobtainium-game.js"
DEFAULT_OUT = ROOT / "scripts" / "youknobtainium-cards.json"
SOURCE_URL = "https://youknobtainium.web.app/game.js"

ELEMENT_RE = re.compile(
    r"\{\s*z:\s*(\d+),\s*sym:\s*'([^']+)',\s*name:\s*'([^']+)',\s*family:\s*(\d+)\s*\}"
)
MELTING_BLOCK_RE = re.compile(r"const MELTING_K = \{([^}]+)\}", re.DOTALL)
MELTING_ENTRY_RE = re.compile(r"(\w+):\s*(\d+)")


def fetch_game_js(dest: Path) -> str:
    data = urllib.request.urlopen(SOURCE_URL, timeout=60).read().decode("utf-8")
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(data, encoding="utf-8")
    return data


def parse_game_js(text: str) -> dict:
    elements = [
        {
            "z": int(m.group(1)),
            "sym": m.group(2),
            "name": m.group(3),
            "family": int(m.group(4)),
            "kind": "element",
        }
        for m in ELEMENT_RE.finditer(text)
    ]
    if len(elements) != 118:
        raise ValueError(f"expected 118 elements, found {len(elements)}")

    melt_match = MELTING_BLOCK_RE.search(text)
    if not melt_match:
        raise ValueError("MELTING_K block not found")
    melting_k = {
        sym: int(value)
        for sym, value in MELTING_ENTRY_RE.findall(melt_match.group(1))
    }

    family_names = [
        "Alkali Metals (Group 1)",
        "Alkaline Earth Metals (Group 2)",
        "Chalcogens (Group 16)",
        "Halogens (Group 17)",
    ]

    action_cards = [
        {"kind": "action", "type": "fission", "label": "Fission"},
        {"kind": "action", "type": "fission", "label": "Fission"},
        {"kind": "action", "type": "fusion", "label": "Fusion"},
        {"kind": "action", "type": "fusion", "label": "Fusion"},
        {"kind": "action", "type": "eventHorizon", "label": "Event Horizon"},
        {"kind": "action", "type": "temperature", "label": "300 K", "valueK": 300},
        {"kind": "action", "type": "temperature", "label": "600 K", "valueK": 600},
        {"kind": "action", "type": "temperature", "label": "1000 K", "valueK": 1000},
        {"kind": "action", "type": "temperature", "label": "1500 K", "valueK": 1500},
        {"kind": "action", "type": "temperature", "label": "2500 K", "valueK": 2500},
    ]

    rules_cards = [
        {
            "kind": "rules",
            "title": "Rules (1/2)",
            "text": (
                "Goal: empty your hand first. If the draw pile runs out, players may shed "
                "any legal play until someone wins.\n\n"
                "Families match like colors: Alkali ● blue, Alkaline Earth ▲ green, "
                "Chalcogens ■ amber, Halogens ◆ purple. Play a card whose family matches the top card.\n\n"
                "Stable molecules: play the whole molecule at once if one atom matches the top family "
                "(batch shed). When the deck is empty, shed any full molecule.\n\n"
                "Ferromagnetism combo: Nd + Fe + B + (Co or Ni). Batch shed all four when one matches "
                "the top card (or anytime if deck empty). Next player collects all Fe, Ni, Co, Nd, Gd, Dy, Sm, Tc "
                "from every other hand."
            ),
        },
        {
            "kind": "rules",
            "title": "Rules (2/2)",
            "text": (
                "Fission: Chalcogens count as Alkali for matching. "
                "Fusion: Chalcogens count as Alkaline Earth.\n\n"
                "Temperature cards melt metals: discard metals in your hand with melting point ≤ the card's K; "
                "then discard the temperature card.\n\n"
                "Event Horizon: discard your entire remaining hand and win instantly.\n\n"
                "Radioactive elements decay after 3 full rounds in your hand (auto-discard).\n\n"
                "If you cannot play, draw one card. If it is playable, you may play it in the same turn."
            ),
        },
    ]

    return {
        "source": SOURCE_URL,
        "familyNames": family_names,
        "meltingK": melting_k,
        "elements": elements,
        "actionCards": action_cards,
        "rulesCards": rules_cards,
        "deck": elements + action_cards + rules_cards,
    }


def main():
    parser = argparse.ArgumentParser(description="Export youknObtainium cards JSON")
    parser.add_argument("--js", type=Path, default=DEFAULT_JS, help="Local game.js path")
    parser.add_argument("--fetch", action="store_true", help="Download latest game.js from web app")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUT)
    args = parser.parse_args()

    if args.fetch or not args.js.exists():
        text = fetch_game_js(args.js)
    else:
        text = args.js.read_text(encoding="utf-8")

    data = parse_game_js(text)
    args.output.write_text(json.dumps(data, indent=2), encoding="utf-8")
    print(f"wrote {args.output} ({len(data['deck'])} cards)")


if __name__ == "__main__":
    main()
