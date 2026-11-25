import { useEffect, useState } from "react";
import { formatLength, formatMagnitude, parseLength } from "../model/length";

const LENGTH_UNITS = ["cm", "mm", "pt", "em", "ex", "in"];

function distanceParts(distance?: string): { magnitude: string; unit: string } {
  const parsed = distance ? parseLength(distance) : null;
  if (!parsed) return { magnitude: "", unit: "cm" };
  return { magnitude: formatMagnitude(parsed.magnitude), unit: parsed.unit };
}

export function LengthField({
  id,
  label,
  value,
  placeholder,
  onCommit,
}: {
  id: string;
  label: string;
  value?: string;
  placeholder: string;
  onCommit: (distance: string | undefined) => boolean;
}) {
  const initial = distanceParts(value);
  const [magnitude, setMagnitude] = useState(initial.magnitude);
  const [unit, setUnit] = useState(initial.unit);
  useEffect(() => {
    const next = distanceParts(value);
    setMagnitude(next.magnitude);
    setUnit(next.unit);
  }, [value]);

  function commit(nextMagnitude: string, nextUnit: string) {
    const text = nextMagnitude.trim();
    if (!text) {
      if (!onCommit(undefined)) {
        const current = distanceParts(value);
        setMagnitude(current.magnitude);
        setUnit(current.unit);
      }
      return;
    }
    const amount = Number(text);
    if (!Number.isFinite(amount) || amount <= 0) {
      const current = distanceParts(value);
      setMagnitude(current.magnitude);
      setUnit(current.unit);
      return;
    }
    const distance = formatLength({ magnitude: amount, unit: nextUnit });
    if (distance === value) return;
    if (!onCommit(distance)) {
      const current = distanceParts(value);
      setMagnitude(current.magnitude);
      setUnit(current.unit);
    }
  }

  const units = LENGTH_UNITS.includes(unit) ? LENGTH_UNITS : [unit, ...LENGTH_UNITS];
  return (
    <label htmlFor={id}>
      {label}
      <span className="distance-field">
        <input
          id={id}
          type="number"
          min="0"
          step="any"
          value={magnitude}
          placeholder={placeholder}
          onChange={(event) => {
            const next = event.target.value;
            setMagnitude(next);
            const amount = Number(next);
            if (next.trim() && Number.isFinite(amount) && amount > 0) commit(next, unit);
          }}
          onBlur={() => commit(magnitude, unit)}
        />
        <select
          id={`${id}-unit`}
          aria-label={`${label} unit`}
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
  );
}
