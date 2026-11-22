export type Side = "above" | "below" | "left" | "right";
export type Bend = "left" | "right";
export type AutomataKind = "dfa" | "pda" | "tm";

export const AUTOMATA_KINDS: { kind: AutomataKind; label: string }[] = [
  { kind: "dfa", label: "DFA/NFA" },
  { kind: "pda", label: "PDA" },
  { kind: "tm", label: "TM" },
];

export interface DiagramNode {
  id: string;
  label: string;
  lines?: string[];
  col: number;
  row: number;
  initial?: boolean;
  accepting?: boolean;
}

export interface LabelPos {
  side: Side;
  distance?: string;
}

export interface DiagramEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  lines?: string[];
  labelPos?: LabelPos;
  loop?: Side;
  bend?: Bend;
  bendAngle?: number;
}

export interface DiagramDefaults {
  nodeDistance: string;
  scale: number;
}

export interface Diagram {
  defaults: DiagramDefaults;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}
