import { useEffect, useRef, useState } from "react";
import { LatexLabel } from "../canvas/LatexLabel";
import {
  displayEdgeLabel,
  inputToLabel,
  joinLabels,
  joinTransition,
  labelToInput,
  splitTransition,
  type TransitionKind,
} from "../model/labels";
import { formatLength, formatMagnitude, parseLength } from "../model/length";
import type { AutomataKind, Bend, DiagramEdge, DiagramNode, Side } from "../model/types";
import { useDiagram } from "../store/diagram";

const SIDES: Side[] = ["above", "below", "left", "right"];

export function Inspector() {
  const selection = useDiagram((state) => state.selection);
  const nodes = useDiagram((state) => state.nodes);
  const edges = useDiagram((state) => state.edges);
  const updateNode = useDiagram((state) => state.updateNode);
  const updateEdge = useDiagram((state) => state.updateEdge);
  const deleteNode = useDiagram((state) => state.deleteNode);
  const deleteEdge = useDiagram((state) => state.deleteEdge);
  const automataKind = useDiagram((state) => state.automataKind);

  if (!selection) {
    return (
      <section className="panel">
        <h2>Build</h2>
        <p className="muted">Select a state or edge.</p>
      </section>
    );
  }

  if (selection.kind === "node") {
    const node = nodes.find((item) => item.id === selection.id);
    if (!node) return null;
    return <NodeInspector node={node} updateNode={updateNode} deleteNode={deleteNode} />;
  }

  const edge = edges.find((item) => item.id === selection.id);
  if (!edge) return null;
  return (
    <EdgeInspector
      edge={edge}
      automataKind={automataKind}
      updateEdge={updateEdge}
      deleteEdge={deleteEdge}
    />
  );
}

function NodeInspector({
  node,
  updateNode,
  deleteNode,
}: {
  node: DiagramNode;
  updateNode: (id: string, patch: Partial<DiagramNode>) => boolean;
  deleteNode: (id: string) => void;
}) {
  const [idDraft, setIdDraft] = useState(node.id);
  useEffect(() => setIdDraft(node.id), [node.id]);
  return (
    <section className="panel">
      <h2>State</h2>
      <label htmlFor="state-id">
        Id
        <input
          id="state-id"
          value={idDraft}
          onChange={(event) => setIdDraft(event.target.value)}
          onBlur={() => {
            if (idDraft === node.id) return;
            if (!updateNode(node.id, { id: idDraft })) setIdDraft(node.id);
          }}
        />
      </label>
      <LabelFields
        lines={node.lines ?? [node.label]}
        placeholder="q_1"
        onChange={(lines) => updateNode(node.id, { lines, label: joinLabels(lines) })}
      />
      <label htmlFor="initial-checkbox" className="check">
        <input
          id="initial-checkbox"
          type="checkbox"
          checked={Boolean(node.initial)}
          onChange={(event) => updateNode(node.id, { initial: event.target.checked })}
        />
        Initial
      </label>
      <label htmlFor="accepting-checkbox" className="check">
        <input
          id="accepting-checkbox"
          type="checkbox"
          checked={Boolean(node.accepting)}
          onChange={(event) => updateNode(node.id, { accepting: event.target.checked })}
        />
        Accepting
      </label>
      <button type="button" className="delete" onClick={() => deleteNode(node.id)}>
        Delete state
      </button>
    </section>
  );
}

function EdgeInspector({
  edge,
  automataKind,
  updateEdge,
  deleteEdge,
}: {
  edge: DiagramEdge;
  automataKind: AutomataKind;
  updateEdge: (id: string, patch: Partial<DiagramEdge>) => void;
  deleteEdge: (id: string) => void;
}) {
  const isLoop = edge.source === edge.target || edge.loop !== undefined;
  return (
    <section className="panel">
      <h2>Transition</h2>
      <div className="edge-ends">
        <p className="muted">
          {edge.source} → {isLoop ? edge.source : edge.target}
        </p>
        {edge.source !== edge.target ? (
          <button
            type="button"
            onClick={() =>
              updateEdge(edge.id, {
                source: edge.target,
                target: edge.source,
              })
            }
          >
            Swap
          </button>
        ) : null}
      </div>
      <LabelFields
        lines={edge.lines ?? [edge.label ?? ""]}
        placeholder="ε"
        maxLength={1}
        caption={LABEL_CAPTIONS[automataKind]}
        format={automataKind === "dfa" ? "plain" : automataKind}
        onChange={(lines) =>
          updateEdge(edge.id, { lines, label: displayEdgeLabel(lines, automataKind) })
        }
      />
      <label htmlFor="label-side">
        Label side
        <select
          id="label-side"
          value={edge.labelPos?.side ?? ""}
          onChange={(event) => {
            const side = event.target.value as Side | "";
            if (!side) {
              updateEdge(edge.id, { labelPos: undefined });
              return;
            }
            updateEdge(edge.id, {
              labelPos: { side, distance: edge.labelPos?.distance },
            });
          }}
        >
          <option value="">auto</option>
          {SIDES.map((side) => (
            <option key={side} value={side}>
              {side}
            </option>
          ))}
        </select>
      </label>
      {edge.labelPos ? <LabelDistance edge={edge} updateEdge={updateEdge} /> : null}
      {isLoop ? (
        <label htmlFor="loop-side">
          Loop side
          <select
            id="loop-side"
            value={edge.loop ?? "right"}
            onChange={(event) =>
              updateEdge(edge.id, { loop: event.target.value as Side, bend: undefined })
            }
          >
            {SIDES.map((side) => (
              <option key={side} value={side}>
                {side}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <label htmlFor="bend">
          Bend
          <select
            id="bend"
            value={edge.bend ?? ""}
            onChange={(event) => {
              const bend = event.target.value as Bend | "";
              updateEdge(edge.id, {
                bend: bend || undefined,
                ...(bend ? {} : { bendAngle: undefined }),
              });
            }}
          >
            <option value="">straight</option>
            <option value="left">bend left</option>
            <option value="right">bend right</option>
          </select>
        </label>
      )}
      {edge.bend ? <BendAngle edge={edge} updateEdge={updateEdge} /> : null}
      <button type="button" className="delete" onClick={() => deleteEdge(edge.id)}>
        Delete edge
      </button>
    </section>
  );
}

const LABEL_CAPTIONS: Record<AutomataKind, string> = {
  dfa: "symbol",
  tm: "read → write, move",
  pda: "input, pop → push",
};

function LabelFields({
  lines,
  placeholder,
  maxLength,
  caption,
  format = "plain",
  onChange,
}: {
  lines: string[];
  placeholder: string;
  maxLength?: number;
  caption?: string;
  format?: "plain" | TransitionKind;
  onChange: (lines: string[]) => void;
}) {
  const selectionKind = useDiagram((state) => state.selection)?.kind ?? "";
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  function fieldKey(index: number, part = 0) {
    return `${index}:${part}`;
  }

  function writeLine(index: number, value: string) {
    const next = lines.slice();
    next[index] = value;
    onChange(next);
  }

  return (
    <div className="label-lines">
      {lines.map((line, index) => (
        <div className="label-line" key={index}>
          <label htmlFor={`label-${index}`}>
            {index === 0 ? "Label" : ""}
            {index === 0 && caption ? <span className="label-caption">{caption}</span> : null}
            {format === "plain" ? (
              <input
                id={`label-${index}`}
                ref={(element) => {
                  inputs.current[fieldKey(index)] = element;
                }}
                value={labelToInput(line)}
                maxLength={maxLength}
                placeholder={caption || index === 0 ? placeholder : ""}
                onChange={(event) => writeLine(index, inputToLabel(event.target.value))}
              />
            ) : (
              <TransitionFields
                line={line}
                kind={format}
                placeholder={placeholder}
                onChange={(value) => writeLine(index, value)}
                inputRef={(part, element) => {
                  inputs.current[fieldKey(index, part)] = element;
                }}
              />
            )}
          </label>
          {index > 0 ? (
            <button type="button" className="delete" onClick={() => onChange(lines.filter((_, item) => item !== index))}>
              Delete
            </button>
          ) : null}
        </div>
      ))}
      {selectionKind !== "node" && <button type="button" onClick={() => onChange([...lines, ""])}>
        {format === "plain" ? "Add symbol" : "Add rule"}
      </button>}
    </div>
  );
}

const TRANSITION_ARROW = "\\to";

const TRANSITION_FIELDS: Record<TransitionKind, { part: 0 | 1 | 2; name: string }[]> = {
  tm: [
    { part: 0, name: "Read" },
    { part: 1, name: "Write" },
    { part: 2, name: "Move" },
  ],
  pda: [
    { part: 0, name: "Input" },
    { part: 1, name: "Pop" },
    { part: 2, name: "Push" },
  ],
};

function TransitionFields({
  line,
  kind,
  placeholder,
  onChange,
  inputRef,
}: {
  line: string;
  kind: TransitionKind;
  placeholder: string;
  onChange: (value: string) => void;
  inputRef: (part: 0 | 1 | 2, element: HTMLInputElement | null) => void;
}) {
  const parts = splitTransition(line, kind);
  const fields = TRANSITION_FIELDS[kind];

  function update(part: 0 | 1 | 2, value: string) {
    const next = parts.slice() as [string, string, string];
    next[part] = inputToLabel(value);
    if (kind === "tm" && next[2] !== "L") next[2] = "R";
    onChange(joinTransition(next, kind));
  }

  const boxes = fields.map((field) =>
    kind === "tm" && field.part === 2 ? (
      <select
        key={field.part}
        aria-label={field.name}
        value={parts[2] === "L" ? "L" : "R"}
        onChange={(event) => update(2, event.target.value)}
      >
        <option value="R">R</option>
        <option value="L">L</option>
      </select>
    ) : (
      <input
        key={field.part}
        ref={(element) => inputRef(field.part, element)}
        aria-label={field.name}
        value={labelToInput(parts[field.part])}
        maxLength={1}
        placeholder={kind === "tm" ? "\u2423" : placeholder}
        onChange={(event) => update(field.part, event.target.value)}
      />
    ),
  );

  return (
    <span className="transition-fields">
      {kind === "tm" ? (
        <>
          {boxes[0]}
          <LatexLabel className="transition-sep" label={TRANSITION_ARROW} />
          {boxes[1]}
          <span className="transition-sep">,</span>
          {boxes[2]}
        </>
      ) : (
        <>
          {boxes[0]}
          <span className="transition-sep">,</span>
          {boxes[1]}
          <LatexLabel className="transition-sep" label={TRANSITION_ARROW} />
          {boxes[2]}
        </>
      )}
    </span>
  );
}

function BendAngle({
  edge,
  updateEdge,
}: {
  edge: DiagramEdge;
  updateEdge: (id: string, patch: Partial<DiagramEdge>) => void;
}) {
  const [draft, setDraft] = useState(edge.bendAngle?.toString() ?? "");
  useEffect(() => setDraft(edge.bendAngle?.toString() ?? ""), [edge.bendAngle, edge.id]);
  return (
    <label htmlFor="bend-angle">
      Bend angle
      <input
        id="bend-angle"
        value={draft}
        placeholder="30"
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => {
          const value = draft.trim();
          if (!value) {
            updateEdge(edge.id, { bendAngle: undefined });
            return;
          }
          const angle = Number(value);
          if (!Number.isFinite(angle)) {
            setDraft(edge.bendAngle?.toString() ?? "");
            return;
          }
          updateEdge(edge.id, { bendAngle: angle });
          setDraft(String(angle));
        }}
      />
    </label>
  );
}

const LENGTH_UNITS = ["cm", "mm", "pt", "em", "ex", "in"];

function distanceParts(distance?: string): { magnitude: string; unit: string } {
  const parsed = distance ? parseLength(distance) : null;
  if (!parsed) return { magnitude: "", unit: "cm" };
  return { magnitude: formatMagnitude(parsed.magnitude), unit: parsed.unit };
}

function LabelDistance({
  edge,
  updateEdge,
}: {
  edge: DiagramEdge;
  updateEdge: (id: string, patch: Partial<DiagramEdge>) => void;
}) {
  const initial = distanceParts(edge.labelPos?.distance);
  const [magnitude, setMagnitude] = useState(initial.magnitude);
  const [unit, setUnit] = useState(initial.unit);
  useEffect(() => {
    const next = distanceParts(edge.labelPos?.distance);
    setMagnitude(next.magnitude);
    setUnit(next.unit);
  }, [edge.labelPos?.distance, edge.id]);

  function commit(nextMagnitude: string, nextUnit: string) {
    if (!edge.labelPos) return;
    const side = edge.labelPos.side;
    const value = nextMagnitude.trim();
    if (!value) {
      updateEdge(edge.id, { labelPos: { side, distance: undefined } });
      return;
    }
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount <= 0) {
      const current = distanceParts(edge.labelPos?.distance);
      setMagnitude(current.magnitude);
      setUnit(current.unit);
      return;
    }
    const distance = formatLength({ magnitude: amount, unit: nextUnit });
    if (edge.labelPos?.side === side && edge.labelPos.distance === distance) return;
    updateEdge(edge.id, { labelPos: { side, distance } });
  }

  const units = LENGTH_UNITS.includes(unit) ? LENGTH_UNITS : [unit, ...LENGTH_UNITS];
  return (
    <label htmlFor="label-distance">
      Label distance
      <span className="distance-field">
        <input
          id="label-distance"
          type="number"
          min="0"
          step="any"
          value={magnitude}
          placeholder="0.8"
          onChange={(event) => {
            const next = event.target.value;
            setMagnitude(next);
            const amount = Number(next);
            if (next.trim() && Number.isFinite(amount) && amount > 0) commit(next, unit);
          }}
          onBlur={() => commit(magnitude, unit)}
        />
        <select
          id="label-distance-unit"
          aria-label="Label distance unit"
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
