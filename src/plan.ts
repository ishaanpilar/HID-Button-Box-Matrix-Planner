import type { BoardProfile } from "./boards";
import { buildMatrix, type MatrixPlan } from "./matrix";
import { allocateEncoders, type EncoderPlan } from "./encoders";

export interface ControlsConfig {
  momentaryButtons: number;
  encoderCount: number;
  encodersHavePush: boolean;
}

export interface Plan {
  board: BoardProfile;
  config: ControlsConfig;
  /** null when no momentary buttons and no encoder push-buttons are configured. */
  matrix: MatrixPlan | null;
  encoders: EncoderPlan[];
  totalHidButtons: number;
  warnings: string[];
}

export type PlanError =
  | { kind: "too-many-buttons"; maxHidButtons: number; requested: number }
  | { kind: "not-enough-encoder-pins"; needed: number; available: number }
  | { kind: "not-enough-pins"; needed: number; available: number };

export type PlanResult = { ok: true; plan: Plan } | { ok: false; error: PlanError };

export function computePlan(config: ControlsConfig, board: BoardProfile): PlanResult {
  const matrixButtonCount =
    config.momentaryButtons + (config.encodersHavePush ? config.encoderCount : 0);
  const totalHidButtons = matrixButtonCount + config.encoderCount * 2;

  if (totalHidButtons > board.maxHidButtons) {
    return {
      ok: false,
      error: {
        kind: "too-many-buttons",
        maxHidButtons: board.maxHidButtons,
        requested: totalHidButtons,
      },
    };
  }

  const encoderResult = allocateEncoders(config.encoderCount, board, matrixButtonCount);
  if (!encoderResult.ok) {
    return { ok: false, error: encoderResult.error };
  }
  const { encoders, usedPins: encoderPins, warnings: encoderWarnings } = encoderResult.allocation;

  const encoderPinSet = new Set(encoderPins);
  const remainingPins = board.matrixPins.filter((p) => !encoderPinSet.has(p));

  let matrixPlan: MatrixPlan | null = null;
  if (matrixButtonCount > 0) {
    const matrixResult = buildMatrix(matrixButtonCount, remainingPins);
    if (!matrixResult.ok) {
      return { ok: false, error: matrixResult.error };
    }
    matrixPlan = matrixResult.plan;

    if (config.encodersHavePush) {
      for (const cell of matrixPlan.cells) {
        if (cell.isUnused || cell.buttonNumber <= config.momentaryButtons) continue;
        const encoderIndex = cell.buttonNumber - config.momentaryButtons - 1;
        cell.label = `Encoder ${encoderIndex + 1} push`;
        encoders[encoderIndex].pushButtonNumber = cell.buttonNumber;
      }
    }
  }

  return {
    ok: true,
    plan: {
      board,
      config,
      matrix: matrixPlan,
      encoders,
      totalHidButtons,
      warnings: [...(matrixPlan?.warnings ?? []), ...encoderWarnings],
    },
  };
}
