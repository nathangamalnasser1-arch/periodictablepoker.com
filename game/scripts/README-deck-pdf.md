# Printable deck PDF

Generates Periodic Table Poker deck PDFs at the repo root with **dogs-playing-poker backs**, laid out for duplex printing.

## Setup

```bash
cd game
python -m pip install -r scripts/requirements-deck.txt
```

## Generate

**Standard (3×5 grid, ~36 × 50 mm cards):**

```bash
npm run generate:deck-pdf
```

→ `Periodic Table Poker.pdf` — **16 pages**, 120 card faces

**Large (2 per page, half-page each, ~93 × 130 mm cards):**

```bash
npm run generate:deck-pdf-large
```

→ `Periodic Table Poker (Large Cards).pdf` — **120 pages**

### Deck contents (120 faces)

- **118** element cards (symbol, number, name, atomic mass in u, CPK color)
- **1** rules card (8 short Texas Hold'em / PTP rules)
- **1** QR card → [periodictablepoker.com](https://periodictablepoker.com)

### CLI flags

| Flag | Description |
|------|-------------|
| `--layout standard` | 3×5 grid (default) |
| `--layout large` | 2 cards per page (half page each) |
| `--paper letter` | US Letter (default) |
| `--paper a4` | A4 paper |
| `--output PATH` | Output PDF path |
| `--dry-run` | First sheet only (2 pages) |
| `--report-json` | JSON summary on stdout |

## Print settings

1. **Duplex / double-sided:** ON  
2. **Flip on:** long edge  
3. **Scale:** 100% (do not “fit to page”)  
4. **Margins:** minimum  

Back pages are **mirrored horizontally** per row so card backs align with fronts after long-edge duplex.

## Tests

```bash
npm test -- generate-deck-pdf
```
