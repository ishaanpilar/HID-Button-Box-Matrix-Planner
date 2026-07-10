export interface MatrixCell {
  row: number;
  col: number;
  /** 1-based physical button number, row-major order. */
  buttonNumber: number;
  /** 0-based HID button index sent to the host. */
  hidIndex: number;
  rowPin: string;
  colPin: string;
  isUnused: boolean;
  /** Override label, e.g. "Encoder 2 push" for a push-button folded into the matrix. */
  label?: string;
}

export interface MatrixPlan {
  buttonCount: number;
  rows: number;
  cols: number;
  rowPins: string[];
  colPins: string[];
  totalPins: number;
  unusedCells: number;
  cells: MatrixCell[];
  diode: {
    orientation: string;
    reasoning: string;
  };
  warnings: string[];
}

export type MatrixError = { kind: "not-enough-pins"; needed: number; available: number };

export type MatrixResult = { ok: true; plan: MatrixPlan } | { ok: false; error: MatrixError };

/**
 * Finds the row x col matrix with the fewest total pins (rows + cols) that
 * fits `buttonCount` buttons within the available pin pool. Ties are broken
 * toward a squarer matrix (smaller |rows - cols|), since that tends to
 * produce a more compact, easier-to-wire physical layout.
 */
function bestFactorization(
  buttonCount: number,
  maxPins: number
): { rows: number; cols: number } | null {
  let best: { rows: number; cols: number; total: number } | null = null;

  for (let rows = 1; rows <= buttonCount; rows++) {
    const cols = Math.ceil(buttonCount / rows);
    const total = rows + cols;
    if (total > maxPins) continue;

    if (
      !best ||
      total < best.total ||
      (total === best.total &&
        Math.abs(rows - cols) < Math.abs(best.rows - best.cols))
    ) {
      best = { rows, cols, total };
    }
  }

  return best ? { rows: best.rows, cols: best.cols } : null;
}

/**
 * Builds a matrix plan for `buttonCount` momentary switches (including any
 * encoder push-buttons folded in by the caller) out of `availablePins`.
 * HID indices are assigned row-major starting at 0 — callers that also have
 * non-matrix HID controls (e.g. encoder rotation pulses) should offset their
 * own indices to start after `buttonCount`.
 */
export function buildMatrix(buttonCount: number, availablePins: string[]): MatrixResult {
  const available = availablePins.length;
  const factorization = bestFactorization(buttonCount, available);

  if (!factorization) {
    return {
      ok: false,
      error: {
        kind: "not-enough-pins",
        needed: Math.ceil(2 * Math.sqrt(buttonCount)),
        available,
      },
    };
  }

  const { rows, cols } = factorization;
  const rowPins = availablePins.slice(0, rows);
  const colPins = availablePins.slice(rows, rows + cols);

  const cells: MatrixCell[] = [];
  let hidIndex = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const buttonNumber = r * cols + c + 1;
      const isUnused = buttonNumber > buttonCount;
      cells.push({
        row: r,
        col: c,
        buttonNumber,
        hidIndex: isUnused ? -1 : hidIndex,
        rowPin: rowPins[r],
        colPin: colPins[c],
        isUnused,
      });
      if (!isUnused) hidIndex++;
    }
  }

  const unusedCells = rows * cols - buttonCount;
  const warnings: string[] = [];
  if (unusedCells > 0) {
    warnings.push(
      `${unusedCells} matrix junction${unusedCells === 1 ? "" : "s"} (${
        rows * cols
      } grid cells for ${buttonCount} buttons) are unused — leave them unpopulated, no diode/switch needed there.`
    );
  }

  return {
    ok: true,
    plan: {
      buttonCount,
      rows,
      cols,
      rowPins,
      colPins,
      totalPins: rows + cols,
      unusedCells,
      cells,
      diode: {
        orientation: "Cathode (banded end) toward the ROW pin; anode toward the COLUMN pin.",
        reasoning:
          "Rows are driven as OUTPUT and pulled LOW one at a time during scanning; columns are INPUT_PULLUP and idle HIGH. " +
          "When a button is pressed, current only needs to flow column (HIGH) -> diode -> switch -> row (LOW). " +
          "Orienting every diode's cathode toward its row enforces that single direction on every junction, which is " +
          "what actually prevents ghost keypresses and enables full n-key rollover — without diodes, current can sneak " +
          "backwards through a 3rd key and make the matrix report a phantom 4th key.",
      },
      warnings,
    },
  };
}
