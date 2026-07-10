# Button Box Matrix Planner

Turn a control count into a working button box: type in how many momentary
buttons and rotary encoders you want and pick a board (Pro Micro / RP2040 /
ESP32-S3), and get:

- the smallest row×col button matrix that fits, with pins assigned
- a diode plan (orientation + why it prevents ghosting/enables rollover)
- direct-wired pin routing for rotary encoders, prioritizing interrupt-capable
  pins, with an optional push-button folded into the matrix
- a printable SVG wiring diagram
- a ready-to-flash Arduino `.ino` HID sketch (matrix scan + `Encoder`-library
  quadrature decoding, reported as CW/CCW pulse buttons)
- a printable HID button-number label sheet (physical # ↔ HID index)

**Live app:** <https://ishaanpilar.github.io/HID-Button-Box-Matrix-Planner/>

## Scope

v1 supports momentary buttons and rotary encoders. Latching toggles and
multi-position rotary switches aren't wired up yet.

## Development

```bash
npm install
npm run dev
```

## Deployment

Pushing to `main` builds and deploys automatically to GitHub Pages via
[.github/workflows/deploy.yml](.github/workflows/deploy.yml).
