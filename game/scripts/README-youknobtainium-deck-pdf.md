# youknObtainium printable deck PDF

Generates **`youknObtainium Deck.pdf`** at the repo root: element faces, action cards, rules cards on odd pages; JWST space image on even pages — aligned for duplex printing.

## Setup

```bash
cd game
python -m pip install -r scripts/requirements-deck.txt
```

## Refresh card data (optional)

Card definitions are exported from the live game into `scripts/youknobtainium-cards.json`:

```bash
python scripts/export-youknobtainium-cards.py --fetch
```

Source: [youknobtainium.web.app/game.js](https://youknobtainium.web.app/game.js)

## Generate PDF

```bash
npm run generate:youknobtainium-deck-pdf
```

### CLI flags

| Flag | Description |
|------|-------------|
| `--paper letter` | US Letter (default) |
| `--paper a4` | A4 paper |
| `--output PATH` | Output PDF path (default: `../youknObtainium Deck.pdf`) |
| `--cards PATH` | Card JSON (default: `scripts/youknobtainium-cards.json`) |
| `--dry-run` | First sheet only (2 pages) |
| `--report-json` | JSON summary on stdout |

## Deck contents (131 faces)

- **118** element cards (symbol, name, family, melting point)
- **10** action cards: 2× Fission, 2× Fusion, 1× Event Horizon, 5× Temperature
- **2** rules cards (condensed game rules)
- **1** QR card → [youknobtainium.web.app](https://youknobtainium.web.app)

**Back:** `public/card-back-space.png` (James Webb space field, same image used in the web game)

## Print settings

1. **Duplex / double-sided:** ON  
2. **Flip on:** long edge  
3. **Scale:** 100% (do not “fit to page”)  
4. **Margins:** minimum  

**18 pages** total (9 front sheets + 9 back sheets). Back pages are mirrored horizontally per row for long-edge duplex.

## Layout

- **3 × 5** cards per sheet (~36 × 50 mm on US Letter — poker aspect ratio, scaled to fit)
- Light dashed cut guides between cards

## Tests

```bash
npm test -- generate-youknobtainium-deck-pdf
```
