import { useLayoutEffect, useRef, type CSSProperties } from "react";
import { useDiagram } from "../store/diagram";
import { EM_PX, EX_PX, PT_PX, fittedDiameter } from "./geometry";
import { LatexLabel } from "./LatexLabel";

function nodeStyle(size: number): CSSProperties {
  const arrow = 3 * EX_PX;
  return {
    "--em-size": `${EM_PX}px`,
    "--node-size": `${size}px`,
    "--arrow-length": `${arrow}px`,
    "--line-width": `${0.4 * PT_PX}px`,
    "--arrow-head": `${5 * PT_PX}px`,
    "--arrow-head-half": `${2 * PT_PX}px`,
    "--double-gap": `${(0.6 * EM_PX) / 10}px`,
    "--double-ring": `${EM_PX / 10}px`,
  } as CSSProperties;
}

export function StateNode({
  id,
  label,
  initial,
  accepting,
  selected,
  active = false,
}: {
  id: string;
  label: string;
  initial?: boolean;
  accepting?: boolean;
  selected: boolean;
  active?: boolean;
}) {
  const minSize = useDiagram((state) => state.nodeSize);
  const size = useDiagram((state) => state.displaySizes[id] ?? minSize);
  const setDisplaySize = useDiagram((state) => state.setDisplaySize);
  const labelRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    let cancelled = false;
    const measure = () => {
      if (cancelled) return;
      const element = labelRef.current;
      const next = element
        ? fittedDiameter(element.offsetWidth, element.offsetHeight, minSize)
        : minSize;
      setDisplaySize(id, next);
    };
    measure();
    void document.fonts?.ready.then(measure);
    return () => {
      cancelled = true;
    };
  }, [label, id, minSize, setDisplaySize, size]);

  const classes = ["state-node", accepting ? "accepting" : "", selected ? "selected" : "", active ? "active" : ""]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={classes} style={nodeStyle(size)}>
      {initial ? (
        <span className="initial-arrow">
          <span className="initial-label">start</span>
        </span>
      ) : null}
      <span ref={labelRef} className="state-label">
        <LatexLabel className="state-math" label={label} />
      </span>
    </div>
  );
}
