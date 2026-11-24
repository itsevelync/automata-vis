import { useEffect, useRef, useState } from "react";
import { DefaultsForm } from "../components/DefaultsForm";
import { ExportPanel } from "../components/ExportPanel";
import { Modal } from "../components/Modal";
import { EXAMPLES, exampleById } from "../example";
import { parseLength } from "../model/length";
import { useDiagram } from "../store/diagram";
import { useRun } from "../store/run";
import { useSession } from "../store/session";
import { EDGE_STROKE, EdgeLabel, buildEdgeCurve } from "./AutomataEdge";
import { PT_PX, cellSizePx, centerToCell } from "./geometry";
import { LatexLabel } from "./LatexLabel";
import { StateNode } from "./StateNode";
import { curvePath } from "./tikzPath";
import { MdAdd, MdArrowDropDown, MdBuild, MdHome, MdQuestionMark, MdRefresh, MdRemove } from "react-icons/md";
import { RiEraserFill } from "react-icons/ri";

type View = { x: number; y: number; zoom: number };

export function DiagramCanvas() {
  const nodes = useDiagram((state) => state.nodes);
  const edges = useDiagram((state) => state.edges);
  const nodeDistance = useDiagram((state) => state.nodeDistance);
  const scale = useDiagram((state) => state.scale);
  const nodeSize = useDiagram((state) => state.nodeSize);
  const displaySizes = useDiagram((state) => state.displaySizes);
  const selection = useDiagram((state) => state.selection);
  const addNode = useDiagram((state) => state.addNode);
  const moveNode = useDiagram((state) => state.moveNode);
  const addEdge = useDiagram((state) => state.addEdge);
  const deleteSelection = useDiagram((state) => state.deleteSelection);
  const select = useDiagram((state) => state.select);
  const loadExample = useDiagram((state) => state.loadExample);
  const clear = useDiagram((state) => state.clear);
  const automataKind = useDiagram((state) => state.automataKind);
  const mode = useSession((state) => state.mode);
  const activeStates = useRun((state) => state.activeStates);
  const activeEdges = useRun((state) => state.activeEdges);
  const running = mode === "run";
  const wrapRef = useRef<HTMLDivElement>(null);
  const drag = useRef<
    | { kind: "pan"; x: number; y: number; originX: number; originY: number }
    | { kind: "node"; id: string }
    | null
  >(null);
  const [view, setView] = useState<View>({ x: 48, y: 48, zoom: 1 });
  const [panning, setPanning] = useState(false);
  const [modal, setModal] = useState<"help" | "tikz" | "defaults" | null>(null);
  const [examplesOpen, setExamplesOpen] = useState(false);
  const [exampleId, setExampleId] = useState<string | null>(null);
  const [exampleIndex, setExampleIndex] = useState(0);
  const examplesRef = useRef<HTMLDivElement>(null);
  const examples = EXAMPLES[automataKind];
  const selectedExample = examples.find((example) => example.id === exampleId) ?? null;
  const exampleDirty = exampleId !== null && !sameExample(exampleId, nodes, edges, nodeDistance, scale);
  const length = parseLength(nodeDistance) ?? { magnitude: 3, unit: "cm" };
  const cellPx = cellSizePx(length);
  const viewRef = useRef(view);
  viewRef.current = view;
  const cellRef = useRef(cellPx);
  cellRef.current = cellPx;

  function flowPoint(clientX: number, clientY: number) {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (clientX - rect.left - view.x) / view.zoom,
      y: (clientY - rect.top - view.y) / view.zoom,
    };
  }

  function fit(nextNodes = nodes) {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    if (nextNodes.length === 0) {
      setView({ x: 48, y: 48, zoom: 1 });
      return;
    }
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const node of nextNodes) {
      const size = useDiagram.getState().displaySizes[node.id] ?? nodeSize;
      const x = node.col * cellPx;
      const y = node.row * cellPx;
      minX = Math.min(minX, x - size);
      minY = Math.min(minY, y - size);
      maxX = Math.max(maxX, x + size);
      maxY = Math.max(maxY, y + size);
    }
    const zoom = Math.min(
      1.6,
      Math.max(
        0.25,
        Math.min((rect.width - 80) / Math.max(1, maxX - minX), (rect.height - 80) / Math.max(1, maxY - minY)),
      ),
    );
    setView({
      zoom,
      x: (rect.width - (minX + maxX) * zoom) / 2,
      y: (rect.height - (minY + maxY) * zoom) / 2,
    });
  }

  useEffect(() => {
    setExampleId(null);
    setExamplesOpen(false);
  }, [automataKind]);

  function chooseExample(id: string) {
    setExampleId(id);
    setExamplesOpen(false);
    loadExample(id);
    window.setTimeout(() => fit(useDiagram.getState().nodes), 0);
  }

  function moveExample(delta: number) {
    if (examples.length === 0) return;
    if (!examplesOpen) {
      const current = examples.findIndex((example) => example.id === exampleId);
      setExampleIndex(current >= 0 ? current : 0);
      setExamplesOpen(true);
      return;
    }
    setExampleIndex((exampleIndex + delta + examples.length) % examples.length);
  }

  useEffect(() => {
    if (!examplesOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!examplesRef.current?.contains(event.target as Node)) setExamplesOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [examplesOpen]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (useSession.getState().mode === "run") return;
      if (event.key !== "Backspace" && event.key !== "Delete") return;
      const target = event.target as HTMLElement;
      if (target.closest("input, textarea, select")) return;
      deleteSelection();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [deleteSelection]);

  function onPointerDown(event: React.PointerEvent) {
    if (!wrapRef.current?.contains(event.target as Node)) return;
    if ((event.target as HTMLElement).closest(".state-node, .edge-label, .toolbar, .canvas-controls")) {
      return;
    }
    event.preventDefault();
    window.getSelection()?.removeAllRanges();
    drag.current = {
      kind: "pan",
      x: event.clientX,
      y: event.clientY,
      originX: view.x,
      originY: view.y,
    };
    setPanning(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const current = drag.current;
      if (!current) return;
      if (current.kind === "pan") {
        setView((previous) => ({
          ...previous,
          x: current.originX + event.clientX - current.x,
          y: current.originY + event.clientY - current.y,
        }));
        return;
      }
      const rect = wrapRef.current?.getBoundingClientRect();
      if (!rect) return;
      const active = viewRef.current;
      const point = {
        x: (event.clientX - rect.left - active.x) / active.zoom,
        y: (event.clientY - rect.top - active.y) / active.zoom,
      };
      const cell = centerToCell(point.x, point.y, cellRef.current);
      moveNode(current.id, cell.col, cell.row);
    };
    const onUp = () => {
      if (drag.current?.kind === "pan") setPanning(false);
      drag.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [moveNode]);

  function onNodePointerDown(event: React.PointerEvent, id: string) {
    event.stopPropagation();
    if (useSession.getState().mode === "run" || event.shiftKey) return;
    drag.current = { kind: "node", id };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onNodeClick(event: React.MouseEvent, id: string) {
    event.stopPropagation();
    if (useSession.getState().mode === "run") return;
    const current = useDiagram.getState().selection;
    if (event.shiftKey && current?.kind === "node") {
      addEdge(current.id, id, false);
      return;
    }
    select({ kind: "node", id });
  }

  function onDoubleClick(event: React.MouseEvent) {
    if (useSession.getState().mode === "run") return;
    if ((event.target as HTMLElement).closest(".state-node, .toolbar, .canvas-controls")) return;
    const point = flowPoint(event.clientX, event.clientY);
    const cell = centerToCell(point.x, point.y, cellPx);
    addNode(cell.col, cell.row);
  }

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = wrap.getBoundingClientRect();
      const pointerX = event.clientX - rect.left;
      const pointerY = event.clientY - rect.top;
      const active = viewRef.current;
      const nextZoom = Math.min(2.5, Math.max(0.25, active.zoom * (event.deltaY < 0 ? 1.1 : 0.9)));
      const flowX = (pointerX - active.x) / active.zoom;
      const flowY = (pointerY - active.y) / active.zoom;
      setView({ zoom: nextZoom, x: pointerX - flowX * nextZoom, y: pointerY - flowY * nextZoom });
    };
    wrap.addEventListener("wheel", onWheel, { passive: false });
    return () => wrap.removeEventListener("wheel", onWheel);
  }, []);

  function zoomBy(factor: number) {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const pointerX = rect.width / 2;
    const pointerY = rect.height / 2;
    const nextZoom = Math.min(2.5, Math.max(0.25, view.zoom * factor));
    const flowX = (pointerX - view.x) / view.zoom;
    const flowY = (pointerY - view.y) / view.zoom;
    setView({ zoom: nextZoom, x: pointerX - flowX * nextZoom, y: pointerY - flowY * nextZoom });
  }

  const circles = new Map(
    nodes.map((node) => {
      const size = displaySizes[node.id] ?? nodeSize;
      return [node.id, { x: node.col * cellPx, y: node.row * cellPx, r: size / 2 }] as const;
    }),
  );
  const grid = gridLines(
    view,
    wrapRef.current?.clientWidth ?? 800,
    wrapRef.current?.clientHeight ?? 600,
    cellPx,
  );

  return (
    <div
      className={panning ? "canvas-wrap panning" : running ? "canvas-wrap running" : "canvas-wrap"}
      ref={wrapRef}
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
      onClick={(event) => {
        if (!wrapRef.current?.contains(event.target as Node)) return;
        select(null);
      }}
    >
      <div className="toolbar">
        <div className={examplesOpen ? "example-menu open" : "example-menu"} ref={examplesRef}>
          <button
            type="button"
            className={selectedExample ? "example-select chosen" : "example-select"}
            aria-haspopup="listbox"
            aria-expanded={examplesOpen}
            onClick={() => setExamplesOpen((open) => !open)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                moveExample(1);
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                moveExample(-1);
              } else if (event.key === "Enter" && examplesOpen) {
                event.preventDefault();
                const example = examples[exampleIndex];
                if (example) chooseExample(example.id);
              } else if (event.key === "Escape") {
                setExamplesOpen(false);
              }
            }}
          >
            {selectedExample ? (
              <LatexLabel className="example-math" label={selectedExample.label} />
            ) : (
              "-- Load an example --"
            )}
            <MdArrowDropDown />
          </button>
              {exampleDirty && !examplesOpen ? (
                <button type="button" className="example-reset" onClick={() => chooseExample(exampleId!)}>
                  <MdRefresh className="inline-center" /> Reset example
                </button>
              ) : null}
              {examplesOpen ? (
            <div className="example-options" role="listbox" aria-label="Examples">
              <button type="button" className="example-placeholder" disabled>
                -- Load an example --
              </button>
              {examples.map((example, index) => (
                <button
                  key={example.id}
                  type="button"
                  role="option"
                  aria-selected={index === exampleIndex}
                  className={index === exampleIndex ? "active" : undefined}
                  onMouseEnter={() => setExampleIndex(index)}
                  onClick={() => chooseExample(example.id)}
                >
                  <LatexLabel className="example-math" label={example.label} />
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <button
          type="button"
          title="Clear canvas"
          onClick={() => {
            clear();
            setExampleId(null);
            setExamplesOpen(false);
            setView({ x: 48, y: 48, zoom: 1 });
          }}
        >
          <RiEraserFill />
        </button>
        {running ? null : (
          <>
            <button title="Canvas settings" type="button" onClick={() => setModal("defaults")}>
              <MdBuild />
            </button>
            <button title="Help" type="button" onClick={() => setModal("help")}>
              <MdQuestionMark />
            </button>
          </>
        )}
        <button title="Get LaTeX code" type="button" onClick={() => setModal("tikz")}>
          Get LaTeX code
        </button>
      </div>
      <Modal open={modal === "help"} title="Help" onClose={() => setModal(null)}>
        <ul className="help-list">
          <li>Double-click the grid to add a state.</li>
          <li>Click a state or edge to select it. Click empty space to clear the selection.</li>
          <li>Hold Shift and click a state, including the selected one, to add an edge.</li>
          <li>Select a state or edge, then press Delete or Backspace to remove it.</li>
          <li>Drag a state to move it. It snaps to the grid.</li>
          <li>Drag the background to pan. Scroll or pinch on the canvas to zoom.</li>
          <li>Use the sidebar to edit labels, initial and accepting marks, and edge direction.</li>
          <li>Defaults changes the node distance. It rescales the grid and does not move cells.</li>
          <li>Add label adds another symbol. DFA/NFA symbols are comma-separated. PDA and TM lines become a centered array.</li>
          <li>The symbol buttons insert \varepsilon, \to, and \textvisiblespace.</li>
          <li>Swap reverses an edge.</li>
          <li>Run steps the diagram on an input. Build is read-only while running.</li>
        </ul>
      </Modal>
      <Modal open={modal === "defaults"} title="Defaults" onClose={() => setModal(null)}>
        <DefaultsForm />
      </Modal>
      <Modal open={modal === "tikz"} title="TikZ" onClose={() => setModal(null)}>
        <ExportPanel />
      </Modal>
      <div className="canvas-controls">
        <button type="button" title="Zoom in" onClick={() => zoomBy(1.15)}>
          <MdAdd />
        </button>
        <button type="button" title="Zoom out" onClick={() => zoomBy(1 / 1.15)}>
          <MdRemove />
        </button>
        <button type="button" title="Fit" onClick={() => fit()}>
          <MdHome />
        </button>
      </div>
      <div
        className="viewport"
        style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})` }}
      >
        <svg className="canvas-svg">
          <defs>
            <marker
              id="automata-stealth"
              viewBox="0 0 12 10"
              markerWidth={5 * PT_PX}
              markerHeight={4 * PT_PX}
              markerUnits="userSpaceOnUse"
              refX="11"
              refY="5"
              orient="auto"
            >
              <path d="M0 0 L12 5 L0 10 L3.2 5 Z" fill="#000000" />
            </marker>
            <marker
              id="automata-stealth-selected"
              viewBox="0 0 12 10"
              markerWidth={5 * PT_PX}
              markerHeight={4 * PT_PX}
              markerUnits="userSpaceOnUse"
              refX="11"
              refY="5"
              orient="auto"
            >
              <path d="M0 0 L12 5 L0 10 L3.2 5 Z" fill="#b40c08" />
            </marker>
            <marker
              id="automata-stealth-active"
              viewBox="0 0 12 10"
              markerWidth={5 * PT_PX}
              markerHeight={4 * PT_PX}
              markerUnits="userSpaceOnUse"
              refX="11"
              refY="5"
              orient="auto"
            >
              <path d="M0 0 L12 5 L0 10 L3.2 5 Z" fill="#006ae5" />
            </marker>
          </defs>
          {grid.vertical.map((x) => (
            <line key={`v${x}`} x1={x} y1={grid.top} x2={x} y2={grid.bottom} className="grid-line" />
          ))}
          {grid.horizontal.map((y) => (
            <line key={`h${y}`} x1={grid.left} y1={y} x2={grid.right} y2={y} className="grid-line" />
          ))}
          {edges.map((edge) => {
            const source = circles.get(edge.source);
            const target = circles.get(edge.target);
            if (!source || !target) return null;
            const built = buildEdgeCurve(edge, source, target);
            if (!built) return null;
            const selected = !running && selection?.kind === "edge" && selection.id === edge.id;
            const active = running && activeEdges.includes(edge.id);
            return (
              <g key={edge.id}>
                <path
                  d={curvePath(built.curve, built.straight)}
                  className="edge-hit"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (useSession.getState().mode === "run") return;
                    select({ kind: "edge", id: edge.id });
                  }}
                />
                <path
                  d={curvePath(built.curve, built.straight)}
                  className="edge-path"
                  markerEnd={
                    active
                      ? "url(#automata-stealth-active)"
                      : selected
                        ? "url(#automata-stealth-selected)"
                        : "url(#automata-stealth)"
                  }
                  stroke={active ? "#006ae5" : selected ? "#b40c08" : "#000000"}
                  strokeWidth={EDGE_STROKE}
                />
              </g>
            );
          })}
        </svg>
        {edges.map((edge) => {
          const source = circles.get(edge.source);
          const target = circles.get(edge.target);
          if (!source || !target) return null;
          const built = buildEdgeCurve(edge, source, target);
          if (!built) return null;
          return (
            <EdgeLabel
              key={edge.id}
              edge={edge}
              curve={built.curve}
              selected={!running && selection?.kind === "edge" && selection.id === edge.id}
              onSelect={() => {
                if (useSession.getState().mode === "run") return;
                select({ kind: "edge", id: edge.id });
              }}
            />
          );
        })}
        {nodes.map((node) => (
          <div
            key={node.id}
            className="state-anchor"
            style={{ left: node.col * cellPx, top: node.row * cellPx }}
            onPointerDown={(event) => onNodePointerDown(event, node.id)}
            onClick={(event) => onNodeClick(event, node.id)}
          >
            <StateNode
              id={node.id}
              label={node.label}
              initial={node.initial}
              accepting={node.accepting}
              selected={!running && selection?.kind === "node" && selection.id === node.id}
              active={running && activeStates.includes(node.id)}
            />
          </div>
        ))}
      </div>
      {nodes.length === 0 ? (
        <p className="canvas-hint">{running ? "Switch to Build to add states." : "Double-click to add a state."}</p>
      ) : null}
    </div>
  );
}

function sameExample(
  id: string,
  nodes: { id: string }[],
  edges: { id: string }[],
  nodeDistance: string,
  scale: number,
) {
  const example = exampleById(id);
  if (!example) return true;
  return (
    nodeDistance === example.defaults.nodeDistance &&
    scale === example.defaults.scale &&
    JSON.stringify(nodes) === JSON.stringify(example.nodes) &&
    JSON.stringify(edges) === JSON.stringify(example.edges)
  );
}

function gridLines(view: View, width: number, height: number, cellPx: number) {
  const left = -view.x / view.zoom - cellPx;
  const top = -view.y / view.zoom - cellPx;
  const right = (width - view.x) / view.zoom + cellPx;
  const bottom = (height - view.y) / view.zoom + cellPx;
  const vertical: number[] = [];
  const horizontal: number[] = [];
  for (let x = Math.floor(left / cellPx) * cellPx; x <= right; x += cellPx) vertical.push(x);
  for (let y = Math.floor(top / cellPx) * cellPx; y <= bottom; y += cellPx) horizontal.push(y);
  return { left, top, right, bottom, vertical, horizontal };
}
