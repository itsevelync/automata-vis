import { useState } from "react";
import { formatLength } from "../model/length";
import { useDiagram } from "../store/diagram";
import { LengthField } from "./LengthField";

const DEFAULT_NODE_DISTANCE = 3;

export function DefaultsForm() {
  const nodeDistance = useDiagram((state) => state.nodeDistance);
  const setNodeDistance = useDiagram((state) => state.setNodeDistance);
  const showGrid = useDiagram((state) => state.showGrid);
  const setShowGrid = useDiagram((state) => state.setShowGrid);
  const [invalid, setInvalid] = useState(false);

  return (
    <section className="panel">
      <LengthField
        id="node-distance"
        label="Node distance"
        value={nodeDistance}
        placeholder={String(DEFAULT_NODE_DISTANCE)}
        onCommit={(distance) => {
          const next =
            distance ?? formatLength({ magnitude: DEFAULT_NODE_DISTANCE, unit: "cm" });
          if (next === nodeDistance) {
            setInvalid(false);
            return true;
          }
          const ok = setNodeDistance(next);
          setInvalid(!ok);
          return ok;
        }}
      />
      {invalid ? <p className="error">Use one positive length, such as 3cm.</p> : null}
      <label className="check" htmlFor="show-grid">
        <input
          id="show-grid"
          type="checkbox"
          checked={showGrid}
          onChange={(event) => setShowGrid(event.target.checked)}
        />
        Show grid lines
      </label>
    </section>
  );
}
