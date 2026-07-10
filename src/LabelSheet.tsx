import type { Plan } from "./plan";

// Printable HID button-number reference: a grid matching the physical matrix
// layout (each cell showing the physical button # and its HID index) plus an
// encoder table, and a flat table for looking up "physical button 14" -> HID
// number when configuring the game. Uses the browser's native print-to-PDF
// for export.

export function LabelSheet({ plan }: { plan: Plan }) {
  const { board, matrix, encoders, totalHidButtons } = plan;
  const usedCells = matrix?.cells.filter((c) => !c.isUnused) ?? [];

  return (
    <div className="label-sheet">
      <h2>HID Button Map — {board.shortName}</h2>
      <p className="label-sheet-sub">
        {totalHidButtons} total HID buttons
        {matrix ? ` · ${matrix.buttonCount} via ${matrix.rows}×${matrix.cols} matrix` : ""}
        {encoders.length ? ` · ${encoders.length} encoder${encoders.length === 1 ? "" : "s"}` : ""} · HID
        indices are 0-based (as reported to the OS/game)
      </p>

      {matrix && (
        <div className="label-grid" style={{ gridTemplateColumns: `repeat(${matrix.cols}, 1fr)` }}>
          {matrix.cells.map((cell) => (
            <div
              key={`${cell.row}-${cell.col}`}
              className={cell.isUnused ? "label-cell label-cell-unused" : "label-cell"}
            >
              {!cell.isUnused && (
                <>
                  <div className="label-cell-number">#{cell.buttonNumber}</div>
                  {cell.label && <div className="label-cell-tag">{cell.label}</div>}
                  <div className="label-cell-hid">HID {cell.hidIndex}</div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {matrix && (
        <table className="label-table">
          <thead>
            <tr>
              <th>Physical #</th>
              <th>Label</th>
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
                <td>{cell.label ?? "Button"}</td>
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
      )}

      {encoders.length > 0 && (
        <table className="label-table label-table-encoders">
          <thead>
            <tr>
              <th>Encoder</th>
              <th>Pin A</th>
              <th>Pin B</th>
              <th>CW HID</th>
              <th>CCW HID</th>
              <th>Push button</th>
            </tr>
          </thead>
          <tbody>
            {encoders.map((enc) => (
              <tr key={enc.index}>
                <td>{enc.index + 1}</td>
                <td>{enc.pinA}</td>
                <td>{enc.pinB}</td>
                <td>{enc.cwHidIndex}</td>
                <td>{enc.ccwHidIndex}</td>
                <td>{enc.pushButtonNumber !== undefined ? `#${enc.pushButtonNumber} (matrix)` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
