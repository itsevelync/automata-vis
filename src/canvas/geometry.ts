import type { Length } from "../model/length";

export const PX_PER_CM = 40;
export const PT_PX = (2.54 / 72.27) * PX_PER_CM;
export const EM_PX = 10 * PT_PX;
export const EX_PX = 4.30554 * PT_PX;
export const STATE_INNER_SEP = EM_PX / 3;
export const STATE_MINIMUM_SIZE = 2.5 * EM_PX;

const CM_PER_UNIT: Record<string, number> = {
  cm: 1,
  mm: 0.1,
  in: 2.54,
  pt: 2.54 / 72.27,
  bp: 2.54 / 72,
  em: (10 * 2.54) / 72.27,
  ex: (4.3 * 2.54) / 72.27,
};

export function cellSizePx(length: Length): number {
  const factor = CM_PER_UNIT[length.unit] ?? 1;
  return length.magnitude * PX_PER_CM * factor;
}

export const DEFAULT_STATE_NODE_SIZE = STATE_MINIMUM_SIZE;

export function fittedDiameter(
  contentWidth: number,
  contentHeight: number,
  minSize = STATE_MINIMUM_SIZE,
): number {
  const radius = Math.hypot(contentWidth / 2 + STATE_INNER_SEP, contentHeight / 2 + STATE_INNER_SEP);
  return Math.max(minSize, 2 * radius);
}

export function centerToCell(
  x: number,
  y: number,
  cellPx: number,
): { col: number; row: number } {
  return {
    col: Math.round(x / cellPx),
    row: Math.round(y / cellPx),
  };
}

export function snapCenter(x: number, y: number, cellPx: number) {
  const cell = centerToCell(x, y, cellPx);
  return {
    ...cell,
    x: cell.col * cellPx,
    y: cell.row * cellPx,
  };
}
