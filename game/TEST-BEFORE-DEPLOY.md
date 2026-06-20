# Test plays locally before deploying

## Run the local test page

From the **game** folder:

```bash
npm run test:play
```

Then open **http://localhost:5173** in your browser. You’ll see an orange **“Local test — not deployed”** banner at the top so you know you’re not on the live site.

To test the **production build** (same as deploy) locally:

```bash
npm run build
npm run preview
```

Then open **http://localhost:4173**.

---

## Checklist: what to test before deploy

- [ ] **Game 1** — One player has NaCl; that player wins and the banner shows “Winner: … (NaCl)!”. Winner seat flashes.
- [ ] **Game 2** — One player has H₂O; that player wins and the banner shows “Winner: … (H₂O)!”. Winner seat flashes.
- [ ] **Game 3** — One player has CHONP (C,H in hole + O,N,P on board). That player wins; banner shows “CHONP wins! Winner: … — flashing”. Winner seat flashes.
- [ ] **Game 4** — “The real game starts — 1000 atomcoins redistributed!” appears. Chips persist from here on.
- [ ] **Bots with molecules** — Bots with NaCl / H₂O / CHONP don’t fold; they go all-in. Bot with C+H doesn’t fold preflop (so they can make CHONP on the flop).
- [ ] **Everyone folds** — When all but one player fold, the last player wins and the banner shows “Winner: … (H₂O)” or the correct reason (not missing).
- [ ] **No stuck “Bot thinking…”** — After a bot acts (or folds), the turn advances and doesn’t hang.
- [ ] **Hand order** — CHONP beats H₂O beats NaCl beats “best hand” (mass). In any game, molecule wins over mass when both are in the hand.

When everything looks good, deploy from the **game** folder:

```bash
npm run deploy
```
