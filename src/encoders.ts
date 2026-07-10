import type { BoardProfile } from "./boards";

export interface EncoderPlan {
  index: number;
  pinA: string;
  pinB: string;
  usesInterruptPins: boolean;
  /** HID index sent when the encoder is turned clockwise. */
  cwHidIndex: number;
  /** HID index sent when the encoder is turned counter-clockwise. */
  ccwHidIndex: number;
  /** Physical matrix button number for this encoder's push-button, if included. */
  pushButtonNumber?: number;
}

export interface EncoderAllocation {
  encoders: EncoderPlan[];
  /** Pins consumed by encoders — remove these from the pool before planning the matrix. */
  usedPins: string[];
  warnings: string[];
}

export type EncoderError = { kind: "not-enough-encoder-pins"; needed: number; available: number };

export type EncoderResult =
  | { ok: true; allocation: EncoderAllocation }
  | { ok: false; error: EncoderError };

/**
 * Allocates 2 pins (A/B quadrature) per encoder, preferring the board's
 * interrupt-capable pins so fast rotation doesn't drop steps between matrix
 * scan passes. HID indices for CW/CCW pulses are assigned starting at
 * `hidIndexOffset` (after the matrix's own button HID indices).
 */
export function allocateEncoders(
  count: number,
  board: BoardProfile,
  hidIndexOffset: number
): EncoderResult {
  if (count === 0) {
    return { ok: true, allocation: { encoders: [], usedPins: [], warnings: [] } };
  }

  const needed = count * 2;
  if (needed > board.matrixPins.length) {
    return {
      ok: false,
      error: { kind: "not-enough-encoder-pins", needed, available: board.matrixPins.length },
    };
  }

  const interruptSet = new Set(board.interruptPins);
  const preferred = board.matrixPins.filter((p) => interruptSet.has(p));
  const fallback = board.matrixPins.filter((p) => !interruptSet.has(p));
  const pinPool = [...preferred, ...fallback];

  const usedPins = pinPool.slice(0, needed);
  const encoders: EncoderPlan[] = [];
  const warnings: string[] = [];
  let nonInterruptCount = 0;

  for (let i = 0; i < count; i++) {
    const pinA = usedPins[i * 2];
    const pinB = usedPins[i * 2 + 1];
    const usesInterruptPins = interruptSet.has(pinA) && interruptSet.has(pinB);
    if (!usesInterruptPins) nonInterruptCount++;
    encoders.push({
      index: i,
      pinA,
      pinB,
      usesInterruptPins,
      cwHidIndex: hidIndexOffset + i * 2,
      ccwHidIndex: hidIndexOffset + i * 2 + 1,
    });
  }

  if (nonInterruptCount > 0) {
    warnings.push(
      `${nonInterruptCount} encoder${nonInterruptCount === 1 ? "" : "s"} landed on non-interrupt-capable pins ` +
        `(only ${preferred.length} interrupt-capable pins available on ${board.shortName}). The Encoder library ` +
        `falls back to polling on those pins — fine for hand-turned detented encoders, but fast spins may drop steps.`
    );
  }

  return { ok: true, allocation: { encoders, usedPins, warnings } };
}
