export interface Length {
  magnitude: number;
  unit: string;
}

const LENGTH_RE = /^(\d+\.?\d*|\.\d+)\s*([A-Za-z]+)$/;

export function parseLength(input: string): Length | null {
  const trimmed = input.trim();
  if (trimmed.includes("and")) return null;
  const match = LENGTH_RE.exec(trimmed);
  if (!match || match[1].endsWith(".")) return null;
  const magnitude = Number(match[1]);
  if (!Number.isFinite(magnitude) || magnitude <= 0) return null;
  return { magnitude, unit: match[2] };
}

export function formatMagnitude(magnitude: number): string {
  const rounded = Math.round(magnitude * 1e6) / 1e6;
  return String(rounded);
}

export function formatLength(length: Length): string {
  return `${formatMagnitude(length.magnitude)}${length.unit}`;
}

export function multiplyLength(length: Length, factor: number): Length {
  return {
    magnitude: length.magnitude * factor,
    unit: length.unit,
  };
}
