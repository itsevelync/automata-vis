import { useLayoutEffect, useRef, useState } from "react";
import type { DiagramEdge, LabelPos } from "../model/types";
import { parseLength } from "../model/length";
import { LatexLabel } from "./LatexLabel";
import { EM_PX, PT_PX, PX_PER_CM, STATE_INNER_SEP, cellSizePx } from "./geometry";
import {
  bendEdge,
  curvePoint,
  curveTangent,
  labelCenter,
  loopEdge,
  straightEdge,
  type Circle,
  type Curve,
} from "./tikzPath";

const LOOP_MIN_PX = 0.5 * PX_PER_CM;
export const EDGE_STROKE = 0.4 * PT_PX;

function placementDistance(pos?: LabelPos): number {
  if (!pos?.distance) return STATE_INNER_SEP;
  const parsed = parseLength(pos.distance);
  return parsed ? cellSizePx(parsed) : STATE_INNER_SEP;
}

export function buildEdgeCurve(
  edge: DiagramEdge,
  source: Circle,
  target: Circle,
): { curve: Curve; straight: boolean } | null {
  const isLoop = edge.source === edge.target || edge.loop !== undefined;
  if (isLoop) {
    const curve = loopEdge(source, edge.loop ?? "right", LOOP_MIN_PX);
    return { curve, straight: false };
  }
  if (edge.bend) {
    const curve = bendEdge(source, target, edge.bend, edge.bendAngle);
    return curve ? { curve, straight: false } : null;
  }
  const curve = straightEdge(source, target);
  return curve ? { curve, straight: true } : null;
}

export function EdgeLabel({
  edge,
  curve,
  selected,
  onSelect,
}: {
  edge: DiagramEdge;
  curve: Curve;
  selected: boolean;
  onSelect: () => void;
}) {
  const labelRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    let cancelled = false;
    const measure = () => {
      if (cancelled) return;
      const element = labelRef.current;
      if (!element) return;
      const width = element.offsetWidth;
      const height = element.offsetHeight;
      setBox((current) =>
        current.width === width && current.height === height ? current : { width, height },
      );
    };
    measure();
    void document.fonts?.ready.then(measure);
    return () => {
      cancelled = true;
    };
  }, [edge.label]);
  if (!edge.label) return null;
  const isLoop = edge.source === edge.target || edge.loop !== undefined;
  const placement = edge.labelPos
    ? { side: edge.labelPos.side, distance: placementDistance(edge.labelPos) }
    : isLoop
      ? { side: edge.loop ?? "right", distance: STATE_INNER_SEP }
      : null;
  const point = labelCenter(
    curvePoint(curve, 0.5),
    curveTangent(curve),
    box.width,
    box.height,
    placement,
    placement ? 0 : STATE_INNER_SEP,
  );
  return (
    <div
      ref={labelRef}
      className={selected ? "edge-label selected" : "edge-label"}
      style={{
        fontSize: EM_PX,
        transform: `translate(-50%, -50%) translate(${point.x}px, ${point.y}px)`,
      }}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
    >
      <LatexLabel className="edge-math" label={edge.label} />
    </div>
  );
}
