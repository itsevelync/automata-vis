import { describe, expect, it } from "vitest";
import type { Diagram, DiagramNode } from "../model/types";
import { generateTikZ } from "./generate";

function diagram(
  nodes: DiagramNode[],
  edges: Diagram["edges"] = [],
  nodeDistance = "3cm",
): Diagram {
  return {
    defaults: { nodeDistance, scale: 1 },
    nodes,
    edges,
  };
}

const motivating: DiagramNode[] = [
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
];

describe("generateTikZ", () => {
  it("exports the motivating layout with one-step relative placement", () => {
    const tikz = generateTikZ(diagram(motivating));
    expect(tikz).toContain("on grid");
    expect(tikz).toContain("node distance=3cm");
    expect(tikz).toContain("\\usetikzlibrary{automata,arrows,positioning}");
    expect(tikz).toContain(
      "\\node[state,accepting] (qa) {$q_\\text{accept}$};",
    );
    expect(tikz).toContain("\\node[state] (q1) [below=of qa] {$q_1$};");
    expect(tikz).toContain(
      "\\node[state,initial] (q0) [right=of q1] {$q_0$};",
    );
    expect(tikz).toContain("\\node[state] (q9) [right=of q0] {$q_9$};");
    expect(tikz).toContain("\\node[state] (q7) [below=of q1] {$q_7$};");
    expect(tikz).toContain("\\node[state] (q4) [right=of q5] {$q_4$};");
    expect(tikz).not.toContain("right=3cm of");
    expect(tikz).not.toContain("right of=");
    expect(tikz).not.toContain(" at (");
  });

  it("uses k times node distance for a two-cell cardinal gap", () => {
    const tikz = generateTikZ(
      diagram([
        { id: "q0", label: "q_0", col: 0, row: 0 },
        { id: "q2", label: "q_2", col: 2, row: 0 },
      ]),
    );
    expect(tikz).toContain("\\node[state] (q2) [right=6cm of q0] {$q_2$};");
    expect(tikz).not.toContain("right=7cm of");
  });

  it("uses independent center distances for a diagonal gap", () => {
    const tikz = generateTikZ(
      diagram([
        { id: "q0", label: "q_0", col: 0, row: 0 },
        { id: "q", label: "q", col: 2, row: 1 },
      ]),
    );
    expect(tikz).toContain(
      "\\node[state] (q) [below right=3cm and 6cm of q0] {$q$};",
    );
    expect(tikz).not.toContain("xshift");
    expect(tikz).not.toContain("yshift");
  });

  it("defaults a self-loop to the right and closes it", () => {
    const tikz = generateTikZ(
      diagram([{ id: "q0", label: "q_0", col: 0, row: 0 }], [
        { id: "e1", source: "q0", target: "q0", label: "a" },
      ]),
    );
    expect(tikz).toContain("(q0) edge [loop right] node {$a$} ()");
  });

  it("keeps label offsets on the edge label, not the state", () => {
    const tikz = generateTikZ(
      diagram(
        [
          { id: "q9", label: "q_9", col: 0, row: 0 },
          { id: "qa", label: "q_a", col: 1, row: 0, accepting: true },
        ],
        [
          {
            id: "e1",
            source: "q9",
            target: "qa",
            label: "\\textvisiblespace \\to \\textvisiblespace,R",
            bend: "right",
            labelPos: { side: "above", distance: ".5em" },
          },
        ],
      ),
    );
    expect(tikz).toContain(
      "(q9) edge [bend right] node [above=.5em] {$\\textvisiblespace \\to \\textvisiblespace,R$} (qa);",
    );
    expect(tikz).toContain("\\node[state,accepting] (qa) [right=of q9]");
  });

  it("writes a custom bend angle", () => {
    const tikz = generateTikZ(
      diagram(
        [
          { id: "q0", label: "q_0", col: 0, row: 0 },
          { id: "q1", label: "q_1", col: 1, row: 0 },
        ],
        [{ id: "e1", source: "q0", target: "q1", bend: "right", bendAngle: 10 }],
      ),
    );
    expect(tikz).toContain("(q0) edge [bend right=10] (q1);");
  });

  it("writes a label distance with its unit", () => {
    const tikz = generateTikZ(
      diagram(
        [
          { id: "q0", label: "q_0", col: 0, row: 0 },
          { id: "q1", label: "q_1", col: 1, row: 0 },
        ],
        [
          {
            id: "e1",
            source: "q0",
            target: "q1",
            label: "a",
            labelPos: { side: "above", distance: "1.5cm" },
          },
        ],
      ),
    );
    expect(tikz).toContain("(q0) edge node [above=1.5cm] {$a$} (q1);");
  });
});
