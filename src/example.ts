import { joinLabels } from "./model/labels";
import type { AutomataKind, Diagram } from "./model/types";

const defaults = { nodeDistance: "3cm", scale: 1 };

export const dfaEnds101Diagram: Diagram = {
  defaults,
  nodes: [
    { id: "q0", label: "q_0", col: 0, row: 0, initial: true },
    { id: "q1", label: "q_1", col: 1, row: 0 },
    { id: "q2", label: "q_2", col: 2, row: 0 },
    { id: "q3", label: "q_3", col: 3, row: 0, accepting: true },
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
    { id: "q3", label: "q_3", col: 3, row: 0, accepting: true },
  ],
  edges: [
    { id: "e1", source: "q0", target: "q0", lines: ["0", "1"], label: "0,1", loop: "above" },
    { id: "e2", source: "q0", target: "q1", label: "1" },
    { id: "e3", source: "q1", target: "q2", label: "0", labelPos: { side: "above", distance: "0.01cm" } },
    { id: "e4", source: "q2", target: "q3", label: "1", labelPos: { side: "above", distance: "0.01cm" } },
  ],
};

export const dfaDiv3Diagram: Diagram = {
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

export const pda0n1nDiagram: Diagram = {
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

export const wwRDiagram: Diagram = {
  defaults,
  nodes: [
    { id: "q0", label: "q_{0}", col: 0, row: 0, initial: true },
    { id: "q1", label: "q_{1}", col: 1, row: 0 },
    { id: "q2", label: "q_{2}", col: 2, row: 0 },
    { id: "q3", label: "q_{3}", col: 3, row: 0, accepting: true },
  ],
  edges: [
    { id: "e1", source: "q0", target: "q1", label: "\\varepsilon,\\varepsilon\\to\\$" },
    {
      id: "e2",
      source: "q1",
      target: "q1",
      lines: ["0,\\varepsilon\\to0", "1,\\varepsilon\\to1"],
      label: joinLabels(["0,\\varepsilon\\to0", "1,\\varepsilon\\to1"]),
      loop: "below",
    },
    { id: "e3", source: "q1", target: "q2", label: "\\varepsilon,\\varepsilon\\to\\varepsilon" },
    {
      id: "e4",
      source: "q2",
      target: "q2",
      lines: ["0,0\\to\\varepsilon", "1,1\\to\\varepsilon"],
      label: joinLabels(["0,0\\to\\varepsilon", "1,1\\to\\varepsilon"]),
      loop: "below",
    },
    { id: "e5", source: "q2", target: "q3", label: "\\varepsilon,\\$\\to\\varepsilon" },
  ],
};

export const tm1n2Diagram: Diagram = {
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

export const nfa4n2Diagram: Diagram = {
  defaults: { nodeDistance: "1.5cm", scale: 1 },
  nodes: [
    { id: "q0", label: "q_{0}", col: 0, row: 0, initial: true },
    { id: "q4", label: "q_{4}", col: 2, row: 0 },
    { id: "q5", label: "q_{5}", col: 4, row: 0, accepting: true },
    { id: "q3", label: "q_{3}", col: -1, row: 1 },
    { id: "q1", label: "q_{1}", col: 1, row: 1 },
    { id: "q2", label: "q_{2}", col: 0, row: 2 },
  ],
  edges: [
    { id: "e1", source: "q0", target: "q1", label: "1" },
    { id: "e2", source: "q1", target: "q2", label: "1" },
    { id: "e3", source: "q2", target: "q3", label: "1" },
    { id: "e4", source: "q3", target: "q0", label: "1" },
    { id: "e5", source: "q0", target: "q4", label: "1" },
    { id: "e6", source: "q4", target: "q5", label: "1" },
  ],
};

export const abcDiagram: Diagram = {
  defaults,
  nodes: [
    { id: "q0", label: "q_{0}", col: 0, row: 0, initial: true, accepting: true },
    { id: "q1", label: "q_{1}", col: 1, row: 0 },
    { id: "q4", label: "q_{4}", col: 2, row: 0 },
    { id: "q2", label: "q_{2}", col: 1, row: 1 },
    { id: "q5", label: "q_{5}", col: 2, row: 1 },
    { id: "q3", label: "q_{3}", col: 1, row: 2, accepting: true },
    { id: "q6", label: "q_{6}", col: 2, row: 2, accepting: true },
  ],
  edges: [
    { id: "e1", source: "q0", target: "q1", label: "\\varepsilon,\\varepsilon\\to\\$" },
    { id: "e2", source: "q1", target: "q2", label: "\\varepsilon,\\varepsilon\\to\\varepsilon", labelPos: { side: "left" } },
    { id: "e3", source: "q2", target: "q3", label: "\\varepsilon,\\$\\to\\varepsilon", labelPos: { side: "left" } },
    { id: "e4", source: "q1", target: "q4", label: "\\varepsilon,\\varepsilon\\to\\varepsilon" },
    { id: "e5", source: "q4", target: "q5", label: "\\varepsilon,\\varepsilon\\to\\varepsilon" },
    { id: "e6", source: "q5", target: "q6", label: "\\varepsilon,\\$\\to\\varepsilon" },
    { id: "e7", source: "q1", target: "q1", label: "a,\\varepsilon\\to a", loop: "above" },
    { id: "e8", source: "q2", target: "q2", label: "b,a\\to\\varepsilon", loop: "left" },
    { id: "e9", source: "q3", target: "q3", label: "c,\\varepsilon\\to\\varepsilon", loop: "left" },
    { id: "e10", source: "q4", target: "q4", label: "b,\\varepsilon\\to\\varepsilon", loop: "right" },
    { id: "e11", source: "q5", target: "q5", label: "c,a\\to\\varepsilon", loop: "right" },
  ],
};

const DIAGRAMS = {
  dfa101: dfaEnds101Diagram,
  nfa101: nfaEnds101Diagram,
  nfa4n2: nfa4n2Diagram,
  div3: dfaDiv3Diagram,
  pda0n1n: pda0n1nDiagram,
  wwr: wwRDiagram,
  abc: abcDiagram,
  tm1n2: tm1n2Diagram,
} as const;

export const EXAMPLES: Record<AutomataKind, { id: string; label: string }[]> = {
  dfa: [
    { id: "dfa101", label: "\\text{Ends with }101 \\text{ (DFA)}" },
    { id: "nfa101", label: "\\text{Ends with }101 \\text{ (NFA)}" },
    { id: "div3", label: "\\text{Divisible by }3 \\text{ (DFA)}" },
    { id: "nfa4n2", label: "\\{1^{4n+2}\\mid n\\in\\mathbb{N}\\}\\text{ (NFA)}" },
  ],
  pda: [
    { id: "pda0n1n", label: "\\{0^n1^n\\mid n\\in\\mathbb{N}\\}" },
    { id: "wwr", label: "\\{ww^R\\mid w\\in\\Sigma^*\\}" },
    { id: "abc", label: "\\{a^ib^jc^k\\mid i=j\\lor i=k\\}" },
  ],
  tm: [{ id: "tm1n2", label: "\\{1^{n^2}\\mid n\\in\\mathbb{N}\\}" }],
};

export function exampleFor(kind: AutomataKind): Diagram {
  return kind === "pda" ? pda0n1nDiagram : kind === "tm" ? tm1n2Diagram : dfaEnds101Diagram;
}

export function exampleById(id: string): Diagram | null {
  return id in DIAGRAMS ? DIAGRAMS[id as keyof typeof DIAGRAMS] : null;
}
