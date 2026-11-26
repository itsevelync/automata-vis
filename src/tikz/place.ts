import { formatLength, multiplyLength, type Length } from "../model/length";
import type { DiagramNode } from "../model/types";

export interface PlacedNode {
  node: DiagramNode;
  placement: string | null;
}

function nearest(
  nodes: DiagramNode[],
  prefer: (node: DiagramNode) => number,
): DiagramNode | undefined {
  return [...nodes].sort((a, b) => prefer(a) - prefer(b))[0];
}

export function chooseAnchor(
  node: DiagramNode,
  emitted: DiagramNode[],
): DiagramNode {
  const left = nearest(
    emitted.filter((item) => item.row === node.row && item.col < node.col),
    (item) => node.col - item.col,
  );
  if (left) return left;

  const above = nearest(
    emitted.filter((item) => item.col === node.col && item.row < node.row),
    (item) => node.row - item.row,
  );
  if (above) return above;

  const right = nearest(
    emitted.filter((item) => item.row === node.row && item.col > node.col),
    (item) => item.col - node.col,
  );
  if (right) return right;

  const below = nearest(
    emitted.filter((item) => item.col === node.col && item.row > node.row),
    (item) => item.row - node.row,
  );
  if (below) return below;

  return [...emitted].sort((a, b) => {
    const distance =
      Math.abs(a.col - node.col) +
      Math.abs(a.row - node.row) -
      (Math.abs(b.col - node.col) + Math.abs(b.row - node.row));
    return distance || a.row - b.row || a.col - b.col;
  })[0];
}

function direction(dx: number, dy: number): string {
  const vertical = dy > 0 ? "below" : dy < 0 ? "above" : "";
  const horizontal = dx > 0 ? "right" : dx < 0 ? "left" : "";
  return [vertical, horizontal].filter(Boolean).join(" ");
}

export function relativePlacement(
  node: DiagramNode,
  anchor: DiagramNode,
  distance: Length,
): string {
  const dx = node.col - anchor.col;
  const dy = node.row - anchor.row;
  const key = direction(dx, dy);
  const stepsX = Math.abs(dx);
  const stepsY = Math.abs(dy);
  if (stepsX === 0 || stepsY === 0) {
    const steps = Math.max(stepsX, stepsY);
    if (steps === 1) return `${key}=of ${anchor.id}`;
    return `${key}=${formatLength(multiplyLength(distance, steps))} of ${anchor.id}`;
  }
  const vertical = formatLength(multiplyLength(distance, stepsY));
  const horizontal = formatLength(multiplyLength(distance, stepsX));
  return `${key}=${vertical} and ${horizontal} of ${anchor.id}`;
}

export function placeNodes(nodes: DiagramNode[], distance: Length): PlacedNode[] {
  if (nodes.length === 0) return [];
  const ordered = [...nodes].sort((a, b) => a.row - b.row || a.col - b.col);
  const [anchor, ...rest] = ordered;
  const emitted = [anchor];
  const placed: PlacedNode[] = [{ node: anchor, placement: null }];
  for (const node of rest) {
    const reference = chooseAnchor(node, emitted);
    placed.push({
      node,
      placement: relativePlacement(node, reference, distance),
    });
    emitted.push(node);
  }
  return placed;
}
