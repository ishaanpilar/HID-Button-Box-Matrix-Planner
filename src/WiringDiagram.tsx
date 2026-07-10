import type { Plan } from "./plan";

const CELL_W = 100;
const CELL_H = 90;
const MARGIN_LEFT = 90;
const MARGIN_TOP = 60;
const MARGIN_RIGHT = 30;
const MARGIN_BOTTOM = 30;

const ENC_W = 150;
const ENC_H = 130;
const ENC_GAP = 16;
const ENC_SECTION_TOP_PAD = 50;

function DiodeSymbol({ x, y, horizontal }: { x: number; y: number; horizontal: boolean }) {
  // Small diode symbol: triangle + bar, pointing toward the row line
  // (cathode/bar end faces the row, per the plan's diode orientation).
  const size = 7;
  if (horizontal) {
    return (
      <g transform={`translate(${x}, ${y})`}>
        <polygon points={`${-size},${-size} ${-size},${size} ${size},0`} fill="none" stroke="currentColor" strokeWidth={1.5} />
        <line x1={size} y1={-size} x2={size} y2={size} stroke="currentColor" strokeWidth={1.5} />
      </g>
    );
  }
  return (
    <g transform={`translate(${x}, ${y})`}>
      <polygon points={`${-size},${-size} ${size},${-size} 0,${size}`} fill="none" stroke="currentColor" strokeWidth={1.5} />
      <line x1={-size} y1={size} x2={size} y2={size} stroke="currentColor" strokeWidth={1.5} />
    </g>
  );
}

export function WiringDiagram({ plan }: { plan: Plan }) {
  const { matrix, encoders } = plan;

  const matrixWidth = matrix ? MARGIN_LEFT + matrix.cols * CELL_W + MARGIN_RIGHT : 0;
  const matrixHeight = matrix ? MARGIN_TOP + matrix.rows * CELL_H + MARGIN_BOTTOM : 0;

  const encSectionHeight = encoders.length > 0 ? ENC_SECTION_TOP_PAD + ENC_H + MARGIN_BOTTOM : 0;
  const encSectionWidth =
    encoders.length > 0 ? 20 + encoders.length * ENC_W + (encoders.length - 1) * ENC_GAP + 20 : 0;

  const width = Math.max(matrixWidth, encSectionWidth, 200);
  const height = matrixHeight + encSectionHeight;
  const encSectionY = matrixHeight;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      style={{ maxWidth: width, color: "var(--diagram-fg, #1a1a1a)" }}
      role="img"
      aria-label="Button box wiring diagram"
    >
      <rect x={0} y={0} width={width} height={height} fill="var(--diagram-bg, #ffffff)" />

      {matrix && (
        <g>
          {/* Column lines + labels */}
          {matrix.colPins.map((pin, c) => {
            const x = MARGIN_LEFT + c * CELL_W + CELL_W / 2;
            return (
              <g key={`col-${c}`}>
                <line
                  x1={x}
                  y1={MARGIN_TOP}
                  x2={x}
                  y2={MARGIN_TOP + matrix.rows * CELL_H}
                  stroke="currentColor"
                  strokeWidth={2}
                  opacity={0.55}
                />
                <text x={x} y={MARGIN_TOP - 30} textAnchor="middle" fontSize={13} fontWeight={600}>
                  COL {c}
                </text>
                <text x={x} y={MARGIN_TOP - 14} textAnchor="middle" fontSize={12} opacity={0.75}>
                  pin {pin}
                </text>
              </g>
            );
          })}

          {/* Row lines + labels */}
          {matrix.rowPins.map((pin, r) => {
            const y = MARGIN_TOP + r * CELL_H + CELL_H / 2;
            return (
              <g key={`row-${r}`}>
                <line
                  x1={MARGIN_LEFT}
                  y1={y}
                  x2={MARGIN_LEFT + matrix.cols * CELL_W}
                  y2={y}
                  stroke="currentColor"
                  strokeWidth={2}
                  opacity={0.55}
                />
                <text x={MARGIN_LEFT - 12} y={y - 6} textAnchor="end" fontSize={13} fontWeight={600}>
                  ROW {r}
                </text>
                <text x={MARGIN_LEFT - 12} y={y + 10} textAnchor="end" fontSize={12} opacity={0.75}>
                  pin {pin}
                </text>
              </g>
            );
          })}

          {/* Junctions: button + diode, skipping unused cells */}
          {matrix.cells
            .filter((cell) => !cell.isUnused)
            .map((cell) => {
              const cx = MARGIN_LEFT + cell.col * CELL_W + CELL_W / 2;
              const cy = MARGIN_TOP + cell.row * CELL_H + CELL_H / 2;
              return (
                <g key={`cell-${cell.row}-${cell.col}`}>
                  <circle cx={cx} cy={cy} r={16} fill="var(--diagram-bg, #ffffff)" stroke="currentColor" strokeWidth={2} />
                  <text x={cx} y={cy + 4} textAnchor="middle" fontSize={12} fontWeight={700}>
                    {cell.buttonNumber}
                  </text>
                  {/* diode sits between the switch and the row line, cathode facing the row */}
                  <DiodeSymbol x={cx} y={cy + 30} horizontal={false} />
                </g>
              );
            })}
        </g>
      )}

      {encoders.length > 0 && (
        <g>
          <text x={20} y={encSectionY + 22} fontSize={13} fontWeight={600}>
            Rotary encoders (direct-wired — not part of the matrix)
          </text>
          {encoders.map((enc, i) => {
            const bx = 20 + i * (ENC_W + ENC_GAP);
            const by = encSectionY + ENC_SECTION_TOP_PAD;
            return (
              <g key={`enc-${enc.index}`}>
                <rect
                  x={bx}
                  y={by}
                  width={ENC_W}
                  height={ENC_H}
                  rx={8}
                  fill="var(--diagram-bg, #ffffff)"
                  stroke="currentColor"
                  strokeWidth={2}
                />
                <text x={bx + ENC_W / 2} y={by + 22} textAnchor="middle" fontSize={13} fontWeight={700}>
                  ENCODER {enc.index + 1}
                </text>
                <text x={bx + ENC_W / 2} y={by + 42} textAnchor="middle" fontSize={11.5}>
                  A → pin {enc.pinA}
                </text>
                <text x={bx + ENC_W / 2} y={by + 58} textAnchor="middle" fontSize={11.5}>
                  B → pin {enc.pinB}
                </text>
                <text x={bx + ENC_W / 2} y={by + 78} textAnchor="middle" fontSize={11} opacity={0.75}>
                  CW → HID {enc.cwHidIndex} · CCW → HID {enc.ccwHidIndex}
                </text>
                {enc.pushButtonNumber !== undefined && (
                  <text x={bx + ENC_W / 2} y={by + 96} textAnchor="middle" fontSize={11} opacity={0.75}>
                    push → matrix #{enc.pushButtonNumber}
                  </text>
                )}
                {!enc.usesInterruptPins && (
                  <text x={bx + ENC_W / 2} y={by + 114} textAnchor="middle" fontSize={10} fill="#c98a12">
                    ⚠ non-interrupt pins
                  </text>
                )}
              </g>
            );
          })}
        </g>
      )}
    </svg>
  );
}
