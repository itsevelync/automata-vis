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
      <label>
        Id
        <input
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
      <label className="check">
        <input
          type="checkbox"
          checked={Boolean(node.initial)}
          onChange={(event) => updateNode(node.id, { initial: event.target.checked })}
        />
        Initial
      </label>
      <label className="check">
        <input
          type="checkbox"
          checked={Boolean(node.accepting)}
          onChange={(event) => updateNode(node.id, { accepting: event.target.checked })}
        />
        Accepting
      </label>
      <button type="button" onClick={() => deleteNode(node.id)}>
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
      <h2>Edge</h2>
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
        caption={LABEL_CAPTIONS[automataKind]}
        format={automataKind === "dfa" ? "plain" : automataKind}
        onChange={(lines) =>
          updateEdge(edge.id, { lines, label: displayEdgeLabel(lines, automataKind) })
        }
      />
      <label>
        Label side
        <select
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
        <label>
          Loop side
          <select
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
        <label>
          Bend
          <select
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
      <button type="button" onClick={() => deleteEdge(edge.id)}>
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

const LABEL_SYMBOLS = [
  { command: "\\varepsilon", label: "\\varepsilon" },
  { command: "\\to", label: "\\to" },
  { command: "\\textvisiblespace", label: "\\textvisiblespace" },
];

function LabelFields({
  lines,
  placeholder,
  caption,
  format = "plain",
  onChange,
}: {
  lines: string[];
  placeholder: string;
  caption?: string;
  format?: "plain" | TransitionKind;
  onChange: (lines: string[]) => void;
}) {
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});
  const [focused, setFocused] = useState({ line: 0, part: 0 });

  function fieldKey(index: number, part = 0) {
    return `${index}:${part}`;
  }

  function writeLine(index: number, value: string) {
    const next = lines.slice();
    next[index] = value;
    onChange(next);
  }

  function insert(command: string) {
    const index = Math.min(focused.line, lines.length - 1);
    const part = format === "plain" ? 0 : focused.part;
    const input = inputs.current[fieldKey(index, part)];
    const glyph = labelToInput(command);
    if (format === "plain") {
      const shown = labelToInput(lines[index] ?? "");
      const start = input?.selectionStart ?? shown.length;
      const end = input?.selectionEnd ?? shown.length;
      writeLine(index, inputToLabel(shown.slice(0, start) + glyph + shown.slice(end)));
      placeCursor(index, 0, start + glyph.length);
      return;
    }
    const parts = splitTransition(lines[index] ?? "", format);
    const shown = labelToInput(parts[part] ?? "");
    const start = input?.selectionStart ?? shown.length;
    const end = input?.selectionEnd ?? shown.length;
    parts[part] = inputToLabel(shown.slice(0, start) + glyph + shown.slice(end));
    writeLine(index, joinTransition(parts, format));
    placeCursor(index, part, start + glyph.length);
  }

  function placeCursor(index: number, part: number, cursor: number) {
    requestAnimationFrame(() => {
      const element = inputs.current[fieldKey(index, part)];
      element?.focus();
      element?.setSelectionRange(cursor, cursor);
    });
  }

  return (
    <div className="label-lines">
      <div className="symbol-row">
        {LABEL_SYMBOLS.map((symbol) => (
          <button
            key={symbol.command}
            type="button"
            className="symbol-button"
            aria-label={symbol.command}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => insert(symbol.command)}
          >
            <LatexLabel className="symbol-math" label={symbol.label} />
          </button>
        ))}
      </div>
      {lines.map((line, index) => (
        <div className="label-line" key={index}>
          <label>
            {index === 0 ? "Label" : ""}
            {index === 0 && caption ? <span className="label-caption">{caption}</span> : null}
            {format === "plain" ? (
              <input
                ref={(element) => {
                  inputs.current[fieldKey(index)] = element;
                }}
                value={labelToInput(line)}
                placeholder={caption || index === 0 ? placeholder : ""}
                onFocus={() => setFocused({ line: index, part: 0 })}
                onChange={(event) => writeLine(index, inputToLabel(event.target.value))}
              />
            ) : (
              <TransitionFields
                line={line}
                kind={format}
                placeholder={placeholder}
                onFocus={(part) => setFocused({ line: index, part })}
                onChange={(value) => writeLine(index, value)}
                inputRef={(part, element) => {
                  inputs.current[fieldKey(index, part)] = element;
                }}
              />
            )}
          </label>
          {index > 0 ? (
            <button type="button" onClick={() => onChange(lines.filter((_, item) => item !== index))}>
              Delete
            </button>
          ) : null}
        </div>
      ))}
      <button type="button" onClick={() => onChange([...lines, ""])}>
        Add label
      </button>
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
  onFocus,
  onChange,
  inputRef,
}: {
  line: string;
  kind: TransitionKind;
  placeholder: string;
  onFocus: (part: 0 | 1 | 2) => void;
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
        placeholder={placeholder}
        onFocus={() => onFocus(field.part)}
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
    <label>
      Bend angle
      <input
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
    <label>
      Label distance
      <span className="distance-field">
        <input
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
