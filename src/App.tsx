import { useMemo, useState } from "react";
import { BOARD_LIST, BOARDS, type BoardId } from "./boards";
import { computePlan } from "./plan";
import { generateSketch } from "./sketchGen";
import { WiringDiagram } from "./WiringDiagram";
import { LabelSheet } from "./LabelSheet";
import { downloadSvgAsPng, downloadTextFile } from "./exportUtils";
import "./App.css";

function App() {
  const [boardId, setBoardId] = useState<BoardId>("pro-micro");
  const [momentaryButtons, setMomentaryButtons] = useState(20);
  const [encoderCount, setEncoderCount] = useState(0);
  const [encodersHavePush, setEncodersHavePush] = useState(true);

  const board = BOARDS[boardId];
  const config = { momentaryButtons, encoderCount, encodersHavePush };
  const isEmpty = momentaryButtons === 0 && encoderCount === 0;
  const result = useMemo(
    () => (isEmpty ? null : computePlan(config, board)),
    [momentaryButtons, encoderCount, encodersHavePush, board, isEmpty]
  );

  const sketch = result?.ok ? generateSketch(result.plan) : null;

  return (
    <div className="app">
      <header className="app-header">
        <h1>Button Box Matrix Planner</h1>
        <p>
          Type in how many momentary buttons and rotary encoders you want and pick a board — get
          the matrix wiring diagram, the diode plan, encoder pin routing, an Arduino/HID sketch,
          and a button-number label sheet.
        </p>
      </header>

      <section className="controls-form">
        <label>
          Momentary buttons
          <input
            type="number"
            min={0}
            max={64}
            value={momentaryButtons}
            onChange={(e) => setMomentaryButtons(Math.max(0, Number(e.target.value) || 0))}
          />
        </label>

        <label>
          Rotary encoders
          <input
            type="number"
            min={0}
            max={16}
            value={encoderCount}
            onChange={(e) => setEncoderCount(Math.max(0, Number(e.target.value) || 0))}
          />
        </label>

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={encodersHavePush}
            onChange={(e) => setEncodersHavePush(e.target.checked)}
            disabled={encoderCount === 0}
          />
          Encoders have a push-button (adds to matrix)
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

      {isEmpty && (
        <div className="error-box">
          <p>Add at least one momentary button or rotary encoder to generate a plan.</p>
        </div>
      )}

      {result && !result.ok && (
        <div className="error-box">
          {result.error.kind === "too-many-buttons" && (
            <p>
              This template supports up to {result.error.maxHidButtons} HID buttons per board
              (default gamepad HID report size), but this configuration needs {result.error.requested}{" "}
              (momentary buttons + encoder push-buttons + 2 per encoder for CW/CCW). Reduce your
              control count or split across two microcontrollers.
            </p>
          )}
          {result.error.kind === "not-enough-pins" && (
            <p>
              {board.shortName} doesn't expose enough safe matrix pins for this many buttons —
              needs roughly {result.error.needed} pins, only {result.error.available} left after
              reserving encoder pins.
            </p>
          )}
          {result.error.kind === "not-enough-encoder-pins" && (
            <p>
              {board.shortName} doesn't expose enough safe pins for {encoderCount} encoders — needs{" "}
              {result.error.needed} pins (2 per encoder), only {result.error.available} available in
              this profile.
            </p>
          )}
        </div>
      )}

      {result?.ok && (
        <>
          <section className="summary-card">
            <h2>Plan Summary</h2>
            <ul className="summary-list">
              <li>
                <strong>{result.plan.totalHidButtons}</strong> total HID buttons on {board.shortName}
              </li>
              {result.plan.matrix && (
                <>
                  <li>
                    <strong>{result.plan.matrix.rows}</strong> rows &times;{" "}
                    <strong>{result.plan.matrix.cols}</strong> cols = {result.plan.matrix.totalPins}{" "}
                    matrix pins
                  </li>
                  <li>
                    Row pins: <code>{result.plan.matrix.rowPins.join(", ")}</code>
                  </li>
                  <li>
                    Column pins: <code>{result.plan.matrix.colPins.join(", ")}</code>
                  </li>
                  <li>Diode orientation: {result.plan.matrix.diode.orientation}</li>
                </>
              )}
              {result.plan.encoders.length > 0 && (
                <li>
                  {result.plan.encoders.length} encoder(s) direct-wired to {result.plan.encoders.length * 2}{" "}
                  dedicated pins (not part of the matrix)
                </li>
              )}
            </ul>
            {result.plan.matrix && <p className="diode-reasoning">{result.plan.matrix.diode.reasoning}</p>}
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
            <LabelSheet plan={result.plan} />
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
