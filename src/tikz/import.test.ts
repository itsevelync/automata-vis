import { describe, expect, it } from "vitest";
import { generateTikZ } from "./generate";
import { importTikZ } from "./import";
import type { Diagram } from "../model/types";

const dfa: Diagram = {
  defaults: { nodeDistance: "3cm", scale: 1 },
  nodes: [
    { id: "q0", label: "q_0", col: 0, row: 0, initial: true },
    { id: "q1", label: "q_1", col: 1, row: 0, accepting: true },
  ],
  edges: [{ id: "e1", source: "q0", target: "q1", label: "0" }],
};

describe("importTikZ", () => {
  it("round-trips an exported diagram", () => {
    const imported = importTikZ(generateTikZ(dfa));
    expect(typeof imported).not.toBe("string");
    if (typeof imported === "string") return;
    expect(imported.kind).toBe("dfa");
    expect(imported.nodes).toEqual(dfa.nodes);
    expect(imported.edges[0]).toMatchObject({ source: "q0", target: "q1", label: "0" });
  });

  it("reads a loop option after a space", () => {
    const imported = importTikZ(String.raw`
      \begin{tikzpicture}[node distance=3cm]
        \node[state,initial,accepting] (q0) {$q_0$};
        \node[state] (q1) [right=of q0] {$q_1$};
        \path
        (q0) edge [loop above] node {$0$} ()
        (q0) edge node {$1$} (q1);
      \end{tikzpicture}
    `);
    expect(typeof imported).not.toBe("string");
    if (typeof imported === "string") return;
    expect(imported.edges[0]).toMatchObject({ source: "q0", target: "q0", loop: "above", label: "0" });
    expect(imported.edges[1]).toMatchObject({ source: "q0", target: "q1", label: "1" });
  });

  it("places a hand-written diagonal and switches to a PDA", () => {
    const imported = importTikZ(String.raw`
      \begin{tikzpicture}[node distance=1.5cm, scale=1]
        \node[state,initial] (q0) {$q_{0}$};
        \node[state] (q1) [below left=of q0] {$q_{1}$};
        \path (q0) edge node {$\varepsilon,\varepsilon\to\$$} (q1);
      \end{tikzpicture}
    `);
    expect(typeof imported).not.toBe("string");
    if (typeof imported === "string") return;
    expect(imported.kind).toBe("pda");
    expect(imported.nodes.find((node) => node.id === "q1")).toMatchObject({ col: -1, row: 1 });
    expect(imported.edges[0].label).toContain("\\to\\$");
  });
});
