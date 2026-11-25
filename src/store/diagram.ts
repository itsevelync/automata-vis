import { create } from "zustand";
import { exampleById, exampleFor } from "../example";
import { isValidId, nextStateId } from "../model/ids";
import { DEFAULT_STATE_NODE_SIZE } from "../canvas/geometry";
import { displayEdgeLabel } from "../model/labels";
import { parseLength } from "../model/length";
import type {
  AutomataKind,
  Bend,
  Diagram,
  DiagramEdge,
  DiagramNode,
  LabelPos,
  Side,
} from "../model/types";

export type Selection =
  | { kind: "node"; id: string }
  | { kind: "edge"; id: string }
  | null;

interface DiagramState {
  automataKind: AutomataKind;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  nodeDistance: string;
  nodeSize: number;
  displaySizes: Record<string, number>;
  scale: number;
  selection: Selection;
  edgeSeq: number;
  addNode: (col: number, row: number) => boolean;
  moveNode: (id: string, col: number, row: number) => boolean;
  updateNode: (id: string, patch: Partial<DiagramNode>) => boolean;
  deleteNode: (id: string) => void;
  addEdge: (source: string, target: string, selectEdge?: boolean) => void;
  updateEdge: (id: string, patch: Partial<DiagramEdge>) => void;
  deleteEdge: (id: string) => void;
  deleteSelection: () => void;
  setNodeDistance: (value: string) => boolean;
  setDisplaySize: (id: string, size: number) => void;
  select: (selection: Selection) => void;
  setAutomataKind: (kind: AutomataKind) => void;
  loadExample: (id?: string) => void;
  importDiagram: (diagram: Diagram & { kind: AutomataKind }) => void;
  clear: () => void;
}

const STORAGE_KEY = "automata-vis-diagram";

function storedDiagram(): Partial<DiagramState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DiagramState>;
    if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) return null;
    if (parsed.automataKind !== "dfa" && parsed.automataKind !== "pda" && parsed.automataKind !== "tm") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

const stored = storedDiagram();

function occupied(nodes: DiagramNode[], col: number, row: number, ignoreId?: string) {
  return nodes.some(
    (node) => node.id !== ignoreId && node.col === col && node.row === row,
  );
}

export const useDiagram = create<DiagramState>((set, get) => ({
  automataKind: stored?.automataKind ?? "dfa",
  nodes: stored?.nodes ?? [],
  edges: stored?.edges ?? [],
  nodeDistance: stored?.nodeDistance ?? "3cm",
  nodeSize: DEFAULT_STATE_NODE_SIZE,
  displaySizes: {},
  scale: stored?.scale ?? 1,
  selection: null,
  edgeSeq: stored?.edgeSeq ?? 1,
  addNode: (col, row) => {
    const { nodes } = get();
    if (occupied(nodes, col, row)) return false;
    const id = nextStateId(nodes.map((node) => node.id));
    const label = id.replace(/^q(\d+)$/, "q_{$1}");
    set({
      nodes: [...nodes, { id, label, col, row, ...(nodes.length === 0 ? { initial: true } : {}) }],
      selection: { kind: "node", id },
    });
    return true;
  },
  moveNode: (id, col, row) => {
    const { nodes } = get();
    const current = nodes.find((node) => node.id === id);
    if (!current) return false;
    if (current.col === col && current.row === row) return true;
    if (occupied(nodes, col, row, id)) return false;
    set({
      nodes: nodes.map((node) => (node.id === id ? { ...node, col, row } : node)),
    });
    return true;
  },
  updateNode: (id, patch) => {
    const { nodes, edges } = get();
    const current = nodes.find((node) => node.id === id);
    if (!current) return false;
    if (patch.id !== undefined && patch.id !== id) {
      if (!isValidId(patch.id) || nodes.some((node) => node.id === patch.id)) {
        return false;
      }
    }
    if (
      patch.col !== undefined &&
      patch.row !== undefined &&
      occupied(nodes, patch.col, patch.row, id)
    ) {
      return false;
    }
    const nextId = patch.id ?? id;
    const selection = get().selection;
    const displaySizes = { ...get().displaySizes };
    if (nextId !== id && displaySizes[id] !== undefined) {
      displaySizes[nextId] = displaySizes[id];
      delete displaySizes[id];
    }
    set({
      displaySizes,
      nodes: nodes.map((node) => (node.id === id ? { ...node, ...patch, id: nextId } : node)),
      edges: edges.map((edge) => ({
        ...edge,
        source: edge.source === id ? nextId : edge.source,
        target: edge.target === id ? nextId : edge.target,
      })),
      selection:
        selection?.kind === "node" && selection.id === id
          ? { kind: "node", id: nextId }
          : selection,
    });
    return true;
  },
  deleteNode: (id) => {
    const displaySizes = { ...get().displaySizes };
    delete displaySizes[id];
    set({
      displaySizes,
      nodes: get().nodes.filter((node) => node.id !== id),
      edges: get().edges.filter((edge) => edge.source !== id && edge.target !== id),
      selection: get().selection?.id === id ? null : get().selection,
    });
  },
  addEdge: (source, target, selectEdge = true) => {
    const id = `e${get().edgeSeq}`;
    const loop = source === target;
    const lines = [""];
    const edge: DiagramEdge = {
      id,
      source,
      target,
      lines,
      label: displayEdgeLabel(lines, get().automataKind),
      ...(loop ? { loop: "right" as Side } : {}),
    };
    set({
      edges: [...get().edges, edge],
      edgeSeq: get().edgeSeq + 1,
      ...(selectEdge ? { selection: { kind: "edge" as const, id } } : {}),
    });
  },
  updateEdge: (id, patch) => {
    set({
      edges: get().edges.map((edge) => (edge.id === id ? { ...edge, ...patch } : edge)),
    });
  },
  deleteEdge: (id) => {
    set({
      edges: get().edges.filter((edge) => edge.id !== id),
      selection: get().selection?.id === id ? null : get().selection,
    });
  },
  deleteSelection: () => {
    const selection = get().selection;
    if (!selection) return;
    if (selection.kind === "node") get().deleteNode(selection.id);
    else get().deleteEdge(selection.id);
  },
  setNodeDistance: (value) => {
    if (!parseLength(value)) return false;
    set({ nodeDistance: value.trim() });
    return true;
  },
  setDisplaySize: (id, size) => {
    const current = get().displaySizes[id];
    if (current !== undefined && Math.abs(current - size) < 1) return;
    set({ displaySizes: { ...get().displaySizes, [id]: size } });
  },
  select: (selection) => set({ selection }),
  setAutomataKind: (automataKind) => set({ automataKind }),
  loadExample: (id) => {
    const example = (id ? exampleById(id) : null) ?? exampleFor(get().automataKind);
    set({
      nodes: example.nodes.map((node) => ({ ...node })),
      edges: example.edges.map((edge) => ({
        ...edge,
        ...(edge.lines ? { lines: [...edge.lines] } : {}),
        ...(edge.labelPos ? { labelPos: { ...edge.labelPos } } : {}),
      })),
      nodeDistance: example.defaults.nodeDistance,
      scale: example.defaults.scale,
      selection: null,
      edgeSeq: example.edges.length + 1,
      displaySizes: {},
    });
  },
  importDiagram: ({ kind, nodes, edges, defaults }) => {
    set({
      automataKind: kind,
      nodes: nodes.map((node) => ({ ...node })),
      edges: edges.map((edge) => ({
        ...edge,
        ...(edge.lines ? { lines: [...edge.lines] } : {}),
        ...(edge.labelPos ? { labelPos: { ...edge.labelPos } } : {}),
      })),
      nodeDistance: defaults.nodeDistance,
      scale: defaults.scale,
      selection: null,
      edgeSeq: edges.length + 1,
      displaySizes: {},
    });
  },
  clear: () => {
    set({ nodes: [], edges: [], selection: null, edgeSeq: 1, displaySizes: {} });
  },
}));

useDiagram.subscribe((state) => {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      automataKind: state.automataKind,
      nodes: state.nodes,
      edges: state.edges,
      nodeDistance: state.nodeDistance,
      scale: state.scale,
      edgeSeq: state.edgeSeq,
    }),
  );
});

export type { Bend, LabelPos, Side };
