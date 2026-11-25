import { displayEdgeLabel } from "../model/labels";
import { parseLength } from "../model/length";
import type { AutomataKind, Bend, DiagramEdge, DiagramNode, Side } from "../model/types";

const SIDES = new Set<Side>(["above", "below", "left", "right"]);
const TO_CM: Record<string, number> = { cm: 1, mm: 0.1, in: 2.54, pt: 2.54 / 72.27, em: 0.43, ex: 0.2 };

export interface ImportedDiagram {
  kind: AutomataKind;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  nodeDistance: string;
  scale: number;
}

export function importTikZ(source: string): ImportedDiagram | string {
  const picture = source.match(/\\begin\{tikzpicture\}([\s\S]*?)\\end\{tikzpicture\}/);
  if (!picture) return "Paste a tikzpicture.";
  const body = picture[1];
  const distance = body.match(/node distance\s*=\s*([0-9.]+[A-Za-z]+)/);
  const nodeDistance = distance?.[1] ?? "3cm";
  const unit = parseLength(nodeDistance) ?? { magnitude: 3, unit: "cm" };
  const scale = Number(body.match(/scale\s*=\s*([0-9.]+)/)?.[1] ?? 1);
  const nodes = parseNodes(body, unit);
  if (typeof nodes === "string") return nodes;
  if (nodes.length === 0) return "No states found.";
  const edges = parseEdges(body, nodes);
  if (typeof edges === "string") return edges;
  const kind = detectKind(edges.map((edge) => edge.lines ?? []));
  return {
    kind,
    nodeDistance,
    scale: Number.isFinite(scale) && scale > 0 ? scale : 1,
    nodes,
    edges: edges.map((edge, index) => ({
      ...edge,
      id: `e${index + 1}`,
      label: displayEdgeLabel(edge.lines ?? [""], kind),
    })),
  };
}

function detectKind(labels: string[][]): AutomataKind {
  const lines = labels.flat();
  if (lines.some((line) => line.includes("\\to") && /,\s*[LR]\s*$/.test(line))) return "tm";
  if (lines.some((line) => line.includes("\\to") && line.slice(0, line.indexOf("\\to")).includes(","))) {
    return "pda";
  }
  if (lines.some((line) => line.includes("\\to"))) return "tm";
  return "dfa";
}

function parseNodes(body: string, distance: { magnitude: number; unit: string }): DiagramNode[] | string {
  const nodes: DiagramNode[] = [];
  const at = new Map<string, { col: number; row: number }>();
  const pattern = /\\node\s*(\[[^\]]*\])?\s*\(([^)]+)\)\s*(\[[^\]]*\])?\s*\{/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(body))) {
    const text = readBrace(body, match.index + match[0].length - 1);
    if (!text) return `Could not read the label of ${match[2]}.`;
    const id = match[2].trim();
    const options = `${match[1] ?? ""} ${match[3] ?? ""}`;
    const placement = options.match(/\[([^\]]*(?:=|of)[^\]]*)\]/)?.[1]?.trim();
    const pos = placement ? place(placement, at, distance) : { col: 0, row: 0 };
    if (!pos) return `Could not place ${id}.`;
    at.set(id, pos);
    const label = unwrapMath(text.inner);
    nodes.push({
      id,
      label,
      col: pos.col,
      row: pos.row,
      ...(options.includes("initial") ? { initial: true } : {}),
      ...(options.includes("accepting") ? { accepting: true } : {}),
    });
    pattern.lastIndex = text.end;
  }
  return nodes;
}

function place(
  placement: string,
  at: Map<string, { col: number; row: number }>,
  distance: { magnitude: number; unit: string },
): { col: number; row: number } | null {
  const match = placement.match(
    /^(above|below)?\s*(left|right)?=(?:([0-9.]+\s*[A-Za-z]+)\s+and\s+([0-9.]+\s*[A-Za-z]+)\s+|(?:([0-9.]+\s*[A-Za-z]+)\s+)?)of\s+([A-Za-z_][\w]*)$/,
  );
  if (!match) return null;
  const anchor = at.get(match[6]);
  if (!anchor) return null;
  const vertical = match[1];
  const horizontal = match[2];
  const both = match[3] && match[4];
  const single = match[5];
  const dy = vertical ? steps(both ? match[3] : single, distance) : 0;
  const dx = horizontal ? steps(both ? match[4] : single, distance) : 0;
  return {
    col: anchor.col + (horizontal === "left" ? -dx : dx),
    row: anchor.row + (vertical === "above" ? -dy : dy),
  };
}

function steps(length: string | undefined, distance: { magnitude: number; unit: string }): number {
  if (!length) return 1;
  const parsed = parseLength(length.replace(/\s+/g, ""));
  if (!parsed) return 1;
  const from = TO_CM[parsed.unit];
  const to = TO_CM[distance.unit];
  if (!from || !to) return 1;
  return Math.max(1, Math.round((parsed.magnitude * from) / (distance.magnitude * to)));
}

function parseEdges(body: string, nodes: DiagramNode[]): Omit<DiagramEdge, "id" | "label">[] | string {
  const known = new Set(nodes.map((node) => node.id));
  const edges: Omit<DiagramEdge, "id" | "label">[] = [];
  const pattern = /\(([^)]+)\)\s*edge\b/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(body))) {
    let index = skipSpace(body, pattern.lastIndex);
    const source = match[1].trim();
    if (!known.has(source)) return `Unknown state ${source}.`;
    let options = "";
    if (body[index] === "[") {
      const end = body.indexOf("]", index);
      if (end < 0) return "An edge option is missing ].";
      options = body.slice(index + 1, end);
      index = end + 1;
    }
    index = skipSpace(body, index);
    let raw = "";
    let labelPos: DiagramEdge["labelPos"];
    if (body.startsWith("node", index)) {
      index = skipSpace(body, index + 4);
      if (body[index] === "[") {
        const end = body.indexOf("]", index);
        if (end < 0) return "A label position is missing ].";
        labelPos = parseLabelPos(body.slice(index + 1, end));
        index = skipSpace(body, end + 1);
      }
      if (body[index] !== "{") return `Could not read the label on ${source}.`;
      const text = readBrace(body, index);
      if (!text) return `Could not read the label on ${source}.`;
      raw = text.inner;
      index = text.end;
    }
    index = skipSpace(body, index);
    const targetMatch = body.slice(index).match(/^\(([^)]*)\)/);
    if (!targetMatch) return `Edge from ${source} has no target.`;
    const target = targetMatch[1].trim() || source;
    if (!known.has(target)) return `Unknown state ${target}.`;
    const loop = options.match(/loop\s+(above|below|left|right)/)?.[1] as Side | undefined;
    const bendMatch = options.match(/bend\s+(left|right)(?:=([0-9.]+))?/);
    const lines = edgeLines(raw);
    edges.push({
      source,
      target: loop ? source : target,
      lines,
      ...(labelPos ? { labelPos } : {}),
      ...(loop ? { loop } : {}),
      ...(bendMatch ? { bend: bendMatch[1] as Bend } : {}),
      ...(bendMatch?.[2] ? { bendAngle: Number(bendMatch[2]) } : {}),
    });
    pattern.lastIndex = index + targetMatch[0].length;
  }
  return edges;
}

function edgeLines(raw: string): string[] {
  const source = unwrapMath(raw);
  if (!source) return [""];
  const array = source.match(/^\\begin\{array\}\{[^}]*\}([\s\S]*)\\end\{array\}$/);
  if (!array) return [source];
  const lines = array[1]
    .split("\\\\")
    .map((line) => line.trim())
    .filter((line) => line !== "");
  return lines.length ? lines : [""];
}

function parseLabelPos(option: string): DiagramEdge["labelPos"] | undefined {
  const match = option.trim().match(/^(above|below|left|right)(?:=(.+))?$/);
  if (!match || !SIDES.has(match[1] as Side)) return undefined;
  const distance = match[2]?.replace(/\s+/g, "");
  return { side: match[1] as Side, ...(distance ? { distance } : {}) };
}

function unwrapMath(label: string): string {
  const trimmed = label.trim();
  if (trimmed.startsWith("$$") && trimmed.endsWith("$$") && trimmed.length > 4) return trimmed.slice(2, -2).trim();
  if (trimmed.startsWith("$") && trimmed.endsWith("$") && trimmed.length > 2) return trimmed.slice(1, -1).trim();
  return trimmed;
}

function readBrace(text: string, start: number): { inner: string; end: number } | null {
  if (text[start] !== "{") return null;
  let depth = 0;
  for (let index = start; index < text.length; index += 1) {
    if (text[index] === "{") depth += 1;
    else if (text[index] === "}") {
      depth -= 1;
      if (depth === 0) return { inner: text.slice(start + 1, index), end: index + 1 };
    }
  }
  return null;
}

function skipSpace(text: string, index: number): number {
  while (index < text.length && /\s/.test(text[index])) index += 1;
  return index;
}
