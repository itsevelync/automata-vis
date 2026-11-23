import { useEffect, useState } from "react";
import { formatLength, formatMagnitude, parseLength } from "../model/length";
import { useDiagram } from "../store/diagram";

const LENGTH_UNITS = ["cm", "mm", "pt", "em", "ex", "in"];

function distanceParts(distance: string): { magnitude: string; unit: string } {
  const parsed = parseLength(distance);
  if (!parsed) return { magnitude: "", unit: "cm" };
  return { magnitude: formatMagnitude(parsed.magnitude), unit: parsed.unit };
}

export function DefaultsForm() {
  const nodeDistance = useDiagram((state) => state.nodeDistance);
  const setNodeDistance = useDiagram((state) => state.setNodeDistance);
  const initial = distanceParts(nodeDistance);
  const [magnitude, setMagnitude] = useState(initial.magnitude);
  const [unit, setUnit] = useState(initial.unit);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    const next = distanceParts(nodeDistance);
    setMagnitude(next.magnitude);
    setUnit(next.unit);
    setInvalid(false);
  }, [nodeDistance]);

  function commit(nextMagnitude: string, nextUnit: string) {
    const value = nextMagnitude.trim();
    if (!value) {
      setInvalid(true);
      const current = distanceParts(nodeDistance);
      setMagnitude(current.magnitude);
      setUnit(current.unit);
      return;
    }
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount <= 0) {
      setInvalid(true);
      const current = distanceParts(nodeDistance);
      setMagnitude(current.magnitude);
      setUnit(current.unit);
      return;
    }
    const distance = formatLength({ magnitude: amount, unit: nextUnit });
    if (distance === nodeDistance) {
      setInvalid(false);
      return;
    }
    const ok = setNodeDistance(distance);
    setInvalid(!ok);
    if (!ok) {
      const current = distanceParts(nodeDistance);
      setMagnitude(current.magnitude);
      setUnit(current.unit);
    }
  }

  const units = LENGTH_UNITS.includes(unit) ? LENGTH_UNITS : [unit, ...LENGTH_UNITS];
  return (
    <section className="panel">
      <label>
        Node distance
        <span className="distance-field">
          <input
            type="number"
            min="0"
            step="any"
            value={magnitude}
            placeholder="3"
            onChange={(event) => {
              const next = event.target.value;
              setMagnitude(next);
              setInvalid(false);
              const amount = Number(next);
              if (next.trim() && Number.isFinite(amount) && amount > 0) commit(next, unit);
            }}
            onBlur={() => commit(magnitude, unit)}
          />
          <select
            aria-label="Node distance unit"
            value={unit}
            onChange={(event) => {
              const nextUnit = event.target.value;
              setUnit(nextUnit);
              if (magnitude.trim()) commit(magnitude, nextUnit);
            }}
          >
            {units.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </span>
      </label>
      {invalid ? <p className="error">Use one positive length, such as 3cm.</p> : null}
      <p className="muted">Center-to-center. Changing it rescales the grid and does not move cells.</p>
    </section>
  );
}
