import { joinLabels } from "./model/labels";
import type { AutomataKind, Diagram } from "./model/types";

const defaults = { nodeDistance: "3cm", scale: 1 };

export const dfaDiagram: Diagram = {
  defaults,
  nodes: [
    { id: "q0", label: "q_0", col: 0, row: 0, initial: true },
    { id: "q1", label: "q_1", col: 1, row: 0 },
    { id: "q2", label: "q_2", col: 2, row: 0 },
    { id: "q3", label: "q_{3}", col: 3, row: 0, accepting: true },
  ],
  edges: [
    { id: "e1", source: "q0", target: "q0", label: "0", loop: "above" },
    { id: "e2", source: "q0", target: "q1", label: "1" },
    { id: "e3", source: "q1", target: "q1", label: "1", loop: "above" },
    { id: "e4", source: "q1", target: "q2", label: "0", labelPos: { side: "above", distance: "0.01cm" } },
    { id: "e5", source: "q2", target: "q0", label: "0", bend: "left" },
    { id: "e6", source: "q2", target: "q3", label: "1", labelPos: { side: "above", distance: "0.01cm" } },
    { id: "e7", source: "q3", target: "q1", label: "1", bend: "right", labelPos: { side: "above" } },
    { id: "e8", source: "q3", target: "q2", label: "0", bend: "left" },
  ],
};

export const nfaEnds101Diagram: Diagram = {
  defaults,
  nodes: [
    { id: "q0", label: "q_0", col: 0, row: 0, initial: true },
    { id: "q1", label: "q_1", col: 1, row: 0 },
    { id: "q2", label: "q_2", col: 2, row: 0 },
    { id: "q3", label: "q_{3}", col: 3, row: 0, accepting: true },
  ],
  edges: [
    { id: "e1", source: "q0", target: "q0", lines: ["0", "1"], label: "0,1", loop: "above" },
    { id: "e2", source: "q0", target: "q1", label: "1" },
    { id: "e3", source: "q1", target: "q2", label: "0", labelPos: { side: "above", distance: "0.01cm" } },
    { id: "e4", source: "q2", target: "q3", label: "1", labelPos: { side: "above", distance: "0.01cm" } },
  ],
};

export const div3Diagram: Diagram = {
  defaults,
  nodes: [
    { id: "q0", label: "q_0", col: 0, row: 0, initial: true, accepting: true },
    { id: "q1", label: "q_1", col: 1, row: 0 },
    { id: "q2", label: "q_2", col: 2, row: 0 },
  ],
  edges: [
    { id: "e1", source: "q0", target: "q0", label: "0", loop: "above" },
    { id: "e2", source: "q0", target: "q1", label: "1" },
    { id: "e3", source: "q1", target: "q0", label: "1", bend: "left" },
    { id: "e4", source: "q1", target: "q2", label: "0" },
    { id: "e5", source: "q2", target: "q1", label: "0", bend: "left" },
    { id: "e6", source: "q2", target: "q2", label: "1", loop: "below" },
  ],
};

export const pdaDiagram: Diagram = {
  defaults,
  nodes: [
    { id: "q0", label: "q_0", col: 0, row: 0, initial: true },
    { id: "q1", label: "q_1", col: 1, row: 0 },
    { id: "q2", label: "q_2", col: 2, row: 0 },
    { id: "q3", label: "q_3", col: 3, row: 0, accepting: true },
  ],
  edges: [
    { id: "e1", source: "q0", target: "q1", label: "\\varepsilon,\\varepsilon\\to Z" },
    { id: "e2", source: "q2", target: "q2", label: "1,0\\to\\varepsilon", loop: "below" },
    { id: "e3", source: "q1", target: "q1", label: "0,\\varepsilon\\to 0", loop: "below" },
    { id: "e4", source: "q1", target: "q2", label: "\\varepsilon,\\varepsilon\\to\\varepsilon" },
    { id: "e5", source: "q2", target: "q3", label: "\\varepsilon,Z\\to\\varepsilon" },
  ],
};

export const motivatingDiagram: Diagram = {
  defaults,
  nodes: [
    { id: "qa", label: "q_\\text{accept}", col: 0, row: 0, accepting: true },
    { id: "q1", label: "q_1", col: 0, row: 1 },
    { id: "q0", label: "q_0", col: 1, row: 1, initial: true },
    { id: "q9", label: "q_9", col: 2, row: 1 },
    { id: "q7", label: "q_7", col: 0, row: 2 },
    { id: "q2", label: "q_2", col: 1, row: 2 },
    { id: "q3", label: "q_3", col: 2, row: 2 },
    { id: "q6", label: "q_6", col: 0, row: 3 },
    { id: "q5", label: "q_5", col: 1, row: 3 },
    { id: "q4", label: "q_4", col: 2, row: 3 },
  ],
  edges: [
    { id: "e1", source: "q0", target: "q9", label: "1\\to y,R" },
    { id: "e2", source: "q9", target: "q3", label: "1\\to 1,L" },
    { id: "e3", source: "q3", target: "q4", label: "y\\to x,R" },
    {
      id: "e4",
      source: "q4",
      target: "q4",
      lines: ["z\\to z,R", "y\\to y,R"],
      label: joinLabels(["z\\to z,R", "y\\to y,R"]),
      loop: "right",
    },
    { id: "e5", source: "q4", target: "q5", label: "1\\to z,L" },
    {
      id: "e6",
      source: "q5",
      target: "q5",
      label: "z\\to z,L",
      loop: "below",
    },
    {
      id: "e7",
      source: "q5",
      target: "q2",
      label: "y\\to y,L",
      labelPos: { side: "right" },
    },
    { id: "e8", source: "q5", target: "q6", label: "x\\to x,R" },
    {
      id: "e9",
      source: "q6",
      target: "q6",
      label: "z\\to y,R",
      loop: "left",
    },
    { id: "e10", source: "q6", target: "q7", label: "1\\to y,R" },
    { id: "e11", source: "q7", target: "q1", label: "1\\to y,R" },
    {
      id: "e12",
      source: "q1",
      target: "q2",
      label: "1\\to 1,L",
      labelPos: { side: "below", distance: "0.8cm" },
    },
    {
      id: "e13",
      source: "q2",
      target: "q3",
      label: "x\\to x,R",
      labelPos: { side: "below" },
    },
    {
      id: "e14",
      source: "q2",
      target: "q2",
      label: "y\\to y,L",
      loop: "above",
    },
    { id: "e15", source: "q1", target: "qa", label: "\\textvisiblespace \\to \\textvisiblespace,R" },
    {
      id: "e16",
      source: "q0",
      target: "qa",
      label: "\\textvisiblespace \\to \\textvisiblespace,R",
      labelPos: { side: "right", distance: "0.5em" },
    },
    {
      id: "e17",
      source: "q9",
      target: "qa",
      label: "\\textvisiblespace \\to \\textvisiblespace,R",
      bend: "right",
      labelPos: { side: "above", distance: ".5em" },
    },
  ],
};

const DIAGRAMS = {
  dfa: dfaDiagram,
  nfa101: nfaEnds101Diagram,
  div3: div3Diagram,
  pda: pdaDiagram,
  tm: motivatingDiagram,
} as const;

export const EXAMPLES: Record<AutomataKind, { id: string; label: string }[]> = {
  dfa: [
    { id: "dfa", label: "\\text{Ends with }101 \\text{ (DFA)}" },
    { id: "nfa101", label: "\\text{Ends with }101 \\text{ (NFA)}" },
    { id: "div3", label: "\\text{Divisible by }3" },
  ],
  pda: [{ id: "pda", label: "0^n1^n" }],
  tm: [{ id: "tm", label: "1^{n^2}" }],
};

export function exampleFor(kind: AutomataKind): Diagram {
  return kind === "pda" ? pdaDiagram : kind === "tm" ? motivatingDiagram : dfaDiagram;
}

export function exampleById(id: string): Diagram | null {
  return id in DIAGRAMS ? DIAGRAMS[id as keyof typeof DIAGRAMS] : null;
}
