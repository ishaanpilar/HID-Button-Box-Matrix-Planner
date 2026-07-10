import type { MatrixPlan } from "./matrix";
import type { BoardProfile } from "./boards";

// Printable HID button-number reference: a grid matching the physical matrix
// layout, each cell showing the physical button # and its HID index, plus a
// flat table for looking up "physical button 14" -> HID number when
// configuring the game. Uses the browser's native print-to-PDF for export.

export function LabelSheet({ plan, board }: { plan: MatrixPlan; board: BoardProfile }) {
  const usedCells = plan.cells.filter((c) => !c.isUnused);

  return (
    <div className="label-sheet">
      <h2>HID Button Map — {board.shortName}</h2>
      <p className="label-sheet-sub">
        {plan.buttonCount} buttons · {plan.rows}×{plan.cols} matrix · HID indices are 0-based (as reported to the OS/game)
      </p>

      <div
        className="label-grid"
        style={{ gridTemplateColumns: `repeat(${plan.cols}, 1fr)` }}
      >
        {plan.cells.map((cell) => (
          <div
            key={`${cell.row}-${cell.col}`}
            className={cell.isUnused ? "label-cell label-cell-unused" : "label-cell"}
          >
            {!cell.isUnused && (
              <>
                <div className="label-cell-number">#{cell.buttonNumber}</div>
                <div className="label-cell-hid">HID {cell.hidIndex}</div>
              </>
            )}
          </div>
        ))}
      </div>

      <table className="label-table">
        <thead>
          <tr>
            <th>Physical #</th>
            <th>HID index</th>
            <th>Row / Col</th>
            <th>Row pin</th>
            <th>Col pin</th>
          </tr>
        </thead>
        <tbody>
          {usedCells.map((cell) => (
            <tr key={cell.buttonNumber}>
              <td>{cell.buttonNumber}</td>
              <td>{cell.hidIndex}</td>
              <td>
                R{cell.row}/C{cell.col}
              </td>
              <td>{cell.rowPin}</td>
              <td>{cell.colPin}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
