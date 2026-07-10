import type { MatrixPlan } from "./matrix";

const CELL_W = 100;
const CELL_H = 90;
const MARGIN_LEFT = 90;
const MARGIN_TOP = 60;
const MARGIN_RIGHT = 30;
const MARGIN_BOTTOM = 30;

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

export function WiringDiagram({ plan }: { plan: MatrixPlan }) {
  const width = MARGIN_LEFT + plan.cols * CELL_W + MARGIN_RIGHT;
  const height = MARGIN_TOP + plan.rows * CELL_H + MARGIN_BOTTOM;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      style={{ maxWidth: width, color: "var(--diagram-fg, #1a1a1a)" }}
      role="img"
      aria-label={`Wiring diagram: ${plan.rows} by ${plan.cols} button matrix`}
    >
      <rect x={0} y={0} width={width} height={height} fill="var(--diagram-bg, #ffffff)" />

      {/* Column lines + labels */}
      {plan.colPins.map((pin, c) => {
        const x = MARGIN_LEFT + c * CELL_W + CELL_W / 2;
        return (
          <g key={`col-${c}`}>
            <line
              x1={x}
              y1={MARGIN_TOP}
              x2={x}
              y2={MARGIN_TOP + plan.rows * CELL_H}
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
      {plan.rowPins.map((pin, r) => {
        const y = MARGIN_TOP + r * CELL_H + CELL_H / 2;
        return (
          <g key={`row-${r}`}>
            <line
              x1={MARGIN_LEFT}
              y1={y}
              x2={MARGIN_LEFT + plan.cols * CELL_W}
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
      {plan.cells
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
    </svg>
  );
}
