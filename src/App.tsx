import { useMemo, useState } from "react";
import { BOARD_LIST, BOARDS, type BoardId } from "./boards";
import { computeMatrix } from "./matrix";
import { generateSketch } from "./sketchGen";
import { WiringDiagram } from "./WiringDiagram";
import { LabelSheet } from "./LabelSheet";
import { downloadSvgAsPng, downloadTextFile } from "./exportUtils";
import "./App.css";

function App() {
  const [boardId, setBoardId] = useState<BoardId>("pro-micro");
  const [buttonCount, setButtonCount] = useState(20);

  const board = BOARDS[boardId];
  const result = useMemo(() => computeMatrix(buttonCount, board), [buttonCount, board]);

  const sketch = result.ok ? generateSketch(board, result.plan) : null;

  return (
    <div className="app">
      <header className="app-header">
        <h1>Button Box Matrix Planner</h1>
        <p>
          Type in how many momentary buttons you want and pick a board — get the matrix wiring
          diagram, the diode plan, an Arduino/HID sketch, and a button-number label sheet.
        </p>
      </header>

      <section className="controls-form">
        <label>
          Momentary buttons
          <input
            type="number"
            min={1}
            max={64}
            value={buttonCount}
            onChange={(e) => setButtonCount(Math.max(1, Number(e.target.value) || 1))}
          />
        </label>

        <label>
          Board
          <select value={boardId} onChange={(e) => setBoardId(e.target.value as BoardId)}>
            {BOARD_LIST.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
      </section>

      {!result.ok && (
        <div className="error-box">
          {result.error.kind === "too-many-buttons" && (
            <p>
              This template supports up to {result.error.maxHidButtons} HID buttons per board
              (default gamepad HID report size). Reduce your button count or split across two
              microcontrollers.
            </p>
          )}
          {result.error.kind === "not-enough-pins" && (
            <p>
              {board.shortName} doesn't expose enough safe matrix pins for {buttonCount} buttons —
              needs roughly {result.error.needed} pins, only {result.error.available} available in
              this profile.
            </p>
          )}
        </div>
      )}

      {result.ok && (
        <>
          <section className="summary-card">
            <h2>Matrix Plan</h2>
            <ul className="summary-list">
              <li>
                <strong>{result.plan.rows}</strong> rows &times; <strong>{result.plan.cols}</strong>{" "}
                cols = {result.plan.totalPins} pins used on {board.shortName}
              </li>
              <li>
                Row pins: <code>{result.plan.rowPins.join(", ")}</code>
              </li>
              <li>
                Column pins: <code>{result.plan.colPins.join(", ")}</code>
              </li>
              <li>Diode orientation: {result.plan.diode.orientation}</li>
            </ul>
            <p className="diode-reasoning">{result.plan.diode.reasoning}</p>
            {result.plan.warnings.map((w, i) => (
              <p className="warning" key={i}>
                ⚠ {w}
              </p>
            ))}
            <div className="board-notes">
              <strong>Board setup notes:</strong>
              <ul>
                {board.notes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </div>
          </section>

          <section className="diagram-card">
            <h2>Wiring Diagram</h2>
            <div className="svg-wrap">
              <WiringDiagram plan={result.plan} />
            </div>
            <button
              onClick={() => {
                const svgEl = document.querySelector(".svg-wrap svg") as SVGSVGElement | null;
                if (svgEl) downloadSvgAsPng(svgEl, `wiring-diagram-${board.id}.png`);
              }}
            >
              Download diagram as PNG
            </button>
          </section>

          <section className="sketch-card">
            <h2>Arduino Sketch</h2>
            <pre className="sketch-preview">{sketch}</pre>
            <button
              onClick={() => sketch && downloadTextFile(`button_box_${board.id}.ino`, sketch)}
            >
              Download .ino
            </button>
          </section>

          <section className="label-card">
            <h2>HID Button Label Sheet</h2>
            <LabelSheet plan={result.plan} board={board} />
            <button className="no-print" onClick={() => window.print()}>
              Print / Save as PDF
            </button>
          </section>
        </>
      )}
    </div>
  );
}

export default App;
